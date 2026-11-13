// The Worker's R2 binding reads the bucket the release workflows write: the
// same jurisdiction (get/check-binding.mjs; 2026-11-13).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bindingProblems, endpointJurisdiction, parseJsonc } from "./check-binding.mjs";

const config = parseJsonc(readFileSync(new URL("./wrangler.jsonc", import.meta.url), "utf8"));

test("get.fistron.io's binding reads fistron-dl in the EU jurisdiction", () => {
  assert.deepEqual(config.r2_buckets, [{ binding: "DL", bucket_name: "fistron-dl", jurisdiction: "eu" }]);
  assert.deepEqual(bindingProblems(config), []);
  assert.deepEqual(bindingProblems(config, "https://abc123.eu.r2.cloudflarestorage.com"), []);
});

test("a binding of another jurisdiction than R2_ENDPOINT's is refused", () => {
  const without = { r2_buckets: [{ binding: "DL", bucket_name: "fistron-dl" }] };
  const problems = bindingProblems(without, "https://abc123.eu.r2.cloudflarestorage.com");
  assert.equal(problems.length, 2);
  assert.match(problems[1], /R2_ENDPOINT is in "eu": the Worker would read another bucket/);
  assert.match(bindingProblems(config, "https://abc123.r2.cloudflarestorage.com")[0], /R2_ENDPOINT is in "default"/);
});

test("an R2 endpoint's jurisdiction", () => {
  assert.equal(endpointJurisdiction("https://abc123.eu.r2.cloudflarestorage.com"), "eu");
  assert.equal(endpointJurisdiction("https://abc123.r2.cloudflarestorage.com"), "");
});

test("the deploy checks the binding first", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.match(pkg.scripts["deploy:get"], /^node get\/check-binding\.mjs && wrangler deploy -c get\/wrangler\.jsonc$/);
});
