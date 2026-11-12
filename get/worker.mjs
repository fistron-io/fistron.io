// get.fistron.io and dl.fistron.io (Fistron ADR 0155 point 1): what customers
// install, from Fistron's own R2 bucket, which the release workflows fill
// (Fistron's scripts/release.sh) and release-chain.sh's channels name
// (scripts/channel.sh). No GitHub account and no access to fistron-io's
// repositories are needed.
//
// get.fistron.io: the installer, `curl -fsSL https://get.fistron.io | sh`:
//   /, /install.sh     the stable channel's install.sh (what production runs)
//   /staging           the staging channel's
//   /v<version>        that version's
// dl.fistron.io: the files, each beside its SHA256SUMS and its signature:
//   /fistron/<version>/<file>   open Fistron (the wheel, install.sh, ...)
//   /channels/<channel>.json    which versions a channel names
//   /core/<version>/<file>      the closed core: only with a valid licence or
//                               trial as the bearer token (licence.mjs)
//   /bundle/<version>/<file>    the air-gapped bundle (the control plane's
//                               chart and its images, the core's among them):
//                               only with a licence, as the core
// The bucket is the binding DL; the trusted licence keys the variables
// LICENCE_KEYS and TRIAL_KEYS (lists of PASERK k4.public).

import { checkLicence, keysOf } from "./licence.mjs";

const TEXT = { "Content-Type": "text/plain; charset=utf-8" };
const CHANNELS = ["stable", "staging"];
const OPEN = ["fistron", "channels"];
const LICENSED = ["core", "bundle"];
// a version as the release workflows write it: PEP 440 (Fistron) or SemVer (the core)
const VERSION = /^\d+\.\d+\.\d+(?:[-.+][0-9A-Za-z.+-]+)?$/;
const NAME = /^[0-9A-Za-z][0-9A-Za-z._+-]*$/;

function say(status, text, headers = {}) {
  return new Response(`${text}\n`, { status, headers: { ...TEXT, ...headers } });
}

/** The R2 key of a dl.fistron.io path, and whether it needs a licence; null for anything else. */
export function fileOf(path) {
  const parts = path.split("/").slice(1);
  if (parts.some((p) => !NAME.test(p))) return null;
  const [top, ...rest] = parts;
  if (LICENSED.includes(top)) {
    if (rest.length !== 2 || !VERSION.test(rest[0])) return null;
    return { key: parts.join("/"), licence: true };
  }
  if (!OPEN.includes(top) || rest.length === 0) return null;
  if (top === "fistron" && (rest.length !== 2 || !VERSION.test(rest[0]))) return null;
  if (top === "channels" && (rest.length !== 1 || !CHANNELS.map((c) => `${c}.json`).includes(rest[0]))) return null;
  return { key: parts.join("/"), licence: false };
}

async function channel(env, name) {
  const object = await env.DL.get(`channels/${name}.json`);
  if (object === null) return null;
  const named = JSON.parse(await object.text());
  return typeof named.fistron === "string" && VERSION.test(named.fistron) ? named.fistron : null;
}

/** What get.fistron.io serves for a path: an install.sh's R2 key, or a Response. */
async function installerOf(env, path) {
  if (path === "/" || path === "/install.sh" || path === "/stable") {
    const version = await channel(env, "stable");
    return version ? { key: `fistron/${version}/install.sh`, version } : null;
  }
  if (path === "/staging") {
    const version = await channel(env, "staging");
    return version ? { key: `fistron/${version}/install.sh`, version } : null;
  }
  if (path.startsWith("/v") && VERSION.test(path.slice(2))) {
    return { key: `fistron/${path.slice(2)}/install.sh`, version: path.slice(2) };
  }
  return undefined;
}

function served(object, request, headers) {
  const out = new Headers(headers);
  object.writeHttpMetadata(out);
  out.set("ETag", object.httpEtag);
  out.set("Content-Length", String(object.size));
  if (!out.has("Content-Type")) out.set("Content-Type", "application/octet-stream");
  return new Response(request.method === "HEAD" ? null : object.body, { status: 200, headers: out });
}

async function get(request, env, url) {
  const found = await installerOf(env, url.pathname);
  if (found === undefined) {
    return say(404, "Fistron's installer: curl -fsSL https://get.fistron.io | sh -s -- --help");
  }
  if (found === null) return say(503, "No release is published on this channel yet: see https://docs.fistron.io");
  const object = await env.DL.get(found.key);
  if (object === null) return say(404, `Fistron ${found.version} has no installer here: see https://docs.fistron.io`);
  // a channel moves: a minute at most; a version's file never changes
  const cache = url.pathname.startsWith("/v") ? "public, max-age=86400" : "public, max-age=60";
  return served(object, request, {
    "Content-Type": "text/x-shellscript; charset=utf-8",
    "Cache-Control": cache,
    "X-Fistron-Version": found.version,
  });
}

async function dl(request, env, url) {
  if (url.pathname === "/") {
    return say(200, "Fistron's downloads: https://docs.fistron.io (curl -fsSL https://get.fistron.io | sh)");
  }
  const file = fileOf(url.pathname);
  if (file === null) return say(404, "Not a file of Fistron's downloads.");
  const headers = {};
  if (file.licence) {
    const given = request.headers.get("Authorization") ?? "";
    const token = given.startsWith("Bearer ") ? given.slice("Bearer ".length) : null;
    const challenge = { "WWW-Authenticate": 'Bearer realm="dl.fistron.io"', "Cache-Control": "no-store" };
    if (token === null) {
      return say(401, "Fistron's core needs your licence or trial: Authorization: Bearer <licence>", challenge);
    }
    const checked = await checkLicence(token, keysOf(env));
    if (!checked.ok) return say(403, `Fistron's core is not downloaded: ${checked.reason}.`, challenge);
    headers["Cache-Control"] = "private, no-store";
  } else {
    headers["Cache-Control"] = file.key.startsWith("channels/") ? "public, max-age=60" : "public, max-age=86400";
  }
  const object = await env.DL.get(file.key);
  if (object === null) return say(404, "Not a file of Fistron's downloads.", headers);
  return served(object, request, headers);
}

export default {
  async fetch(request, env) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return say(405, "Only GET.", { Allow: "GET, HEAD" });
    }
    const url = new URL(request.url);
    return url.hostname.startsWith("dl.") ? dl(request, env, url) : get(request, env, url);
  },
};
