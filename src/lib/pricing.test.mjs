// The table "What each plan includes": each tier's price in its head, and
// how each plan is used (src/content/en/plan-interfaces.yaml).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { shortPriceNote } from "./pricing.mjs";

const content = (name) => readFileSync(new URL(`../content/en/${name}`, import.meta.url), "utf8");

test("the head of the table shows a tier's price note up to the first semicolon", () => {
  assert.equal(shortPriceNote("a month, or EUR 144 a year; no commitment"), "a month, or EUR 144 a year");
  assert.equal(shortPriceNote("per active committer a month"), "per active committer a month");
  assert.equal(shortPriceNote("30 days"), "30 days");
});

test("the table says how each plan is used: the team's GUI from Team up, never Individual's", () => {
  const ways = Object.fromEntries(parse(content("plan-interfaces.yaml")).map((w) => [w.id, w.plans]));
  const all = parse(content("pricing.yaml")).map((t) => t.id);
  assert.deepEqual(ways.cli, all);
  assert.deepEqual(ways["local-gui"], all);
  assert.ok(!ways["web-gui"].includes("individual"));
  for (const plan of ["trial", "team", "business", "enterprise"]) assert.ok(ways["web-gui"].includes(plan));
});

test("the pricing page's table has the prices in its head and the ways it is used", () => {
  const page = readFileSync(new URL("../pages/pricing.astro", import.meta.url), "utf8");
  assert.match(page, /<span class="th-price">\s*<Money text=\{t\.price\}/);
  assert.match(page, /interfaces\.map\(/);
});

test("a tier's line in development has Fištrónek at work beside it, a planned one not", async () => {
  const { inDevelopment } = await import("./pricing.mjs");
  assert.ok(inDevelopment("A personal history of your own runs (in development)"));
  assert.ok(!inDevelopment("Fistron Sovereign LLM in your environment (planned)"));
  assert.ok(!inDevelopment("Every new version and fix while your licence is valid"));
});

test("Individual and Team in USD and CZK at fixed prices, the model credit and pool converted", async () => {
  const { fixedPrices, moneyParts, converted } = await import("./pricing.mjs");
  const currencies = parse(content("currencies.yaml"));
  const plans = JSON.parse(content("plans.json"));
  const individual = plans.plans.find((p) => p.plan === "individual");
  const fixed = fixedPrices(individual, currencies.fixed.individual);
  assert.deepEqual(fixed.get(15), { USD: 17, CZK: 370 });
  assert.deepEqual(fixed.get(279), { USD: 309, CZK: 6800 });
  const rates = currencies.rate.per_eur;
  const parts = moneyParts("EUR 29 a month, a model credit of EUR 12 a month", fixed, rates);
  assert.deepEqual(parts, [
    { EUR: "EUR 29", USD: "USD 32", CZK: "CZK 710" },
    { text: " a month, a model credit of " },
    { EUR: "EUR 12", USD: "EUR 12 (about USD 13)", CZK: "EUR 12 (about CZK 290)" },
    { text: " a month" },
  ]);
  assert.equal(converted(5, "USD", 1.1013), "EUR 5 (about USD 5.5)");
  assert.equal(moneyParts("a yearly minimum of EUR 20,000", new Map(), rates)[1].USD, "EUR 20,000 (about USD 22,026)");
  assert.deepEqual(moneyParts("no price", fixed, rates), [{ text: "no price" }]);
});

test("the currency shown first is the visitor's country's, by the browser alone", async () => {
  const { countryOf, defaultCurrency } = await import("./pricing.mjs");
  const countries = parse(content("currencies.yaml")).countries;
  assert.equal(defaultCurrency({ timeZone: "Europe/Prague", languages: ["en-US"] }, countries), "CZK");
  assert.equal(defaultCurrency({ timeZone: "America/Chicago", languages: ["en-US"] }, countries), "USD");
  assert.equal(defaultCurrency({ timeZone: "America/Indiana/Indianapolis" }, countries), "USD");
  // the time zone decides: an American's language in Berlin is not an American's country
  assert.equal(defaultCurrency({ timeZone: "Europe/Berlin", languages: ["en-US"] }, countries), "EUR");
  assert.equal(defaultCurrency({ timeZone: "America/Toronto" }, countries), "EUR");
  // no time zone: the language's region
  assert.equal(countryOf({ languages: ["cs-CZ"] }), "CZ");
  assert.equal(defaultCurrency({ languages: ["en"] }, countries), "EUR");
  assert.equal(defaultCurrency({}, countries), "EUR");
});
