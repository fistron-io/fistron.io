// The plans on /pricing/ are the core's (Fistron ADR 0122): the tiers of
// pricing.yaml are the plans of plans.json (fistron-core's plans()), in the
// same order, and every feature of a plan has its words in
// plan-features.yaml. The prices too (Fistron ADR 0118): each tier's price
// and minimum, the lines included and their price in pricing-extras.yaml,
// and every worked example's yearly price by the formula; the trial's days
// and Individual's yearly price (ADR 0139). This check fails when they
// differ.
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
const eur = (n) => `EUR ${n.toLocaleString("en")}`;
const byId = Object.fromEntries(plans.plans.map((p) => [p.plan, p]));
for (const tier of parse(read("pricing.yaml"))) {
  const price = byId[tier.id]?.price;
  if (tier.id === "trial" && tier.priceNote !== `${plans.trial_days} days`) {
    problems.push(`trial: pricing.yaml says ${tier.priceNote}, the core ${plans.trial_days} days`);
  }
  if (!price) continue;
  if (tier.price !== eur(price.monthly_per_committer)) {
    problems.push(`${tier.id}: pricing.yaml says ${tier.price}, the core ${eur(price.monthly_per_committer)}`);
  }
  if (price.yearly_minimum > 0 && tier.minimum !== `Minimum ${eur(price.yearly_minimum)} a year`) {
    problems.push(`${tier.id}: pricing.yaml's minimum is not the core's ${eur(price.yearly_minimum)}`);
  } else if (price.yearly_minimum === 0 && tier.minimum) {
    problems.push(`${tier.id}: pricing.yaml shows a minimum, the core none`);
  }
  // a year paid ahead (Individual, Fistron ADR 0139)
  if (price.yearly_per_committer && !tier.priceNote?.includes(`${eur(price.yearly_per_committer)} a year`)) {
    problems.push(`${tier.id}: pricing.yaml's note does not say ${eur(price.yearly_per_committer)} a year`);
  }
}
const lines = plans.lines;
const extra = parse(read("pricing-extras.yaml")).find((e) => e.id === "lines");
const said = `${lines.included_per_committer.toLocaleString("en")} lines of code are included per active committer. Above them, ${eur(lines.block_yearly)} a year per started ${lines.block.toLocaleString("en")} lines.`;
if (!extra?.text.startsWith(said)) problems.push(`pricing-extras.yaml's lines do not say: ${said}`);
for (const example of parse(read("pricing-examples.yaml"))) {
  const price = byId[example.plan]?.price;
  if (!price) {
    problems.push(`${example.id}: no plan ${example.plan} with a price`);
    continue;
  }
  const above = Math.max(0, (example.lines ?? 0) - example.committers * lines.included_per_committer);
  const yearly = Math.max(
    price.yearly_minimum,
    example.committers * price.monthly_per_committer * 12 + Math.ceil(above / lines.block) * lines.block_yearly,
  );
  if (yearly !== example.yearly) {
    problems.push(`${example.id}: the core's prices give ${eur(yearly)}, the example ${eur(example.yearly)}`);
  } else if (!example.text.includes(eur(yearly))) {
    problems.push(`${example.id}: its text does not say ${eur(yearly)}`);
  }
}
if (problems.length > 0) {
  for (const p of problems) console.error(`check-plans: ${p}`);
  process.exit(1);
}
console.log(`The plans: ${ids.length} plans, ${words.size} features and the prices, as the core's.`);
