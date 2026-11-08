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

## Pages

| Page | What it holds |
|---|---|
| `/` | The story in order: hero, the problem, the solutions, how Fistron differs, how it works, conclusions you can check, where Fistron is today, the demo request |
| `/solutions/` and `/solutions/<id>/` | Every solution as a card, and a page each (`solutions.yaml`), with the questions Fistron answers |
| `/why-fistron/` | How Fistron differs in detail, why now, Fistron on Fistron, starting with one project |
| `/platform/` | How it works, CI platforms, integrations, deployment |
| `/roadmap/` | The roadmap (`roadmap.yaml`); the homepage shows the same stages in three columns |
| `/partners/` | Platform partners |

The demo request lives on the homepage (`/#demo`); every other page ends with a band that links to it.

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
| `solutions.yaml` | The solutions: a card on the homepage and on `/solutions/`, and a page of each at `/solutions/<id>/` (the problem, what you get, where it stands, the questions it answers by id from `questions.yaml`, the homepage sections shown with it). Source: Fistron's `value-proposition.md`; mark `available` only what works today |
| `differentiators.yaml` | How Fistron differs from categories of alternatives (never named products), on the homepage and on `/why-fistron/` |
| `engagement.yaml`, `included.yaml`, `guarantees.yaml` | How an engagement runs, what every subscription includes besides the software, and what the offer commits to (offer section, "What we deliver"); no prices |
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
from the navigation and footer. On 2026-10-16 the roadmap, the questions,
the integrations and the velocity copy were synced with the Fistron
repository's head (`docs/design/roadmap.md`: V3.2b and V3.3 done, V4b on
staging, V4.5a in development; ADRs 0063 and 0065–0068), and the offer
gained what every subscription includes (ADR 0068). On 2026-10-17 the hero,
the page title and the footer follow the positioning in
`docs/design/go-to-market.md`: the category "the end-to-end autonomous
assurance platform" is the headline and the page title, the motto
"Assured, not assumed." stands above it; the three-beat slogan was the supporting line in the
hero until 2026-10-25, when it was removed. On 2026-10-18 the roadmap, the questions,
the hero note and the offer note were synced with the Fistron head (V4.5,
V4.6 and V6a implemented and being validated, V7a in development, V5 after
general availability; ADRs 0069–0073). On 2026-10-21 Distributed
Continuous Certification (ADR 0075, V7.5) was added to the roadmap, the
audiences and the questions. On 2026-10-23 the roadmap and its intro
followed ADRs 0082 and 0083: authoring new tests (V5) in development and
before general availability, and the guide on every page (V4.6c) in
development and a condition of it. The same day the stages were synced
with reality: V3.5 (the suite map) added, V4b implemented and in
production for its first pilot, V7a implemented and being validated, V5
the current stage and shown before V6. On 2026-10-25 the site became a
homepage with pages: the solutions from `value-proposition.md` (each with
its page and its honest state), how Fistron differs from categories of
alternatives (never named products), the platform, the roadmap and the
partners on pages of their own, and the hero's grid of offerings replaced
by the solutions. The state followed the Fistron head: V4.6c implemented,
V6b and V7b decided (ADRs 0091, 0092), V7.5a in development with its kit,
runners, attestation signed by the participant's installation (ADR 0093)
and sharing implemented. On 2026-10-28 Migration
Assurance (Fistron ADR 0107) became a solution with its question, the
named architect installs and sets Fistron up (ADR 0068 point 2 as
amended), a question for deadline pressure joined the end-to-end
solution, and app.fistron.io and docs.fistron.io became live links. On 2026-10-29 the
homepage gained the Fistroneer (the named quality engineer every
subscription includes, 10 or 40 person-days a year) and Fistron Sovereign
(the rules and Fistron's own planned models, ADR 0102), and /pricing/ shows
the tiers (Trial, Subscription from EUR 100,000 a year, Subscription Plus
on request) with the programmes and services; `fistroneer.yaml`,
`sovereign.yaml`, `pricing.yaml` and `pricing-extras.yaml` hold them. On 2026-10-31 the roadmap, the solutions, the questions,
the hero and the platforms were synced with the Fistron head: the Fast
Feedback Loop (V3.7, ADR 0119) implemented and being validated, a condition
of GA, and the current stage; tests in the customer's tools (V5b) and the
release gate (V7.5c) implemented; the verification log of a release (V7.8,
ADR 0117) added; Jenkins read-only (ADR 0074) with the tiers' change of a
declarative Jenkinsfile. Later that day the sovereignty solution gained the
data-flow ledger of every run and the policy that refuses a contact before
it is made (Fistron ADR 0121).

V1 functionality is implemented, with broader real-case validation ongoing.
V2.1 change assessment, V2.2 test plans, V2.3 extension points and the V2.4
delivery baseline are available in an early form, with human review and
further validation required. V3 (coverage gaps, the Suite Health audit with
mutation results, the evidence gate for AI-written changes and velocity in
the baseline) is implemented, with pilots on real pull requests continuing.
Evidence selection (V2.5), flaky quarantine (V1.5) and the Suite Health
audit run in shadow mode on Fistron's own repositories: they record what
they would do, nothing is skipped, quarantined or removed. The local
interface and setup (V4a) are released and being validated; the control
plane (V4b) is in production for its first pilot. Compliance in the tool
(V4.5), Fištrónek with measurable outcomes (V4.6), the Fast Feedback Loop
(V3.7), test authoring (V5), predictive quality (V6, the change risk in
shadow mode), the closed loop on existing tests (V7), Distributed Continuous
Certification (V7.5), Migration Assurance (V7.7) and the verification log
(V7.8) are implemented and being validated; Fistron Sovereign LLM (V7.6) is
in development. Enforcement and commercial packaging remain
planned. The proposed edition split is not a released offer or final
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

app.fistron.io, docs.fistron.io, support.fistron.io, fistron.org and the
demo (demo.fistron.io) are separate projects. `site.services` in
`src/config/site.ts` lists them with a `live` flag. While a service is not
live, `NavLink` shows its name with a "Coming soon" tag (a short "Soon" in
the header) instead of a link, so no page points at a host that doesn't
answer; the trial's section shows "Try the demo" only once the demo is live.
Set `live: true` once the host is up.

## Trial form

The "Start a free trial" form (`#trial`, Fistron ADR 0122) posts the name,
the work e-mail and the company as JSON to the control plane's trials,
`site.trialFormAction` (`https://app.fistron.io/api/v1/trials` once trials
are on there). A hidden field `website` stays empty for people; robots fill
it and get the same answer. While `trialFormAction` is unset, submitting
shows a note instead of sending data; set, it shows the success panel
("Evidence: 1. Confidence: high.": check your e-mail) or an error.
Connecting it needs the privacy notice for the e-mail and the name.

## The plans on /pricing/

`src/content/en/plans.json` is the core's table of plans (fistron-core's
`plans()`, Fistron ADR 0122), regenerated when it changes;
`plan-features.yaml` has each feature in the product's words.
`scripts/check-plans.mjs` (part of `npm run check`) fails when the tiers of
`pricing.yaml` are not the core's plans or a feature has no words, and when
a price differs from the core's (Fistron ADR 0118): a tier's price and
minimum, the lines included and their price (`pricing-extras.yaml`), and
each worked example's yearly price (`pricing-examples.yaml`: `plan`,
`committers`, `lines`, `yearly`) by the formula; the trial's days and
Individual's yearly price (Fistron ADR 0139). A tier's `note` says what it
does not include or what is coming. The model pool per active committer
and Individual's variant with a model are checked against the core's
prices too (Fistron ADR 0140); `models.yaml` holds the model options of
"Models: your choice", each with its state today. Every tier's button goes to the form
at `#trial` (the site's contact), also "Get Individual" until the card
payment exists.

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

## get.fistron.io, dl.fistron.io and registry.fistron.io

Where customers install from, without GitHub (Fistron ADR 0155 point 1).
Two Workers of their own, with no assets, never behind Cloudflare Access
(hosts download without a person); each custom domain makes its DNS record
and its certificate at Cloudflare.

**`get-fistron-io`** (`get/worker.mjs`, `get/wrangler.jsonc`) on
get.fistron.io and dl.fistron.io, reading the R2 bucket `fistron-dl`
(binding `DL`), which Fistron's and the core's release workflows fill
(`scripts/release.sh`) and fistron-ops' `release-chain.sh` names the
channels of (`scripts/channel.sh`):

- get.fistron.io: `/` and `/install.sh` serve the `stable` channel's
  `install.sh` (what production runs; cached a minute), `/staging` the
  staging channel's, `/v<version>` that version's. No channel yet: a 503
  that says so. Anything else: a 404 that says how to get the installer.
- dl.fistron.io: `/fistron/<version>/<file>` (open: the wheel,
  `install.sh`, `SHA256SUMS`, its signature, the Sigstore bundles),
  `/channels/<staging|stable>.json` (open), and `/core/<version>/<file>`
  (the closed core) and `/bundle/<version>/<file>` (the air-gapped bundle,
  whose images include the core), only with a valid licence or trial as
  the bearer token (`get/licence.mjs`: verified as the core
  verifies it, with the keys `LICENCE_KEYS` and `TRIAL_KEYS`; an expired
  licence, the free licence and another key's are refused, and the answer
  never repeats the token).

**`registry-fistron-io`** (`registry/worker.mjs`, `registry/wrangler.jsonc`)
on registry.fistron.io: a pull-only proxy of `ghcr.io/fistron-io`, with the
OCI token flow. `REPOSITORIES` names what exists: `fistron` and
`charts/fistron` open, `fistron-core` and `fistron-control-plane` with a
licence (`podman login registry.fistron.io -u licence --password-stdin <
licence.paseto`). An image is also found by the chart's name for it,
with the owner (`fistron-io/fistron-core`), under `global.imageRegistry`. Its secrets: `GHCR_TOKEN` (read:packages for
fistron-io's packages; it never leaves the Worker) and `TOKEN_SECRET`
(signs its own five-minute tokens): `npx wrangler secret put GHCR_TOKEN -c
registry/wrangler.jsonc`.

Deploy: `npm run deploy:get` and `npm run deploy:registry`. `npm run check`
runs their tests (`node --test get/*.test.mjs registry/*.test.mjs`).

## Going public

1. Remove the Cloudflare Access application for fistron.io.
2. Build with `PUBLIC_INDEXABLE=true` (removes the `noindex` meta tag).
3. Replace `public/robots.txt` with one that allows crawling and points to a
   sitemap.
4. Connect the demo form and publish a privacy notice.
5. Have the mascot illustrations refined.
6. Re-verify the survey figures in `src/content/en/signals.yaml` against their
   sources, and remove any that cannot be confirmed.
