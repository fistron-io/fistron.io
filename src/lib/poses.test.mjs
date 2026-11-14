// Fištrónek's poses on the website (Martin's feedback of 2026-11-13): the
// working crow beside everything in development, a pose for each group of
// solutions (the same in Fistron's GUI), and the pages' own.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readdirSync } from "node:fs";
import { AVAILABLE_NOW, GROUP_POSES, IN_DEVELOPMENT, POSES } from "./poses.mjs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("everything in development has Fištrónek at work beside it", () => {
  assert.equal(IN_DEVELOPMENT, "working");
  assert.ok(POSES.includes(IN_DEVELOPMENT));
  assert.match(read("../components/StatusBadge.astro"), /: <Working size=\{28\} \/>\}/);
  const roadmap = read("../sections/Roadmap.astro");
  assert.match(roadmap, /s\.status === "in-development" && <Working/);
  assert.match(roadmap, /p\.status === "in-development" && <Working/);
  const pricing = read("../pages/pricing.astro");
  assert.match(pricing, /m\.state === "in-development" && <Working/);
  assert.match(pricing, /inDevelopment\(f\) && <Working/);
});

test("each group of solutions has its pose, and only the groups the site has", () => {
  const site = read("../config/site.ts");
  const groups = [...site.matchAll(/\{ id: "([a-z]+)", label: "[^"]+" \}/g)].map((m) => m[1]);
  assert.deepEqual(Object.keys(GROUP_POSES).sort(), [...groups].sort());
  for (const pose of Object.values(GROUP_POSES)) assert.ok(POSES.includes(pose), pose);
  assert.match(read("../sections/Solutions.astro"), /GROUP_POSES\[group\.id/);
  assert.match(read("../components/SolutionsMenu.astro"), /pose: GROUP_POSES\[group\.id/);
});

test("the pages Martin named have their pose", () => {
  const pages = {
    "../pages/why-fistron.astro": "lightbulb",
    "../pages/roadmap.astro": "journey",
    "../pages/partners.astro": "cloud",
    "../pages/pricing.astro": "abacus",
  };
  for (const [page, pose] of Object.entries(pages)) {
    assert.match(read(page), new RegExp(`art=\\{\\{ pose: "${pose}"`), page);
  }
  assert.match(read("../pages/pricing.astro"), /<Fistronek pose="clipboard"/);
});

// Decided 2026-11-14: coffee beside "Available now", the pair of working beside
// "In development", the same size and place; the status icon stays.
test("everything available now has Fištrónek with his coffee beside it", () => {
  assert.equal(AVAILABLE_NOW, "coffee");
  const badge = read("../components/StatusBadge.astro");
  assert.match(badge, /\{available \? <Coffee size=\{28\} \/> : <Working size=\{28\} \/>\}/);
  assert.match(badge, /<StatusIcon state=\{available \? "passed" : "running"\}/);
  assert.match(read("../pages/pricing.astro"), /m\.state === "available" && <Coffee size=\{26\} \/>/);
});

test("the poses are the brand's thirty-four, each with its drawing copied unchanged", () => {
  assert.equal(POSES.length, 34);
  const files = readdirSync(new URL("../brand/mascot/", import.meta.url))
    .filter((f) => f.endsWith(".svg"))
    .map((f) => f.replace(/^fistronek-|\.svg$/g, ""));
  assert.deepEqual([...files].sort(), [...POSES].sort());
});
