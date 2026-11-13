// The R2 binding of get.fistron.io and dl.fistron.io (get/wrangler.jsonc) reads
// the bucket the release workflows write: the same name and the same
// jurisdiction. A bucket of the same name in another jurisdiction is another
// bucket, empty here (2026-11-13: the workflows wrote through
// …eu.r2.cloudflarestorage.com, the Worker read the default jurisdiction's).
// Run before every deploy (npm run deploy:get); with R2_ENDPOINT set, as in
// Fistron's workflows, its jurisdiction must be the binding's.
//
//   node get/check-binding.mjs        R2_ENDPOINT=https://<account>.eu.r2.cloudflarestorage.com node get/check-binding.mjs
import { readFileSync } from "node:fs";

/** The jurisdiction Fistron's downloads are kept in (ADR 0155: in the EU). */
export const JURISDICTION = "eu";

/** wrangler.jsonc without its comments (outside strings), then JSON. */
export function parseJsonc(text) {
  let out = "";
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      out += c;
      if (c === "\\") out += text[++i] ?? "";
      else if (c === '"') inString = false;
    } else if (c === '"') {
      inString = true;
      out += c;
    } else if (c === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      out += "\n";
    } else if (c === "/" && text[i + 1] === "*") {
      i = text.indexOf("*/", i + 2) + 1;
    } else {
      out += c;
    }
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"));
}

/** The jurisdiction an R2 S3 endpoint names: "eu", "fedramp", or "" for the default. */
export function endpointJurisdiction(endpoint) {
  const host = new URL(endpoint).hostname;
  const match = /^[^.]+\.([a-z]+)\.r2\.cloudflarestorage\.com$/.exec(host);
  return match ? match[1] : "";
}

/** What is wrong with the Worker's R2 bindings; empty when nothing. */
export function bindingProblems(config, endpoint = "") {
  const problems = [];
  const buckets = config.r2_buckets ?? [];
  if (buckets.length === 0) problems.push("no r2_buckets binding");
  for (const b of buckets) {
    const has = b.jurisdiction ?? "";
    if (has !== JURISDICTION) {
      problems.push(
        `${b.binding}: jurisdiction "${has || "default"}", not "${JURISDICTION}" (Fistron's downloads are in the EU)`,
      );
    }
    if (endpoint && endpointJurisdiction(endpoint) !== has) {
      problems.push(
        `${b.binding}: jurisdiction "${has || "default"}", but R2_ENDPOINT is in "${endpointJurisdiction(endpoint) || "default"}": the Worker would read another bucket than the workflows write`,
      );
    }
  }
  return problems;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const config = parseJsonc(readFileSync(new URL("./wrangler.jsonc", import.meta.url), "utf8"));
  const problems = bindingProblems(config, process.env.R2_ENDPOINT ?? "");
  if (problems.length > 0) {
    for (const p of problems) console.error(`check-binding: ${p}`);
    process.exit(1);
  }
  console.log(
    `check-binding: the bucket ${config.r2_buckets.map((b) => b.bucket_name).join(", ")} in the jurisdiction ${JURISDICTION}`,
  );
}
