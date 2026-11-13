// The AaaP page at /platform/, the partners' sentence and the Solutions
// menu's link (Martin's feedback of 2026-11-13).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "yaml";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const sections = parse(read("../content/en/sections.yaml"));

test("the platform's page is AaaP, with its definition and how it works, and keeps its intro", () => {
  assert.equal(sections.platformPage.title, "AaaP – Assurance as a Platform");
  assert.equal(
    sections.platformPage.intro,
    "How Fistron works, the CI platforms and integrations it uses, and where it runs. One set of artifacts for Fistron Cloud, on-premises, air-gapped and hybrid.",
  );
  assert.match(sections.aaap.intro, /^Assurance as a Platform \(AaaP\) is /);
  assert.ok(sections.aaap.paragraphs.some((p) => p.startsWith("The name follows the cloud's models")));
  const models = parse(read("../content/en/aaap-models.yaml")).map((m) => m.term);
  assert.deepEqual(models, ["IaaS", "PaaS", "SaaS", "AaaP"]);
  assert.equal(parse(read("../content/en/aaap-steps.yaml")).length, 4);
  assert.match(read("../pages/platform.astro"), /<Aaap \/>/);
  assert.match(read("../config/site.ts"), /\{ label: "AaaP", href: "\/platform\/" \}/);
});

test("platform partners offer Fistron's AaaP inside their own services", () => {
  assert.equal(
    sections.partnersPage.intro,
    "PaaS and SaaS providers can offer Fistron's AaaP for quality and compliance inside their own services.",
  );
});

test("Solutions in the header's menu is a link to /solutions/, the chevron opens the menu", () => {
  const menu = read("../components/SolutionsMenu.astro");
  assert.match(menu, /<a class:list=\{\["trigger", \{ current \}\]\} href=\{href\}>/);
  assert.match(menu, /class:list=\{\["toggle", \{ current \}\]\}[\s\S]*?data-dropdown-trigger/);
  assert.match(read("../config/site.ts"), /\{ label: "Solutions", href: "\/solutions\/", menu: "solutions" \}/);
});
