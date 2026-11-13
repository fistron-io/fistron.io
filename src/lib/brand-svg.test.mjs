// The brand's files as the site inlines them (src/lib/brand-svg.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { inlineSvg, scopeCss } from "./brand-svg.mjs";
import { POSES } from "./poses.mjs";

const brand = new URL("../brand/", import.meta.url);
const read = (path) => readFileSync(new URL(path, brand), "utf8");
const STATES = ["passed", "failed", "flaky", "quarantined", "running", "pending", "skipped", "manual", "warning"];

test("every pose and every status icon of the brand is here", () => {
  const mascot = readdirSync(new URL("mascot/", brand)).sort();
  assert.deepEqual(mascot, [...POSES.map((p) => `fistronek-${p}.svg`), "fistronek.css"].sort());
  const status = readdirSync(new URL("status/", brand)).sort();
  assert.deepEqual(status, [...STATES.map((s) => `status-${s}.svg`), "status.css"].sort());
});

test("an inlined drawing has no <svg> of its own, no <style> and ids unique to its copy", () => {
  const source = read("mascot/fistronek-skeptical.svg");
  const one = inlineSvg(source, "fk1");
  const two = inlineSvg(source, "fk2");
  assert.equal(one.viewBox, "0 0 200 185");
  assert.doesNotMatch(one.body, /<svg|<style/);
  assert.match(one.body, /id="fk1-hC00"/);
  assert.match(one.body, /clip-path="url\(#fk1-hC00\)"/);
  assert.doesNotMatch(one.body, /"hC00"|#hC00\)/);
  assert.match(two.body, /id="fk2-hC00"/);
  for (const state of STATES) {
    const { body } = inlineSvg(read(`status/status-${state}.svg`), "s");
    for (const [, ref] of body.matchAll(/url\(#([^)]+)\)/g)) assert.match(body, new RegExp(`id="${ref}"`));
  }
  assert.throws(() => inlineSvg("<p>not an svg</p>", "x"), /not an SVG/);
});

test("the brand's animations act only inside their element, under their own names", () => {
  const css = scopeCss(read("mascot/fistronek.css"), ".fistronek");
  assert.match(css, /\.fistronek \.pop\{animation:fistronek-pop 2\.4s/);
  assert.match(css, /@keyframes fistronek-pop\{0%,70%,100%\{transform:scale\(1\)\}/);
  // prefers-reduced-motion stops every animation of the mascot, not of the page
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\{\.fistronek \*\{animation:none!important\}\}/);
  for (const rule of css.replace(/@keyframes[^{]+\{([^{}]*\{[^}]*\})*\}/g, "").matchAll(/(?:^|\})([^@{}][^{}]*)\{/g)) {
    for (const selector of rule[1].split(",")) assert.match(selector.trim(), /^\.fistronek /);
  }
  const status = scopeCss(read("status/status.css"), ".status-icon");
  assert.match(status, /\.status-icon \.st-dot\.d2\{animation-delay:\.2s\}/);
  assert.match(status, /\.status-icon \.st-spin, ?\.status-icon \.st-dot/);
  assert.doesNotMatch(status, /animation:st-/);
});

test("the old logo's addresses lead to the new files", () => {
  const redirects = readFileSync(new URL("../../public/_redirects", import.meta.url), "utf8");
  assert.match(redirects, /^\/brand\/logo-mark\.svg \/brand\/fistron-mark\.svg 301$/m);
  assert.match(redirects, /^\/brand\/logo-mark-on-dark\.svg \/brand\/fistron-mark-on-dark\.svg 301$/m);
});
