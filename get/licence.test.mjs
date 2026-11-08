// A licence as the Workers check it (node --test get/*.test.mjs).
import assert from "node:assert/strict";
import { test } from "node:test";

import { checkLicence, keysOf, pae, publicKeyBytes } from "./licence.mjs";
import { licence, licenceKeys } from "./testlicence.mjs";

// The free licence every core carries (fistron-core licences/free.paseto) and
// the release key that signed it (keys/release/public.paserk): the
// verification is the core's, byte for byte.
const FREE = [
  "v4.public.eyJhdWQiOiJmaXN0cm9uLWNvcmUiLCJuYmYiOiIyMDI2LTEwLTE4VDA5OjUwOjM3WiIsImlhdCI6IjIwMjYtMTAtMT",
  "hUMDk6NTA6MzdaIiwianRpIjoiZnJlZS0xIiwidGllciI6ImZyZWUiLCJsaW1pdHMiOnsiY2x1c3RlcnMiOjEsImZyYW1ld29ya3",
  "MiOm51bGwsInByb2plY3RzIjozfSwiZmVhdHVyZXMiOlsiY29yZSJdLCJpc3MiOiJmaXN0cm9uIiwic3ViIjoiZXZlcnlvbmUifX",
  "7H9NXa9LcWFSVF06ZIHGWkvCQsxWkw2TlezI1qPOAhR1drA-46KC0mB-i843IlnVIvhcI6vZar0QyYj6tM5A8.eyJraWQiOiJrNC",
  "5waWQueGx0bjBXLXFvOUZ4UUtnbXliLUhXR0hhWXlPRkJrZm14dlM5ck16VTJkNkIifQ",
].join("");
const RELEASE_KEY = "k4.public.ENRswBMS45wKfG-P3y2yS-aVjTtDBY5GPBi5NMUVtlo";

test("the core's own free licence verifies with Fistron's release key, and gives no download", async () => {
  const token = FREE;
  assert.deepEqual(await checkLicence(token, { releaseKeys: [RELEASE_KEY] }), {
    ok: false,
    reason: "a licence without an expiry gives no download",
  });
  // with another key it is no licence at all
  const other = (await licenceKeys()).LICENCE_KEYS;
  assert.equal((await checkLicence(token, { releaseKeys: other })).reason, "not a licence signed by Fistron");
});

test("a paid licence and a trial's", async () => {
  const keys = keysOf(await licenceKeys());
  const paid = await checkLicence(await licence({ plan: "business", tier: "paid" }), keys);
  assert.equal(paid.ok, true);
  assert.equal(paid.licence.plan, "business");
  assert.equal(paid.licence.licensee, "Acme");
  const notYet = await licence({ plan: "team", tier: "paid", nbf: "2999-01-01T00:00:00Z" });
  assert.equal((await checkLicence(notYet, keys)).reason, "the licence is not valid yet");
  const mixed = await licence({ plan: "trial", tier: "paid" });
  assert.equal((await checkLicence(mixed, keys)).reason, "the plan and the tier differ");
});

test("a changed licence is no licence", async () => {
  const keys = keysOf(await licenceKeys());
  const token = await licence({ plan: "individual", tier: "paid" });
  const [v, p, body, footer] = token.split(".");
  const bytes = Buffer.from(body, "base64url");
  bytes[10] ^= 1;
  const changed = [v, p, bytes.toString("base64url"), footer].join(".");
  assert.equal((await checkLicence(changed, keys)).reason, "not a licence signed by Fistron");
  // the footer is signed too
  const otherFooter = [v, p, body, Buffer.from('{"kid":"x"}').toString("base64url")].join(".");
  assert.equal((await checkLicence(otherFooter, keys)).reason, "not a licence signed by Fistron");
  for (const junk of ["", "v4.local.x.y", "v2.public.abc", "v4.public.!!!", undefined]) {
    assert.equal((await checkLicence(junk, keys)).ok, false, String(junk));
  }
});

test("PASETO's pre-authentication encoding and the key's bytes", () => {
  assert.deepEqual([...pae()], [0, 0, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual(
    [...pae(new Uint8Array([0x61]))],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0x61],
  );
  assert.equal(publicKeyBytes(RELEASE_KEY).length, 32);
  assert.throws(() => publicKeyBytes("k4.secret.abc"));
});
