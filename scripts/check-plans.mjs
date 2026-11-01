// The plans on /pricing/ are the core's (Fistron ADR 0122): the tiers of
// pricing.yaml are the plans of plans.json (fistron-core's plans()), in the
// same order, and every feature of a plan has its words in
// plan-features.yaml. This check fails when they differ.
import { readFileSync } from "node:fs";
import { parse } from "yaml";

const read = (name) => readFileSync(new URL(`../src/content/en/${name}`, import.meta.url), "utf8");
const plans = JSON.parse(read("plans.json"));
const tiers = parse(read("pricing.yaml")).map((t) => t.id);
const words = new Set(parse(read("plan-features.yaml")).map((f) => f.id));
const problems = [];
const ids = plans.plans.map((p) => p.plan);
if (JSON.stringify(ids) !== JSON.stringify(tiers)) {
  problems.push(`pricing.yaml's tiers ${tiers.join(", ")} are not the core's plans ${ids.join(", ")}`);
}
for (const feature of new Set([...plans.plans.flatMap((p) => p.features), ...plans.add_ons])) {
  if (!words.has(feature)) problems.push(`plan-features.yaml has no words for ${feature}`);
}
for (const id of words) {
  if (!plans.plans.some((p) => p.features.includes(id)) && !plans.add_ons.includes(id)) {
    problems.push(`plan-features.yaml names ${id}, which no plan has`);
  }
}
if (problems.length > 0) {
  for (const p of problems) console.error(`check-plans: ${p}`);
  process.exit(1);
}
console.log(`The plans: ${ids.length} plans, ${words.size} features, as the core's.`);
