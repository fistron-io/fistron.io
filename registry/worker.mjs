// registry.fistron.io (Fistron ADR 0155 point 1): Fistron's images and chart
// without GitHub, a pull-only proxy in front of ghcr.io/<UPSTREAM_OWNER>.
// Fistron's read token for ghcr.io (the secret GHCR_TOKEN, read:packages)
// stays in this Worker; customers never see it.
//
//   podman pull registry.fistron.io/fistron:0.4.0             anonymous
//   podman login registry.fistron.io -u licence --password-stdin < licence.paseto
//   podman pull registry.fistron.io/fistron-core:0.1.0        the licence as the password
//
// The OCI distribution API's token flow: /v2/ asks for a bearer token from
// /token, which grants pull of the open repositories to anyone and of the
// licensed ones to a valid licence or trial (../get/licence.mjs), as a
// short-lived token signed with the secret TOKEN_SECRET (HMAC-SHA256). Which
// repositories exist, and which need a licence, is the variable REPOSITORIES
// ({"name": "open" | "licence"}). Only GET and HEAD: nothing is pushed here.

import { checkLicence, keysOf } from "../get/licence.mjs";

const HOST = "registry.fistron.io";
const TOKEN_SECONDS = 300;
const API = { "Docker-Distribution-API-Version": "registry/2.0" };
const PASSED = ["Content-Type", "Content-Length", "Docker-Content-Digest", "ETag", "Location", "Link", "Cache-Control"];

const encoder = new TextEncoder();
const base64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function repositoriesOf(env) {
  return typeof env.REPOSITORIES === "string" ? JSON.parse(env.REPOSITORIES) : (env.REPOSITORIES ?? {});
}

async function hmac(secret, text) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  return base64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(text))));
}

/** A token granting pull of `repos` until `exp` (seconds). */
export async function issue(secret, repos, now = Date.now()) {
  const body = base64url(encoder.encode(JSON.stringify({ repos, exp: Math.floor(now / 1000) + TOKEN_SECONDS })));
  return `${body}.${await hmac(secret, body)}`;
}

/** The repositories a token grants, or null when it is not one of ours or has expired. */
export async function granted(secret, token, now = Date.now()) {
  const [body, mac, extra] = (token ?? "").split(".");
  if (!body || !mac || extra !== undefined) return null;
  const expected = await hmac(secret, body);
  // compared in full, whatever differs first
  let differs = expected.length !== mac.length ? 1 : 0;
  for (let i = 0; i < Math.min(expected.length, mac.length); i++) differs |= expected.charCodeAt(i) ^ mac.charCodeAt(i);
  if (differs) return null;
  let claims;
  try {
    claims = JSON.parse(atob(body.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
  return Array.isArray(claims.repos) && claims.exp > now / 1000 ? claims.repos : null;
}

function errors(status, code, message, headers = {}) {
  return new Response(JSON.stringify({ errors: [{ code, message }] }), {
    status,
    headers: { "Content-Type": "application/json", ...API, ...headers },
  });
}

function challenge(scope) {
  const scoped = scope ? `,scope="${scope}"` : "";
  return { "WWW-Authenticate": `Bearer realm="https://${HOST}/token",service="${HOST}"${scoped}` };
}

/** The password of a Basic Authorization header, or null. */
function password(request) {
  const given = request.headers.get("Authorization") ?? "";
  if (!given.startsWith("Basic ")) return null;
  try {
    const decoded = atob(given.slice("Basic ".length));
    return decoded.slice(decoded.indexOf(":") + 1);
  } catch {
    return null;
  }
}

/** GET /token: the repositories asked for that this person may pull. */
async function token(request, env, url) {
  const repositories = repositoriesOf(env);
  const asked = url.searchParams
    .getAll("scope")
    .map((s) => /^repository:([a-z0-9][a-z0-9._/-]*):([a-z,*]+)$/.exec(s))
    .filter((m) => m && m[2].split(",").includes("pull"))
    .map((m) => (m[1].startsWith(`${env.UPSTREAM_OWNER}/`) ? m[1].slice(env.UPSTREAM_OWNER.length + 1) : m[1]))
    .filter((name) => name in repositories);
  const given = password(request);
  let licensed = false;
  if (given !== null) {
    const checked = await checkLicence(given, keysOf(env));
    if (!checked.ok) {
      return errors(401, "UNAUTHORIZED", `Not signed in: ${checked.reason}. The password is your licence or trial.`, {
        "WWW-Authenticate": `Basic realm="${HOST}"`,
      });
    }
    licensed = true;
  }
  const repos = asked.filter((name) => repositories[name] === "open" || licensed);
  const issued = await issue(env.TOKEN_SECRET, repos);
  return new Response(
    JSON.stringify({ token: issued, access_token: issued, expires_in: TOKEN_SECONDS, issued_at: new Date().toISOString() }),
    { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } },
  );
}

/** The repository and the rest of a /v2/ path: <name>/manifests/<ref>, blobs/<digest>, tags/list. */
export function routeOf(path, repositories, owner = "fistron-io") {
  const m = /^\/v2\/(.+)\/(manifests\/[A-Za-z0-9_.:+-]+|blobs\/sha256:[a-f0-9]{64}|tags\/list)$/.exec(path);
  if (!m) return null;
  // the chart names its images with the owner (fistron-io/fistron-core) under
  // global.imageRegistry: the same image as without it
  const name = m[1].startsWith(`${owner}/`) ? m[1].slice(owner.length + 1) : m[1];
  if (!(name in repositories)) return null;
  return { name, rest: m[2] };
}

const upstreamTokens = new Map();

async function upstreamToken(env, name, fetcher) {
  const cached = upstreamTokens.get(name);
  if (cached && cached.until > Date.now()) return cached.token;
  const scope = `repository:${env.UPSTREAM_OWNER}/${name}:pull`;
  const answer = await fetcher(`https://ghcr.io/token?scope=${encodeURIComponent(scope)}&service=ghcr.io`, {
    headers: { Authorization: `Basic ${btoa(`fistron:${env.GHCR_TOKEN}`)}` },
  });
  if (!answer.ok) throw new Error(`ghcr.io's token: HTTP ${answer.status}`);
  const { token: issued } = await answer.json();
  upstreamTokens.set(name, { token: issued, until: Date.now() + 240 * 1000 });
  return issued;
}

async function proxied(request, env, route, search) {
  const fetcher = env.UPSTREAM_FETCH ?? fetch;
  let bearer;
  try {
    bearer = await upstreamToken(env, route.name, fetcher);
  } catch {
    return errors(503, "UNAVAILABLE", "Fistron's registry cannot reach its images right now; try again in a minute.");
  }
  const headers = { Authorization: `Bearer ${bearer}` };
  const accept = request.headers.get("Accept");
  if (accept) headers.Accept = accept;
  // the query too: tags/list's pagination (n, last)
  const answer = await fetcher(`https://ghcr.io/v2/${env.UPSTREAM_OWNER}/${route.name}/${route.rest}${search}`, {
    method: request.method,
    headers,
    redirect: "manual", // a blob's signed address: the client fetches it itself
  });
  const out = new Headers(API);
  for (const name of PASSED) {
    const value = answer.headers.get(name);
    if (value !== null) out.set(name, value);
  }
  if (answer.status === 401 || answer.status === 403) {
    return errors(503, "UNAVAILABLE", "Fistron's registry cannot read this image right now.");
  }
  return new Response(request.method === "HEAD" ? null : answer.body, { status: answer.status, headers: out });
}

export default {
  async fetch(request, env) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return errors(405, "UNSUPPORTED", "Fistron's registry is pull-only.", { Allow: "GET, HEAD" });
    }
    const url = new URL(request.url);
    if (url.pathname === "/token") return token(request, env, url);
    if (!url.pathname.startsWith("/v2/") && url.pathname !== "/v2") {
      return new Response(`Fistron's images: podman pull ${HOST}/fistron (see https://docs.fistron.io)\n`, {
        status: url.pathname === "/" ? 200 : 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
    const given = request.headers.get("Authorization") ?? "";
    const repos = given.startsWith("Bearer ")
      ? await granted(env.TOKEN_SECRET, given.slice("Bearer ".length))
      : null;
    if (url.pathname === "/v2/" || url.pathname === "/v2") {
      return repos === null
        ? errors(401, "UNAUTHORIZED", "A token from /token is needed.", challenge())
        : new Response("{}", { headers: { "Content-Type": "application/json", ...API } });
    }
    const repositories = repositoriesOf(env);
    const route = routeOf(url.pathname, repositories, env.UPSTREAM_OWNER);
    if (route === null) return errors(404, "NAME_UNKNOWN", "Not an image of Fistron's registry.");
    if (repos === null || !repos.includes(route.name)) {
      const message =
        repositories[route.name] === "licence"
          ? `${route.name} needs your licence or trial: podman login ${HOST} -u licence --password-stdin < your licence file`
          : "A token from /token is needed.";
      return errors(401, "UNAUTHORIZED", message, challenge(`repository:${route.name}:pull`));
    }
    return proxied(request, env, route, url.search);
  },
};
