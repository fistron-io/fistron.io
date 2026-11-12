// Old addresses others may link to lead to the pages that replaced them
// (public/_redirects): every target is a page the site builds.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "yaml";

const redirects = readFileSync(new URL("../../public/_redirects", import.meta.url), "utf8")
  .split("\n")
  .filter((line) => line.trim() && !line.startsWith("#"))
  .map((line) => line.trim().split(/\s+/));
const solutions = parse(readFileSync(new URL("../content/en/solutions.yaml", import.meta.url), "utf8"));
const ids = new Set(solutions.map((s) => s.id));

test("the solutions renamed on 2026-11-12 lead to their new pages", () => {
  const to = Object.fromEntries(redirects.map(([from, target]) => [from, target]));
  for (const [old, now] of [
    ["continuous-certification", "continuous-verification"],
    ["without-headcount", "expand-and-grow"],
  ]) {
    assert.equal(to[`/solutions/${old}/`], `/solutions/${now}/`);
    assert.equal(to[`/solutions/${old}`], `/solutions/${now}/`);
    assert.ok(ids.has(now), `${now} is a solution`);
    assert.ok(!ids.has(old), `${old} is no longer a solution`);
  }
});

test("every redirect is permanent and leads to a solution that exists", () => {
  for (const [from, target, status] of redirects) {
    assert.equal(status, "301", from);
    const solution = /^\/solutions\/([^/]+)\/$/.exec(target);
    if (solution) assert.ok(ids.has(solution[1]), `${from}: no solution ${solution[1]}`);
  }
});
