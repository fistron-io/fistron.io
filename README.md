# fistron.io

Company website for Fistron: the homepage at https://fistron.io.

Related hosts are separate projects and servers: https://app.fistron.io (cloud
services), https://docs.fistron.io and https://support.fistron.io;
https://fistron.org is reserved for an open-source edition.

The site stays private until launch: every page carries `noindex,
nofollow` and `public/robots.txt` disallows crawling; what changes then is
in [docs/hosting.md](docs/hosting.md#going-public).

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

## Documentation

- [docs/editing.md](docs/editing.md): the pages, where their copy lives
  and its schemas, what may be marked available, the CI platforms and
  their logos, the sections and languages, the brand on the site (the
  light and dark theme, the mascot), the services on other hosts, the
  trial form and the plans on /pricing/.
- [docs/hosting.md](docs/hosting.md): the hosting, get.fistron.io,
  dl.fistron.io and registry.fistron.io, and going public.
- The brand itself (tokens, logo, mascot, status icons):
  https://github.com/fistron-io/brand.

## Report a problem

A vulnerability: security@fistron.io, never a public issue. Anything else:
an issue in this repository.
