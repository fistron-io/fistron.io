// Copies the showcase of each solution from a Fistron checkout: `npm run
// sync-showcase -- ../Fistron`. The words and the pictures are Fistron's
// (showcase/showcase.json and showcase/pictures/, made from its real GUI at
// each release); this site only shows them on each solution's page.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const checkout = process.argv[2];
if (!checkout) {
  console.error("usage: npm run sync-showcase -- <Fistron checkout>");
  process.exit(2);
}
const data = resolve(checkout, "showcase", "showcase.json");
const pictures = resolve(checkout, "showcase", "pictures");
if (!existsSync(data) || !existsSync(pictures)) {
  console.error(`${checkout}: no showcase/showcase.json and showcase/pictures (is it a Fistron checkout?)`);
  process.exit(2);
}
const shown = JSON.parse(readFileSync(data, "utf8"));
const to = new URL("../public/showcase/", import.meta.url).pathname;
rmSync(to, { recursive: true, force: true });
mkdirSync(to, { recursive: true });
cpSync(pictures, to, { recursive: true });
writeFileSync(new URL("../src/content/en/showcase.json", import.meta.url), JSON.stringify(shown, null, 2) + "\n");
console.log(`the showcase of ${shown.solutions.length} solutions from ${checkout}`);
