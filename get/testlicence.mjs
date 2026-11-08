// Licences for the tests, signed as Fistron's issuer signs them (PASETO
// v4.public with the core's implicit assertion), with keys made for the
// test run: never Fistron's.
import { pae } from "./licence.mjs";

const HEADER = new TextEncoder().encode("v4.public.");
const IMPLICIT_ASSERTION = new TextEncoder().encode("fistron-core licence v1");

async function pair() {
  const keys = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", keys.publicKey));
  return { privateKey: keys.privateKey, paserk: `k4.public.${Buffer.from(raw).toString("base64url")}` };
}

const release = pair();
const trial = pair();
const foreign = pair();

/** The trusted keys of the Worker in the tests. */
export async function licenceKeys() {
  return { LICENCE_KEYS: [(await release).paserk], TRIAL_KEYS: [(await trial).paserk] };
}

/** A licence token with `claims` over the defaults (a year from now, Fistron's, for the core). */
export async function licence(claims, which = {}) {
  const key = await (which.trial ? trial : which.foreign ? foreign : release);
  const payload = new TextEncoder().encode(
    JSON.stringify({
      iss: "fistron",
      aud: "fistron-core",
      jti: "test-1",
      sub: "Acme",
      features: ["core"],
      nbf: "2026-01-01T00:00:00Z",
      exp: new Date(Date.now() + 365 * 86400 * 1000).toISOString().replace(/\.\d+Z$/, "Z"),
      ...claims,
    }),
  );
  const footer = new TextEncoder().encode(JSON.stringify({ kid: "k4.pid.test" }));
  const signature = new Uint8Array(
    await crypto.subtle.sign({ name: "Ed25519" }, key.privateKey, pae(HEADER, payload, footer, IMPLICIT_ASSERTION)),
  );
  const body = Buffer.concat([payload, signature]).toString("base64url");
  return `v4.public.${body}.${Buffer.from(footer).toString("base64url")}`;
}
