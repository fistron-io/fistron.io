// A Fistron licence as dl.fistron.io and registry.fistron.io check it (Fistron
// ADR 0155 point 1): the closed core only for a valid licence or trial. A
// licence is a PASETO v4.public token (Ed25519) with the implicit assertion
// of the core's licences; it is verified here as the core verifies it
// (src/licence.rs of fistron-core): its issuer and audience, its validity
// period, and for a trial key's licence the plan trial. The free licence
// bundled with every core gives no download.

const HEADER = "v4.public.";
const IMPLICIT_ASSERTION = new TextEncoder().encode("fistron-core licence v1");
const ISSUER = "fistron";
const AUDIENCE = "fistron-core";
const PLANS = ["trial", "individual", "team", "business", "enterprise"];

function fromBase64url(text) {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) throw new Error("not base64url");
  const padded = text.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (text.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

function le64(n) {
  const bytes = new Uint8Array(8);
  let rest = n;
  for (let i = 0; i < 8; i++) {
    bytes[i] = rest & 0xff;
    rest = Math.floor(rest / 256);
  }
  bytes[7] &= 0x7f;
  return bytes;
}

/** PASETO's pre-authentication encoding of the pieces. */
export function pae(...pieces) {
  const parts = [le64(pieces.length)];
  for (const piece of pieces) parts.push(le64(piece.length), piece);
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

/** The 32 bytes of a PASERK k4.public key. */
export function publicKeyBytes(paserk) {
  const text = paserk.trim();
  if (!text.startsWith("k4.public.")) throw new Error("not a k4.public key");
  const bytes = fromBase64url(text.slice("k4.public.".length));
  if (bytes.length !== 32) throw new Error("not a k4.public key");
  return bytes;
}

async function verifies(keyBytes, message, signature) {
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "Ed25519" }, false, ["verify"]);
  return crypto.subtle.verify({ name: "Ed25519" }, key, signature, message);
}

/** The token's verified payload with the key that signed it, or null. */
async function verified(token, keys) {
  const parts = token.split(".");
  if (parts.length < 3 || parts.length > 4 || `${parts[0]}.${parts[1]}.` !== HEADER) return null;
  let body;
  let footer;
  try {
    body = fromBase64url(parts[2]);
    footer = parts.length === 4 ? fromBase64url(parts[3]) : new Uint8Array();
  } catch {
    return null;
  }
  if (body.length < 64) return null;
  const message = body.slice(0, body.length - 64);
  const signature = body.slice(body.length - 64);
  const signed = pae(new TextEncoder().encode(HEADER), message, footer, IMPLICIT_ASSERTION);
  for (const key of keys) {
    if (await verifies(key.bytes, signed, signature)) return { payload: message, trial: key.trial };
  }
  return null;
}

function at(text) {
  if (typeof text !== "string") return null;
  const time = Date.parse(text);
  return Number.isNaN(time) ? null : time;
}

/**
 * The licence a token is, when it gives the closed core: signed with a
 * trusted key, Fistron's, for the core, within its period, of a plan (the
 * free licence has none), a trial key's only of the plan trial.
 * `{ok: true, licence}` or `{ok: false, reason}`; the reason never repeats
 * the token.
 */
export async function checkLicence(token, { releaseKeys = [], trialKeys = [], now = Date.now() } = {}) {
  const keys = [
    ...releaseKeys.map((k) => ({ bytes: publicKeyBytes(k), trial: false })),
    ...trialKeys.map((k) => ({ bytes: publicKeyBytes(k), trial: true })),
  ];
  const found = typeof token === "string" ? await verified(token.trim(), keys) : null;
  if (found === null) return { ok: false, reason: "not a licence signed by Fistron" };
  let claims;
  try {
    claims = JSON.parse(new TextDecoder().decode(found.payload));
  } catch {
    return { ok: false, reason: "not a licence signed by Fistron" };
  }
  if (claims.iss !== ISSUER || claims.aud !== AUDIENCE) return { ok: false, reason: "not a licence for Fistron's core" };
  const expires = at(claims.exp);
  if (expires === null) return { ok: false, reason: "a licence without an expiry gives no download" };
  if (expires <= now) return { ok: false, reason: `the licence expired on ${claims.exp}` };
  const notBefore = at(claims.nbf);
  if (claims.nbf !== undefined && (notBefore === null || notBefore > now)) {
    return { ok: false, reason: "the licence is not valid yet" };
  }
  if (!PLANS.includes(claims.plan)) return { ok: false, reason: "the free licence gives no download of the core" };
  if (found.trial && claims.plan !== "trial") return { ok: false, reason: "not a licence signed by Fistron" };
  if ((claims.plan === "trial") !== (claims.tier === "free")) return { ok: false, reason: "the plan and the tier differ" };
  return { ok: true, licence: { id: claims.jti, plan: claims.plan, licensee: claims.sub, expires: claims.exp } };
}

/** The trusted keys from a Worker's variables (each a list of PASERK k4.public). */
export function keysOf(env) {
  const list = (value) => (Array.isArray(value) ? value : value ? JSON.parse(value) : []);
  return { releaseKeys: list(env.LICENCE_KEYS), trialKeys: list(env.TRIAL_KEYS) };
}
