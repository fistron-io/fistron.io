// get.fistron.io and dl.fistron.io (node --test get/*.test.mjs, part of npm run check).
import assert from "node:assert/strict";
import { test } from "node:test";

import { licence, licenceKeys } from "./testlicence.mjs";
import worker, { fileOf } from "./worker.mjs";

/** R2 as a Map: get(key) as the binding answers it. */
function bucket(files) {
  return {
    async get(key) {
      if (!(key in files)) return null;
      const bytes = new TextEncoder().encode(files[key]);
      return {
        body: bytes,
        size: bytes.length,
        httpEtag: `"${key.length}"`,
        text: async () => files[key],
        writeHttpMetadata() {},
      };
    },
  };
}

const FILES = {
  "channels/stable.json": JSON.stringify({ channel: "stable", fistron: "0.4.0.dev31", core: "0.1.0-dev.2" }),
  "channels/staging.json": JSON.stringify({ channel: "staging", fistron: "0.4.0.dev32", core: "0.1.0-dev.3" }),
  "fistron/0.4.0.dev31/install.sh": "#!/bin/sh\n# 31\n",
  "fistron/0.4.0.dev32/install.sh": "#!/bin/sh\n# 32\n",
  "fistron/0.4.0.dev31/fistron-0.4.0.dev31-py3-none-any.whl": "wheel",
  "core/0.1.0-dev.2/fistron_core-0.1.0.dev2-cp311-abi3-macosx_11_0_arm64.whl": "core",
};
const CORE = "/core/0.1.0-dev.2/fistron_core-0.1.0.dev2-cp311-abi3-macosx_11_0_arm64.whl";

async function env(files = FILES) {
  return { DL: bucket(files), ...(await licenceKeys()) };
}
const fetchAt = async (host, path, init = {}, files = FILES) =>
  worker.fetch(new Request(`https://${host}${path}`, init), await env(files));

test("get.fistron.io: the stable channel's installer, what production runs", async () => {
  for (const path of ["/", "/install.sh", "/stable"]) {
    const answer = await fetchAt("get.fistron.io", path);
    assert.equal(answer.status, 200, path);
    assert.equal(await answer.text(), "#!/bin/sh\n# 31\n");
    assert.equal(answer.headers.get("X-Fistron-Version"), "0.4.0.dev31");
    assert.equal(answer.headers.get("Cache-Control"), "public, max-age=60");
  }
  const head = await fetchAt("get.fistron.io", "/", { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
});

test("get.fistron.io: staging's and a version's installer", async () => {
  assert.equal(await (await fetchAt("get.fistron.io", "/staging")).text(), "#!/bin/sh\n# 32\n");
  const version = await fetchAt("get.fistron.io", "/v0.4.0.dev32");
  assert.equal(version.headers.get("X-Fistron-Version"), "0.4.0.dev32");
  assert.equal(version.headers.get("Cache-Control"), "public, max-age=86400");
  assert.equal((await fetchAt("get.fistron.io", "/v0.3.0")).status, 404);
});

test("get.fistron.io: no channel yet, and anything else", async () => {
  const empty = await fetchAt("get.fistron.io", "/", {}, {});
  assert.equal(empty.status, 503);
  assert.match(await empty.text(), /No release is published/);
  for (const path of ["/v1.2", "/../etc/passwd", "/vX.Y.Z", "/latest/../../x", "/nightly"]) {
    assert.equal((await fetchAt("get.fistron.io", path)).status, 404, path);
  }
  assert.equal((await fetchAt("get.fistron.io", "/", { method: "POST" })).status, 405);
});

test("dl.fistron.io: open Fistron and the channels, without anything", async () => {
  const wheel = await fetchAt("dl.fistron.io", "/fistron/0.4.0.dev31/fistron-0.4.0.dev31-py3-none-any.whl");
  assert.equal(wheel.status, 200);
  assert.equal(await wheel.text(), "wheel");
  assert.equal(wheel.headers.get("Content-Length"), "5");
  const stable = await fetchAt("dl.fistron.io", "/channels/stable.json");
  assert.equal(JSON.parse(await stable.text()).core, "0.1.0-dev.2");
  assert.equal(stable.headers.get("Cache-Control"), "public, max-age=60");
  assert.equal((await fetchAt("dl.fistron.io", "/fistron/0.4.0.dev31/missing.whl")).status, 404);
});

test("dl.fistron.io: the core only with a valid licence or trial", async () => {
  const none = await fetchAt("dl.fistron.io", CORE);
  assert.equal(none.status, 401);
  assert.equal(none.headers.get("WWW-Authenticate"), 'Bearer realm="dl.fistron.io"');
  const bearer = async (token) => fetchAt("dl.fistron.io", CORE, { headers: { Authorization: `Bearer ${token}` } });
  const paid = await bearer(await licence({ plan: "individual", tier: "paid" }));
  assert.equal(paid.status, 200);
  assert.equal(await paid.text(), "core");
  assert.equal(paid.headers.get("Cache-Control"), "private, no-store");
  assert.equal((await bearer(await licence({ plan: "trial", tier: "free" }, { trial: true }))).status, 200);
  for (const [token, reason] of [
    [await licence({ plan: "team", tier: "paid", exp: "2026-01-01T00:00:00Z" }), /expired on 2026-01-01/],
    [await licence({ tier: "free" }), /free licence gives no download/],
    [await licence({ plan: "team", tier: "paid" }, { trial: true }), /not a licence signed by Fistron/],
    [await licence({ plan: "team", tier: "paid" }, { foreign: true }), /not a licence signed by Fistron/],
    [await licence({ plan: "team", tier: "paid", aud: "something-else" }), /not a licence for Fistron's core/],
    ["v4.public.eyJ4Ijoi", /not a licence signed by Fistron/],
  ]) {
    const answer = await bearer(token);
    assert.equal(answer.status, 403);
    const text = await answer.text();
    assert.match(text, reason);
    assert.ok(!text.includes(token), "the answer never repeats the token");
  }
});

test("dl.fistron.io: the source only to the plans that have it (Fistron ADR 0161)", async () => {
  const files = {
    ...FILES,
    "source/fistron/0.5.0/fistron-source-0.5.0.tar.gz": "fistron's source",
    "source/control-plane/0.5.0/fistron-control-plane-source-0.5.0.tar.gz": "the control plane's",
  };
  const fistron = "/source/fistron/0.5.0/fistron-source-0.5.0.tar.gz";
  const plane = "/source/control-plane/0.5.0/fistron-control-plane-source-0.5.0.tar.gz";
  const get = async (path, claims, which = {}) =>
    fetchAt("dl.fistron.io", path, { headers: { Authorization: `Bearer ${await licence(claims, which)}` } }, files);
  assert.equal((await fetchAt("dl.fistron.io", fistron, {}, files)).status, 401);
  const business = await get(fistron, { plan: "business", tier: "paid" });
  assert.equal(business.status, 200);
  assert.equal(await business.text(), "fistron's source");
  assert.equal(business.headers.get("Cache-Control"), "private, no-store");
  const notPlane = await get(plane, { plan: "business", tier: "paid" });
  assert.equal(notPlane.status, 403);
  assert.match(await notPlane.text(), /comes with enterprise, not with your plan business/);
  assert.equal((await get(plane, { plan: "enterprise", tier: "paid" })).status, 200);
  for (const [claims, which] of [
    [{ plan: "team", tier: "paid" }, {}],
    [{ plan: "individual", tier: "paid" }, {}],
    [{ plan: "trial", tier: "free" }, { trial: true }],
  ]) {
    assert.equal((await get(fistron, claims, which)).status, 403, claims.plan);
  }
  assert.deepEqual(fileOf(fistron), { key: fistron.slice(1), licence: true, plans: ["business", "enterprise"] });
  for (const path of ["/source/core/0.5.0/x", "/source/fistron/x", "/source/fistron/0.5.0/a/b", "/source/x.tar"]) {
    assert.equal(fileOf(path), null, path);
  }
});

test("dl.fistron.io: only its files", () => {
  assert.deepEqual(fileOf("/core/0.1.0-dev.2/x.whl"), { key: "core/0.1.0-dev.2/x.whl", licence: true });
  assert.deepEqual(fileOf("/bundle/0.1.0-dev.20/fistron-0.1.0-dev.20.tar.zst.001"), {
    key: "bundle/0.1.0-dev.20/fistron-0.1.0-dev.20.tar.zst.001",
    licence: true,
  });
  for (const path of [
    "/core/../fistron/x",
    "/core/x.whl",
    "/fistron/0.4.0/a/b",
    "/channels/nightly.json",
    "/private/x",
    "/fistron/0.4.0/.hidden",
    "/fistron//x",
    "/uv/0.9.5/uv.tar.gz",
    "/bundle/x.tar",
  ]) {
    assert.equal(fileOf(path), null, path);
  }
});
