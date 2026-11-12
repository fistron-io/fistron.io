// registry.fistron.io (node --test registry/*.test.mjs, part of npm run check).
import assert from "node:assert/strict";
import { test } from "node:test";

import { licence, licenceKeys } from "../get/testlicence.mjs";
import worker, { granted, issue, routeOf } from "./worker.mjs";

const DIGEST = `sha256:${"a".repeat(64)}`;
const REPOSITORIES = { fistron: "open", "charts/fistron": "open", "fistron-core": "licence" };

/** ghcr.io as the tests see it: its token, a manifest, a blob's redirect; every call recorded. */
function ghcr(calls) {
  return async (url, init = {}) => {
    calls.push({ url, init });
    if (url.startsWith("https://ghcr.io/token")) {
      if (init.headers.Authorization !== `Basic ${btoa("fistron:ghcr-read-token")}`) return new Response("", { status: 401 });
      return Response.json({ token: "upstream-token" });
    }
    if (init.headers?.Authorization !== "Bearer upstream-token") return new Response("", { status: 401 });
    if (url.endsWith(`/blobs/${DIGEST}`)) {
      return new Response(null, { status: 307, headers: { Location: "https://pkg-containers.example.test/blob?sig=1" } });
    }
    if (url.includes("/manifests/")) {
      return new Response('{"schemaVersion":2}', {
        headers: { "Content-Type": "application/vnd.oci.image.index.v1+json", "Docker-Content-Digest": DIGEST },
      });
    }
    return new Response("", { status: 404 });
  };
}

async function env(calls = []) {
  return {
    UPSTREAM_OWNER: "fistron-io",
    REPOSITORIES,
    GHCR_TOKEN: "ghcr-read-token",
    TOKEN_SECRET: "a-secret-of-the-tests-only",
    UPSTREAM_FETCH: ghcr(calls),
    ...(await licenceKeys()),
  };
}

const at = async (path, init = {}, calls = []) =>
  worker.fetch(new Request(`https://registry.fistron.io${path}`, init), await env(calls));

async function tokenFor(scope, licenceToken) {
  const headers = licenceToken ? { Authorization: `Basic ${btoa(`licence:${licenceToken}`)}` } : {};
  const answer = await at(`/token?service=registry.fistron.io&scope=${encodeURIComponent(scope)}`, { headers });
  return { status: answer.status, body: await answer.json() };
}

const pull = (path, token, calls) =>
  at(path, { headers: token ? { Authorization: `Bearer ${token}` } : {} }, calls);

test("/v2/ asks for a token from /token", async () => {
  const answer = await at("/v2/");
  assert.equal(answer.status, 401);
  assert.equal(
    answer.headers.get("WWW-Authenticate"),
    'Bearer realm="https://registry.fistron.io/token",service="registry.fistron.io"',
  );
  const { body } = await tokenFor("repository:fistron:pull");
  assert.equal((await pull("/v2/", body.token)).status, 200);
});

test("an open image anonymously; Fistron's ghcr.io token never leaves", async () => {
  const { body } = await tokenFor("repository:fistron:pull");
  const calls = [];
  const manifest = await pull("/v2/fistron/manifests/0.4.0", body.token, calls);
  assert.equal(manifest.status, 200);
  assert.equal(manifest.headers.get("Docker-Content-Digest"), DIGEST);
  assert.equal(await manifest.text(), '{"schemaVersion":2}');
  assert.equal(calls.at(-1).url, "https://ghcr.io/v2/fistron-io/fistron/manifests/0.4.0");
  const blob = await pull(`/v2/fistron/blobs/${DIGEST}`, body.token, calls);
  assert.equal(blob.status, 307);
  assert.equal(blob.headers.get("Location"), "https://pkg-containers.example.test/blob?sig=1");
  for (const answer of [manifest, blob]) {
    for (const [, value] of answer.headers) assert.ok(!value.includes("ghcr-read-token") && !value.includes("upstream-token"));
  }
  // with the owner, as the chart names it under global.imageRegistry
  const owned = await tokenFor("repository:fistron-io/fistron:pull");
  const ownedPull = await pull("/v2/fistron-io/fistron/manifests/0.4.0", owned.body.token, calls);
  assert.equal(ownedPull.status, 200);
  assert.equal(calls.at(-1).url, "https://ghcr.io/v2/fistron-io/fistron/manifests/0.4.0");
  // the chart too, by its two-part name
  const chart = await tokenFor("repository:charts/fistron:pull");
  assert.equal((await pull("/v2/charts/fistron/manifests/0.1.0-dev.20", chart.body.token)).status, 200);
});

test("the core only with a valid licence or trial as the password", async () => {
  const anonymous = await tokenFor("repository:fistron-core:pull");
  assert.equal(anonymous.status, 200);
  const refused = await pull("/v2/fistron-core/manifests/0.1.0", anonymous.body.token);
  assert.equal(refused.status, 401);
  assert.match((await refused.json()).errors[0].message, /needs your licence or trial: podman login/);

  const paid = await tokenFor("repository:fistron-core:pull", await licence({ plan: "team", tier: "paid" }));
  assert.equal((await pull("/v2/fistron-core/manifests/0.1.0", paid.body.token)).status, 200);
  const trial = await tokenFor("repository:fistron-core:pull", await licence({ plan: "trial", tier: "free" }, { trial: true }));
  assert.equal((await pull("/v2/fistron-core/manifests/0.1.0", trial.body.token)).status, 200);

  const expired = await licence({ plan: "team", tier: "paid", exp: "2026-01-01T00:00:00Z" });
  const wrong = await tokenFor("repository:fistron-core:pull", expired);
  assert.equal(wrong.status, 401);
  assert.match(wrong.body.errors[0].message, /expired on 2026-01-01/);
  assert.ok(!JSON.stringify(wrong.body).includes(expired));
  const foreign = await tokenFor("repository:fistron-core:pull", await licence({ plan: "team", tier: "paid" }, { foreign: true }));
  assert.equal(foreign.status, 401);
});

test("a token is ours, for its repositories, for five minutes", async () => {
  const secret = "s";
  const token = await issue(secret, ["fistron"], Date.UTC(2026, 10, 8));
  assert.deepEqual(await granted(secret, token, Date.UTC(2026, 10, 8, 0, 4)), ["fistron"]);
  assert.equal(await granted(secret, token, Date.UTC(2026, 10, 8, 0, 6)), null);
  assert.equal(await granted("other", token, Date.UTC(2026, 10, 8)), null);
  const [body] = token.split(".");
  const widened = btoa(JSON.stringify({ repos: ["fistron-core"], exp: 9e9 })).replace(/=+$/, "");
  assert.equal(await granted(secret, `${widened}.${token.split(".")[1]}`), null);
  assert.equal(await granted(secret, body), null);
  // a token for the open image is no token for the core
  const open = await tokenFor("repository:fistron:pull");
  assert.equal((await pull("/v2/fistron-core/manifests/0.1.0", open.body.token)).status, 401);
});

test("pull only, and only Fistron's images", async () => {
  assert.equal((await at("/v2/fistron/manifests/0.4.0", { method: "PUT" })).status, 405);
  assert.equal((await at("/v2/fistron/blobs/uploads/", { method: "POST" })).status, 405);
  const { body } = await tokenFor("repository:fistron:pull");
  for (const path of ["/v2/other/manifests/1", "/v2/fistron/../x/manifests/1", "/v2/fistron/blobs/sha256:xyz", "/v2/_catalog"]) {
    assert.equal((await pull(path, body.token)).status, 404, path);
  }
  assert.equal(routeOf("/v2/charts/fistron/tags/list", REPOSITORIES).name, "charts/fistron");
  const calls = [];
  await pull("/v2/fistron/tags/list?n=50&last=0.3", body.token, calls);
  assert.equal(calls.at(-1).url, "https://ghcr.io/v2/fistron-io/fistron/tags/list?n=50&last=0.3");
  const pushing = await tokenFor("repository:fistron:push");
  assert.equal((await pull("/v2/fistron/manifests/0.4.0", pushing.body.token)).status, 401);
});
