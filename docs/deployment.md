# Deployment — Cloudflare Workers (SSR)

ANVL Athletics deploys to **Cloudflare Workers** running the TanStack Start SSR
server on the Workers runtime (`workerd`), with the client bundle served as
Workers static assets. Edge delivery, one runtime for SSR + assets, no separate
Node host.

> **Status: LIVE.** Deployed and smoke-tested 2026-08-04 at
> <https://anvl.georgemaalouf73.workers.dev> (version `0c306b75`). Both rate-limit
> bindings provisioned and reported by wrangler; `/checkout` correctly 307s to
> `/cart` in production, `/admin` 307s to `/admin/login`, and the new
> `public/_headers` media rules verified on the live edge.
> The GoDaddy → Cloudflare nameserver migration (custom domain) is the remaining step.

---

## Toolchain

| Piece | What it does |
|---|---|
| `@cloudflare/vite-plugin` (dev dep) | Runs the SSR Vite environment on `workerd` for `vite build` / `vite preview`; wires the client build as Workers static assets. |
| `wrangler` (dev dep) | Bundles + uploads the Worker; generates types; local dry-runs. |
| `wrangler.jsonc` | Worker config (name, compat date/flags, entry, vars). |
| `@tanstack/react-start/server-entry` | The Worker entry (`main` in `wrangler.jsonc`). |

### `wrangler.jsonc`
```jsonc
{
  "name": "anvl",
  "compatibility_date": "2026-07-11",
  "compatibility_flags": ["nodejs_compat"],   // required — see below
  "main": "@tanstack/react-start/server-entry",
  "observability": { "enabled": true },
  "placement": { "mode": "smart" },           // see below
  "ratelimits": [ /* admin login + CSP report — see below */ ],
  "vars": { "NODE_ENV": "production" }         // required — see below
}
```

- **`placement.mode: "smart"`** runs the SSR Worker near the Supabase origin
  rather than near each visitor. The storefront projection load makes several
  Supabase round-trips per request, so co-locating with the database beats
  co-locating with the user.

- **`nodejs_compat` is required, not optional.** The SSR entry reads server
  secrets at request time via `process.env` (`ANVL_ADMIN_SESSION_SECRET`,
  `NODE_ENV`), and TanStack Start's server runtime expects Node built-ins.
  Without the flag those reads fail on `workerd`.
- **`vars.NODE_ENV: "production"` is required.** Cloudflare does **not** set
  `NODE_ENV` automatically. The admin session cookie + the CSRF cookie
  (`src/features/admin/auth/…`, `src/start.ts`) gate their `Secure` attribute —
  and the CSP its dev-only relaxations — on `process.env.NODE_ENV === 'production'`.
  If unset, production would ship non-`Secure` auth cookies.

- **`ratelimits` (added 2026-08-04, F-07).** Two Cloudflare Rate Limiting
  bindings — `ADMIN_LOGIN_RATE_LIMIT` (20 / 60 s) and `CSP_REPORT_RATE_LIMIT`
  (60 / 60 s), both keyed by `CF-Connecting-IP`. They cover the two
  unauthenticated surfaces that previously had no throttle at all: admin
  sign-in (brute force) and the anon CSP report endpoint (log flooding).

  Three things to know:
  1. **The bindings only exist on a deployed Worker.**
     `src/rateLimit.server.ts` therefore **fails open** on every failure path —
     binding absent, running under Node/vitest, the limiter throwing. Local dev
     and any deploy predating this config behave exactly as before. Failing
     closed on an infra detail would be a worse regression than the gap.
  2. **`namespace_id` must stay stable.** It identifies the counter; changing
     one resets its window. `period` accepts only `10` or `60`.
  3. **`wrangler types` does not emit types for rate-limit bindings**, so
     `Env` in `worker-configuration.d.ts` will not list them. That is expected —
     `rateLimit.server.ts` reads them from an untyped record and feature-detects
     `.limit()` before calling it.

  Still unthrottled and tracked separately: the anon `coming_soon_subscribers`
  insert, passport claim, and review submit.

---

## Node version requirement

`@cloudflare/vite-plugin` (≥1.40) imports `registerHooks` from `node:module`,
added in **Node 22.15.0**. The plugin is a standard static import in
`vite.config.ts` (always on, for dev/preview/build), so **every** command —
including `vite dev` — requires **Node ≥ 22.15**.

- ✅ **Verified on Node 24.18.0 LTS** — `pnpm dev` (SSR on `workerd`), `pnpm
  typecheck`, `pnpm build`, and `wrangler deploy --dry-run` all pass. **Node 24
  LTS is the recommended version.** Node 22.20+ LTS also works.
- Keeping the plugin on in `vite dev` runs the SSR environment on `workerd`
  locally too — full dev↔prod parity with the deployed Worker. `NODE_ENV`
  correctly resolves to `development` in dev (Vite replaces `process.env.NODE_ENV`
  per-mode, so the `vars.NODE_ENV=production` in `wrangler.jsonc` does not leak
  into dev), and request-time secrets (`ANVL_ADMIN_SESSION_SECRET`) resolve from
  the host `process.env`/`.env` in dev.
- Symptom of too-old Node: `SyntaxError: … 'node:module' does not provide an
  export named 'registerHooks'` when running any `pnpm dev`/`build`/`preview`/`deploy`.

---

## Environment variables

Two distinct classes — **do not confuse them**:

### Build-time (inlined into the client bundle by Vite)
Must be present in the environment **when `vite build` runs** (local `.env` or
CI). They are **not** Worker secrets/vars. All are public/browser-safe:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (anon/publishable key)
- `VITE_SHOPIFY_STORE_DOMAIN`, `VITE_SHOPIFY_STOREFRONT_API_VERSION`,
  `VITE_SHOPIFY_STOREFRONT_PUBLIC_TOKEN` (Storefront token is browser-safe)
- Optional: `VITE_CANONICAL_BASE_URL`, `VITE_SITE_URL`,
  `VITE_ANVL_INTERNATIONAL_CHECKOUT`

### Worker runtime
- `NODE_ENV=production` — set in `wrangler.jsonc` `vars` (non-secret).
- `ANVL_ADMIN_SESSION_SECRET` — **secret**, set once, never committed:
  ```bash
  wrangler secret put ANVL_ADMIN_SESSION_SECRET   # 32+ chars
  ```

### Never bundled / never `VITE_*`
`SUPABASE_SERVICE_ROLE_KEY`, `SHOPIFY_ADMIN_API_ACCESS_TOKEN`,
`SHOPIFY_API_SECRET_KEY`. Confirmed absent from `src/` — no client leak. Used
only by migrations/privileged server scripts, not the Worker.

---

## Commands

```bash
# All commands require Node >=22.15 (Node 24 LTS recommended).
pnpm dev          # vite dev — SSR on workerd + HMR (dev↔prod parity)
pnpm build        # vite build — client + workerd SSR bundle → dist/
pnpm preview      # vite preview — serves the built Worker in workerd locally
pnpm run deploy   # pnpm build && wrangler deploy  (NOT `pnpm deploy` — reserved by pnpm)
pnpm cf-typegen   # wrangler types → worker-configuration.d.ts (regenerable; gitignored)
```

`dist/` layout after a build: `dist/client/` (static assets) + `dist/server/`
(the SSR Worker, entry `dist/server/index.js`).

`worker-configuration.d.ts` is **gitignored** and **excluded from `tsconfig.json`**:
its Cloudflare Workers `Element` global collides with the DOM lib (`removeAttribute`
returns `Element` vs `void`). The app is DOM-centric, and the only bindings so
far are the two rate limiters — which `wrangler types` does not emit types for
anyway, and which `src/rateLimit.server.ts` reads from an untyped record. If
typed bindings (KV/R2/D1/DO) are ever added, create a Worker-scoped tsconfig
that re-includes it.

---

## How to test

### Locally (Node ≥22.15)
```bash
pnpm build && pnpm preview   # open the printed localhost URL — runs in workerd
```
Exercise `/` (landing), `/shop`, `/admin` login (proves the session secret +
`NODE_ENV`), and toggle Coming Soon.

### Deploy validation without uploading
```bash
wrangler deploy --dry-run    # validates config + bundling + assets, uploads nothing
```

### Production
```bash
pnpm run deploy              # → *.workers.dev URL
```
Test the `*.workers.dev` URL end-to-end before attaching the custom domain.

---

## Custom domain (GoDaddy → Cloudflare)

Workers custom domains require the DNS zone to live **on Cloudflare**, i.e. move
nameservers from GoDaddy to Cloudflare. **Before switching nameservers**, add the
site in the Cloudflare dashboard and confirm Google Workspace email records were
imported, or email breaks:

- **MX:** `smtp.google.com` (priority 1) + any legacy `aspmx*.googlemail.com`
- **TXT (SPF):** `v=spf1 include:_spf.google.com ~all`
- **TXT (DKIM):** the `google._domainkey` (or custom selector) record
- **TXT (DMARC):** the `_dmarc` record
- Any Google site-verification TXT + calendar CNAMEs

Then change the GoDaddy nameservers to the two Cloudflare NS shown, and once the
zone is active add the Workers custom domain under **Workers & Pages → the Worker
→ Settings → Domains & Routes**. Cloudflare provisions the record + TLS.

---

## Coming Soon on Workers

The Coming Soon gate serves HTTP 200 on every route with **no redirects** and
`/admin` **exempt** (`src/features/comingSoon/lib/comingSoonGate.ts`) — so it
never blocks CMS/admin and is fully Workers-compatible. Toggling the CMS flag
updates open tabs without a redeploy.

---

## Security headers (`src/start.ts`)

Request middleware sets `X-Content-Type-Options`, `Referrer-Policy`,
`X-Frame-Options`, HSTS, a CSRF double-submit cookie, and a **report-only** CSP
built per-request via `buildCspReportOnly(isDev)`:

- `'wasm-unsafe-eval'` (script-src) — three.js / drei WASM decoders (prod-safe).
- `blob:` (connect-src) — three.js blob-URL fetches.
- `'unsafe-eval'` (script-src) — **dev only** (Vite HMR + devtools); production
  stays strict.

Still report-only pending the Phase J switch to enforcing (see
`technical-debt.md`).
