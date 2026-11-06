// Every solution of solutions.yaml has its showcase (src/content/en/showcase.json,
// synced from Fistron), and every picture it names is in public/showcase/ in the
// light and the dark theme and for a phone.
import { existsSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const shown = JSON.parse(read("../src/content/en/showcase.json")).solutions;
const ids = [...read("../src/content/en/solutions.yaml").matchAll(/^- id: ([a-z0-9-]+)$/gm)].map((m) => m[1]);
const problems = [];
for (const id of ids) {
  const found = shown.find((s) => s.id === id);
  if (!found) {
    problems.push(`${id}: no showcase (npm run sync-showcase -- ../Fistron)`);
    continue;
  }
  for (const picture of found.pictures) {
    for (const suffix of ["light", "dark", "phone"]) {
      const file = new URL(`../public/showcase/${id}/${picture.name}-${suffix}.png`, import.meta.url);
      if (!existsSync(file)) problems.push(`${id}: no ${picture.name}-${suffix}.png`);
    }
  }
}
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`The showcase: ${ids.length} solutions, every picture there.`);
