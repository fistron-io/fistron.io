// The dark theme is written twice in src/styles/tokens.css: for an explicit
// choice (:root[data-theme="dark"]) and for "System" on a dark operating
// system (@media prefers-color-scheme). This check fails if they differ.
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/styles/tokens.css", import.meta.url), "utf8");

function block(start) {
  const from = css.indexOf("{", css.indexOf(start)) + 1;
  let depth = 1;
  let i = from;
  for (; depth > 0 && i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}") depth--;
  }
  return css.slice(from, i - 1);
}

function declarations(body) {
  return new Map(
    [...body.matchAll(/(--[\w-]+|color-scheme)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]),
  );
}

const explicit = declarations(block(':root[data-theme="dark"]'));
const system = declarations(block(':root:not([data-theme="light"])'));
const problems = [];
for (const [name, value] of explicit) {
  if (system.get(name) !== value) problems.push(`${name}: "${value}" vs "${system.get(name)}"`);
}
for (const name of system.keys()) if (!explicit.has(name)) problems.push(`${name}: only in the media query`);

if (explicit.size === 0) problems.push("no dark theme found");
if (problems.length > 0) {
  console.error("Dark theme blocks in tokens.css differ:\n  " + problems.join("\n  "));
  process.exit(1);
}
console.log(`Dark theme: ${explicit.size} values, both blocks identical.`);
