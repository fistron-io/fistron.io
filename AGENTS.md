# Notes for AI coding agents

Read README.md first. Conventions for this repository:

- Code, comments, content and commit messages are in English.
- Homepage copy belongs in `src/content/en/*.yaml` (and the two `.txt`
  examples), not in components. Keep YAML lists in display order.
- Mark a capability `available` only if it works in the Fistron repository
  today; everything else is `in-development`. Never invent customers,
  metrics, prices or quotes: use a visible placeholder and say so.
- Use the brand tokens in `src/styles/tokens.css`; don't add colours or
  fonts elsewhere. No requests to third-party hosts (fonts, CDNs, analytics).
- The site stays private (`noindex`, `robots.txt` disallow) until launch.
- Before proposing a change, run `npm run check && npm run build`.
- Changes are delivered as one `git format-patch` file applicable with
  `git am`. Don't push or merge.

Astro documentation: https://docs.astro.build
