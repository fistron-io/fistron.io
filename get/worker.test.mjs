// The redirects of get.fistron.io (node --test get/worker.test.mjs, part of npm run check).
import assert from "node:assert/strict";
import { test } from "node:test";

import worker, { installer } from "./worker.mjs";

const env = { REPOSITORY: "acme/Fistron" };
const get = (path, method = "GET") => worker.fetch(new Request(`https://get.fistron.io${path}`, { method }), env);

test("the newest release's installer", async () => {
  for (const path of ["/", "/install.sh"]) {
    const answer = await get(path);
    assert.equal(answer.status, 302);
    assert.equal(answer.headers.get("Location"), "https://github.com/acme/Fistron/releases/latest/download/install.sh");
    assert.equal(answer.headers.get("Cache-Control"), "no-store");
  }
  assert.equal((await get("/", "HEAD")).status, 302);
});

test("a version's installer", async () => {
  assert.equal(installer("acme/Fistron", "/v1.2.3"), "https://github.com/acme/Fistron/releases/download/v1.2.3/install.sh");
  assert.equal(installer("acme/Fistron", "/v1.2.3-rc.1"), "https://github.com/acme/Fistron/releases/download/v1.2.3-rc.1/install.sh");
});

test("nothing else", async () => {
  for (const path of ["/v1.2", "/../etc/passwd", "/vX.Y.Z", "/latest/../../x"]) {
    assert.equal((await get(path)).status, 404, path);
  }
  assert.equal((await get("/", "POST")).status, 405);
});
