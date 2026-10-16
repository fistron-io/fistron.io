# fistron.io

Company website for Fistron: the homepage at https://fistron.io.

Related hosts are separate projects and servers: https://app.fistron.io (cloud
services), https://docs.fistron.io and https://support.fistron.io;
https://fistron.org is reserved for an open-source edition, which is not
planned for now.

**Status: private.** The site is not public yet. Every page carries
`noindex, nofollow` and `public/robots.txt` disallows crawling until launch
(see [Going public](#going-public)).

## Stack

- [Astro](https://astro.build) 7, static output: plain HTML and CSS, a few
  lines of JavaScript (only for the demo form).
- IBM Plex Sans and IBM Plex Mono, self-hosted through Fontsource: the site
  makes no requests to Google or other third parties.
- No CSS framework. Brand tokens are CSS custom properties.

Requires Node.js 22.12 or newer and npm.

```bash
npm ci            # install exactly what package-lock.json pins
npm run dev       # dev server on http://localhost:4321
npm run check     # type and template checks (astro check), dark theme blocks identical
npm run build     # static site into dist/
npm run preview   # serve dist/ locally
```

Run `npm run check && npm run build` before every commit. CI runs the same
(`.github/workflows/build.yml`).

## Conventions

- Code, comments, content and commit messages are in English.
- Homepage copy belongs in `src/content/en/*.yaml` (and the two `.txt`
  examples), not in components. Keep YAML lists in display order.
- Mark a capability `available` only if it works in the Fistron repository
  today; everything else is `in-development`. Never invent customers,
  metrics, prices or quotes: use a visible placeholder and say so.
- Use the brand tokens in `src/styles/tokens.css`; don't add colours or
  fonts elsewhere. No requests to third-party hosts (fonts, CDNs, analytics).
- The site stays private (`noindex`, `robots.txt` disallow) until launch.
- Run `npm run check && npm run build` before proposing a change.
- A change comes as one `git format-patch` file applicable with `git am`,
  or as a branch for a pull request; `main` changes only through merged
  pull requests.

Astro documentation: https://docs.astro.build

## Editing content

All homepage copy is in `src/content/en/` and can be changed without
touching layout:

| File | Content |
|---|---|
| `sections.yaml` | Headings and short copy for every section, keyed by section |
| `objective.yaml` | The example quality objective in the hero |
| `problems.yaml`, `steps.yaml`, `trust.yaml`, `governance.yaml`, `deployment.yaml`, `audiences.yaml`, `roadmap.yaml` | Section lists, shown in file order |
| `signals.yaml` | Market signals in the "Why now" section: third-party survey figures exactly as published, with source, link and date. Re-verify before going public |
| `partner-models.yaml` | The two platform partner models (marketplace add-on, own brand) in the partners section; Fistron ADR 0064 |
| `engagement.yaml`, `guarantees.yaml` | How an engagement runs and what the offer commits to (offer section, "What we deliver") |
| `outcomes.yaml`, `messages.yaml` | The quality, schedule and cost baselines and what each audience gets (outcomes section, in development as a whole) |
| `questions.yaml`, `integrations.yaml` | Lists with a `status` per item |
| `platforms.yaml` | CI platforms, local logo names, exact support scope and featured candidates |
| `dogfood.yaml`, `dogfood-stats.yaml` | What runs on Fistron's own repositories, and figures measured on its own suite. Figures stay exactly as measured (source and date in the file); change value and text together |
| `ci-output.txt`, `evidence-item.txt` | Example CLI output and evidence item (shortened from a synthetic example case) |

The schemas in `src/content.config.ts` validate every file at build time: a
missing field or a typo in a status fails the build with a message.

### Product documentation baseline

Homepage copy was reconciled with the Fistron documentation on 2026-10-10,
and the roadmap on 2026-10-11 with ADR 0054 (user interface and setup as
V4 before general availability; test authoring after it as V5):
README, `docs/design/roadmap.md` (milestone status, dogfooding steps),
`docs/github.md`, `docs/ci-job.md`, `docs/baseline.md`, `docs/selection.md`
and ADRs 0047, 0048 and 0051–0053, after the earlier reconciliation with
`go-to-market.md`, `business-model.md`, `use-cases/measurable-quality.md`
and `docs/experiments.md` (2026-10-07). On 2026-10-15 the copy followed the
offer of `docs/design/value-proposition.md` and ADR 0061 (delivered solutions
with a stamp, compliance in the tool as V4.5, a time-limited trial instead
of a free licence, no open-source edition for now): the offer section, the
compliance items in governance, four use-case questions, the security and
compliance audience, V4.5 in the roadmap, and the open-source link removed
from the navigation and footer.

V1 functionality is implemented, with broader real-case validation ongoing.
V2.1 change assessment, V2.2 test plans, V2.3 extension points and the V2.4
delivery baseline are available in an early form, with human review and
further validation required. Evidence selection (V2.5) and flaky quarantine
(V1.5) run in shadow mode on Fistron's own repositories: they record what
they would do, nothing is skipped or quarantined. Enforcement, Suite Health
(V3), the local interface and setup (V4a), the control plane (V4b),
organisation metrics and commercial packaging remain planned. The proposed edition split is not a released offer or final
licence commitment.

### Status: available or in development

Every capability the site shows is either `available` (filled green checkbox,
"Available now") or `in-development` (empty checkbox, "In development"). Mark
something `available` only when it works in the Fistron repository today.
When a capability ships, change its `status` in `questions.yaml` or
`integrations.yaml`. Sections that are in development as a whole (outcomes, governance,
control-plane deployment options) say so in their component or copy.

Roadmap stages use the same checkboxes through `status` in `roadmap.yaml`:
`implemented` (filled green checkbox, green label), `in-development` (empty
checkbox) and `planned` (the default, no checkbox). Green means done; the
current stage is highlighted in indigo.

### CI platform support and logos

`platforms.yaml` distinguishes `available` (native adapter), `limited`
(a specific working subset) and `candidate` (no native adapter yet).
The displayed label and detail must describe the actual scope. GitLab CI
and GitHub Actions have native adapters (re-running a failed job works on
GitLab only); Jenkins supports supplied console logs only.
Candidate cards do not promise delivery dates. Generic artifact ingestion
is described separately from automatic collection or job execution.

Four featured platforms are visible by default; the other candidates are
in a native HTML disclosure. Logos are local SVGs in `public/platforms/`.
Source commits, hashes, brand metadata and licence copies are kept there;
no third-party asset requests or icon dependency are added. Azure DevOps,
AWS and Google Cloud marks identify the platform family named on the card.
The platform marks do not imply vendor endorsement or partnership.

### Sections and layout

`src/pages/index.astro` lists the homepage sections in order; each is a
component in `src/sections/`. Shared building blocks are in
`src/components/` (`Section` for a full-width band with its tone and contour
lines, `SectionHeading`, `StatusBadge`, `CheckIcon`, `Wordmark`, `Contours`).
Names, URLs and navigation are in `src/config/site.ts`.

### Languages

English only. `astro.config.mjs` has i18n configured with `en` as the default
locale and content lives under `src/content/en/`, so a translation adds a
locale there and a sibling content folder.

## Brand

| Token | Value | Use |
|---|---|---|
| Indigo | `#24305E` | Primary: wordmark, headings, buttons |
| Night | `#1A2347` | Dark sections, footer |
| Leaf | `#3FA66B` | Accent: the checkbox, success, "Available now" |
| Leaf text | `#2B7A4B` | Leaf as text on light backgrounds (contrast) |
| Leaf light | `#6CCB8F` | Leaf on dark backgrounds |
| Paper | `#F5F6F9` | Light-grey sections |

All tokens are in `src/styles/tokens.css`; components use only those.

### Light and dark theme

The site has a light and a dark theme. The switch in the header cycles
System, Light and Dark; "System" (the default) follows the operating system.
The choice is kept in the visitor's browser only (`localStorage`
`fistron.theme`, the same key as Fistron's local UI), and a small inline
script in `BaseLayout.astro` applies it before the page paints.

- Components use role tokens (`--surface-page`, `--surface-card`,
  `--color-heading`, `--btn-bg`, ...) rather than literal colours, so a
  colour that changes with the theme is changed in `tokens.css` only.
- The dark values are written twice in `tokens.css`: for an explicit choice
  (`:root[data-theme="dark"]`) and for "System" on a dark operating system
  (`@media (prefers-color-scheme: dark)`). `npm run check` fails if the two
  differ (`scripts/check-theme-tokens.mjs`).
- Dark bands (CI, demo, footer) look the same in both themes.
- Vendor logos sit on a white tile in the dark theme, because they are drawn
  for light backgrounds.
- In the dark theme Fištrónek works nights: a light rim keeps him visible
  and he wears a headlamp.

- **Wordmark:** "Fistron" with a small filled checkbox at the top right. Used
  in the header and footer (`Wordmark.astro`). In running text, write the
  name as plain "Fistron".
- **Logo mark:** an F with a filled green checkbox beside it. Used where space
  is small or the mark stands alone: favicon, app icon, avatars. Files in
  `public/brand/` (`logo-mark.svg`, `logo-mark-on-dark.svg`,
  `app-icon-512.png`) and `public/favicon.svg`. Don't place the mark and the
  wordmark side by side.
- **Contour lines:** concentric ellipses on dark bands and light-grey bands
  only, never on white ones. The green signal ring appears only on the dark
  CI band and the demo band.
- **Name:** from the Czech *fištrón*, the knack of knowing how to get things
  done.

### Mascot and humour

**Fištrónek** is the Fistron crow: crows are clever and use the tools around
them, as Fistron does. **Flaky** is his opponent, the half-red, half-green
gremlin of flaky tests. Both are inline SVG in `src/components/Fistronek.astro`
with eleven poses: `main` (checkbox in the beak), `investigating`
(magnifier), `skeptical` (with Flaky), `chase` (chasing Flaky), `telescope`
(looking ahead), `broom` (sweeping out tests that add no evidence), `stamp`
(approving a report), `conductor` (baton), `chef` (tasting Fistron's own
cooking), `desk` (at the local interface) and `quarantine` (Flaky behind
tape, still running). `HeadingWithArt.astro` puts one beside a section
heading with a caption.

The tone is serious where it carries the message (hero, how it works, CI
failure analysis, deployment) and playful around it:

- illustrations in the problem, questions (quarantine), outcomes (broom at
  the triangle), trust, dogfooding (chef), platforms (conductor), governance
  (stamp), deployment (desk), roadmap (telescope) and "Why Fistron" sections
  and on the 404 page
- dry self-irony from the QE world in short lines (`note`, `caption`,
  `quip` in `sections.yaml`), never in claims about what Fistron does
- easter eggs: the sent demo form, a note in the browser console
  (`site.consoleMessage`), the footer note (`site.footerNote`) and the
  wordmark checkbox in the header, which Fištrónek ticks back when clicked;
  the theme switch comments on the choice, and in the dark theme Fištrónek
  wears a headlamp

The drawings are sketches for the private phase; an illustrator should refine
the characters before launch.

## Services on other hosts

app.fistron.io, docs.fistron.io, support.fistron.io and fistron.org are
separate projects. `site.services` in `src/config/site.ts` lists them with a
`live` flag. While a service is not live, `NavLink` shows its name with a
"Coming soon" tag (a short "Soon" in the header) instead of a link, so no
page points at a host that doesn't answer. Set `live: true` once the host is
up.

## Demo form

The "Request a demo" form is not connected to anything yet. While
`site.demoFormAction` in `src/config/site.ts` is unset, submitting the form
shows a note instead of sending data. Once it is set, the form posts in the
background and shows the success panel ("Evidence: 1. Confidence: high.") or
an error. Connecting it needs an endpoint (for example a Cloudflare Worker or
a form service) and a privacy notice.

## Hosting

Cloudflare Workers with static assets, configured in `wrangler.jsonc`: the
Worker `fistron-io` serves `dist/` on the custom domain fistron.io, with
`404.html` for unknown paths. It has no `*.workers.dev` address and no
preview URLs, so the only way in is fistron.io, protected by Cloudflare
Access while the site is private.

Deployment runs on Cloudflare (Workers Builds) on every push to `main`:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

Manual deployment from a workstation: `npx wrangler login`, then
`npm run deploy`. `npx wrangler deploy --dry-run` validates the
configuration without deploying.

## Going public

1. Remove the Cloudflare Access application for fistron.io.
2. Build with `PUBLIC_INDEXABLE=true` (removes the `noindex` meta tag).
3. Replace `public/robots.txt` with one that allows crawling and points to a
   sitemap.
4. Connect the demo form and publish a privacy notice.
5. Have the mascot illustrations refined.
6. Re-verify the survey figures in `src/content/en/signals.yaml` against their
   sources, and remove any that cannot be confirmed.
