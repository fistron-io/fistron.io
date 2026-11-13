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
  assert.match(page, /<span class="th-price">\{t\.price\}<\/span>/);
  assert.match(page, /interfaces\.map\(/);
});
