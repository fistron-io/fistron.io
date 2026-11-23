# Hosting the site

Where the site and its other hosts run, how they are deployed, and the
steps before the site goes public. Moved from the README, which keeps
what does not age fast.

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

Deploy: `npm run deploy:get` and `npm run deploy:registry`. The binding of
`get-fistron-io` names the bucket and its **jurisdiction** (`"jurisdiction":
"eu"`), which must be the bucket's that Fistron's workflows write through
`R2_ENDPOINT` (`https://<account>.eu.r2.cloudflarestorage.com`): a bucket of
the same name in another jurisdiction is another, empty one (2026-11-13:
404 and 503 on get. and dl.fistron.io while R2 had every release).
`npm run deploy:get` checks it first (`get/check-binding.mjs`; with
`R2_ENDPOINT` set, against it too); Fistron's `channel.sh` and `release.sh`
read back from dl.fistron.io what they wrote. `npm run check`
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
