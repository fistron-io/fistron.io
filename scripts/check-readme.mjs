// The README says what does not age fast, and what it names exists
// (Fistron's finding 131): each link to a file of the repository resolves,
// with its heading when it names one; each `npm run <script>` it shows is
// one of package.json's; each path it names in backticks is there; no date,
// no status and no token. The notes that age are docs/*.md's. This check
// checks itself first, then fails when the README differs.
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TOPS = ["src/", "public/", "scripts/", "get/", "registry/", "docs/", ".github/"];

const slug = (heading) =>
  heading
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s/g, "-");

const anchors = (path) =>
  new Set(
    readFileSync(path, "utf8")
      .split("\n")
      .filter((line) => line.startsWith("#"))
      .map((line) => slug(line.replace(/^#+/, ""))),
  );

/** Whether a path with `*` in its last part names a file of the repository. */
function present(root, path) {
  const clean = path.replace(/\/$/, "");
  if (!clean.includes("*")) return existsSync(join(root, clean));
  const parts = clean.split("/");
  const last = new RegExp(`^${parts.pop().replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`);
  const dir = join(root, ...parts);
  return existsSync(dir) && readdirSync(dir).some((name) => last.test(name));
}

export function problems(root) {
  const text = readFileSync(join(root, "README.md"), "utf8");
  const scripts = Object.keys(JSON.parse(readFileSync(join(root, "package.json"), "utf8")).scripts ?? {});
  const found = [];
  for (const [, link] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^[a-z]+:/.test(link)) continue;
    const [target, anchor] = link.split("#");
    const path = join(root, target || "README.md");
    if (!existsSync(path)) found.push(`${link}: no such file`);
    else if (anchor && !anchors(path).has(anchor)) found.push(`${link}: no such heading`);
  }
  for (const [, name] of text.matchAll(/npm run ([a-z][\w:-]*)/g)) {
    if (!scripts.includes(name)) found.push(`npm run ${name}: package.json has no such script`);
  }
  for (const [, span] of text.matchAll(/`([^`\n]+)`/g)) {
    for (const word of span.split(/\s+/)) {
      if (TOPS.some((top) => word.startsWith(top)) && !present(root, word)) found.push(`${word}: no such path`);
    }
  }
  for (const [date] of text.matchAll(/\b20\d\d-\d\d-\d\d\b/g)) found.push(`${date}: a date ages, docs/ keeps it`);
  if (/\*\*Status/i.test(text)) found.push("a status ages, docs/ keeps it");
  if (/(ghp_|github_pat_|glpat-|BEGIN [A-Z ]*PRIVATE KEY)/.test(text)) found.push("a token");
  return found;
}

function checkItself() {
  const root = mkdtempSync(join(tmpdir(), "readme-"));
  try {
    mkdirSync(join(root, "docs"));
    writeFileSync(join(root, "docs", "hosting.md"), "# Hosting\n\n## Going public\n");
    writeFileSync(join(root, "package.json"), JSON.stringify({ scripts: { check: "x" } }));
    writeFileSync(
      join(root, "README.md"),
      "**Status: private**, since 2026-11-01. [a](docs/hosting.md#going-public), [b](docs/hosting.md#gone),\n" +
        "[c](docs/old.md). `npm run check`, `npm run deploy`, `src/content/en/*.yaml`\n",
    );
    const said = problems(root);
    const expected = [
      "docs/hosting.md#gone: no such heading",
      "docs/old.md: no such file",
      "npm run deploy: package.json has no such script",
      "src/content/en/*.yaml: no such path",
      "2026-11-01: a date ages, docs/ keeps it",
      "a status ages, docs/ keeps it",
    ];
    if (JSON.stringify(said) !== JSON.stringify(expected)) throw new Error(`the README check itself: ${said}`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

checkItself();
const found = problems(ROOT);
for (const problem of found) console.error(`README.md: ${problem}`);
if (found.length) process.exit(1);
