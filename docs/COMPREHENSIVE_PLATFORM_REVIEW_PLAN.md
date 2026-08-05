# Comprehensive Platform Review & Optimization Plan

**Date:** 2026-08-04
**Scope:** Customer-facing storefront · CMS / internal admin · Supabase (database, auth, storage, Edge Functions, security)
**Method:** Read-only audit. **No source file, config, migration, Supabase object or production row was modified. No build was run. No destructive SQL was executed. Live Supabase access was SELECT-only throughout.**

> This document is a **review and a plan**. Related tracking: `docs/next-steps.md` (launch blockers), `docs/technical-debt.md` (finding IDs), `docs/audit-2026-05-17.md`.

## Status — Phase 0 progress

| Item | State |
|---|---|
| **0.1** Fake-order path (`F-01`, `F-21`, `F-09`) | ✅ **Done.** Fallback into the mock gateway removed; `/checkout` guarded by `isInternalCheckoutEnabled()` (Shopify-unconfigured **and** DEV only); partial Shopify carts now throw instead of silently checking out a subset; `placeOrder` failures surfaced. |
| **0.2a** SVG sanitizer (`F-02`) | ✅ **Done.** `themeSvgMarkupForTint` now strips `on*` handlers, `<foreignObject>`, `javascript:`/`data:text/html` hrefs and cross-origin refs, with 20 tests covering each vector. Appearance preserved (`<style>` and `currentColor` tinting kept). |
| **0.2c** `snippetId` validation (`F-08`) | ✅ **Done.** Per-provider regex at the Zod boundary; empty values still allowed so half-filled rows save. |
| **0.3** `passport_content` guard (`F-03`, `F-05`) | ✅ **Done.** Added to the clobber guard, and the guard list is now an **exhaustive `Record<CmsSettingsFieldKey, …>`** so a new column cannot ship unclassified — `pnpm typecheck` fails if it does. |
| **0.4** Migration backfill (`F-04`) | 🟡 **Half done.** The 8 content-gap files are restored verbatim from production (SELECT-only read), including both security-hardening migrations. The **version-numbering divergence is NOT fixed** — see `F-04(b)`; it needs a deliberate `supabase migration repair`/renumber, which is destructive-adjacent and awaits explicit approval. |
| **0.2b** Refresh token in localStorage (`F-20`) | 🟡 **Mitigated, not eliminated.** `persistSession: false` — the session is memory-only, so the refresh token no longer sits in localStorage where one line of injected script can read it. `setSession` is now awaited before the CMS pull at all three call sites (the persisted copy had been masking that race). **Removing the token from the browser entirely** needs supabase-js's `accessToken` factory, which disables `supabase.auth.*` — and `auth.getSession()` is called by 8 admin services. Tracked as Phase 2 work. |
| **1.2** Admin edge off the storefront root (`F-06`) | 🟡 **Mostly done.** The admin edge is gone (lazy `AdminRootShell`), and every source-level path to supabase-js is now lazy — verified with a static-import graph walk. Entry **290.8 → 253.9 KB gzip (−12.7%)**. **Still open:** the entry pulls ~60 bindings from `admin-cms-remote`, so the SDK is still fetched eagerly. See `F-06(b)` — including a correction to this doc's previously-recorded root cause. |
| **F-34** Four silent dynamic-import bugs (**NEW**, found 2026-08-05) | ✅ **Fixed + guarded.** Chasing `F-06(b)` into a *built* bundle surfaced four live runtime bugs, all one shape: a module reached via `await import(...)` was merged into the entry chunk, so Rolldown retargeted the import at the entry — whose namespace does not re-export the bindings. Confirmed at runtime: the entry exposes 307 exports and none of the four names is among them. **(1)** `useLenisScroll` got `ScrollTrigger === undefined`, throwing on **every desktop page load** and disabling Lenis↔ScrollTrigger. **(2)** `lazySupabaseAccountClient` got `undefined`, breaking **every account method**. **(3)** `runtimeClients` `undefined` in the `_slug` route. **(4)** `getAdminSessionServerFn` `undefined` in the admin CMS remote path. Dev was clean and all 2,566 tests passed throughout — this class is invisible outside a production build. Fixed with chunk pins; **`scripts/check-dynamic-import-entry.mjs` now runs in `pnpm build`** and fails on the signature (220 chunks, 0 offenders). |
| **1.5** Cache non-fingerprinted media | ✅ **Done.** `public/_headers` now covers `/about/*` and `/videos/*` (30 d) and `/brand/*`, `/page-backgrounds/*`, `/landing/*`, `/shop/*`, `/account/*` (7 d). ~18 MB previously had no `Cache-Control` at all. Finite max-age rather than `immutable` because these are **not** content-hashed. |
| **1.7** Sidebar preload | ✅ **Done.** `preload="intent"` restored on both sidebar link components. The old comment justified `false` with "no useful data to preload", which conflated loader data with the route **module** — every editor is a `lazyRouteComponent`, so hovering now fetches its 19–74 kB chunk instead of waiting for the click. |
| **0.5** Rate limiting (`F-07`) | ✅ **Done.** `ADMIN_LOGIN_RATE_LIMIT` (20/60 s, keyed by `CF-Connecting-IP`) on the sign-in server fn and `CSP_REPORT_RATE_LIMIT` (60/60 s) on the anon report endpoint, via Cloudflare `ratelimits` bindings. `src/rateLimit.server.ts` **fails open** everywhere, so a missing binding can never refuse traffic. **Activates on the next deploy.** Still unthrottled: the anon `coming_soon_subscribers` insert, passport claim, review submit. |

---

## Context

ANVL Athletics is a **live but pre-traffic** SSR storefront + admin CMS (TanStack Start, React 19, Vite 8, TypeScript strict) on Cloudflare Workers, backed by Supabase, with Shopify configured as the commerce backend.

The audit was commissioned under one hard constraint:

> **"Do not break anything, everything is working, we want to optimize only."**

That constraint shaped every recommendation. **Nothing here proposes rewriting a working system.** Where the implementation is already correct it is recorded as a *strength*, so a later pass does not "optimise" it away.

### Verified baseline (measured 2026-08-04)

| Signal | Measured value |
|---|---|
| Test suite | **2,464 tests / 256 files — 100% passing** (exit 0) |
| Test duration | **606 s**; env setup 696 s, import 1,143 s (aggregate across 4 workers) |
| jsdom necessity | only **119 of 256** files touch the DOM; 137 are pure logic |
| Client build | 26 MB; **211 JS chunks**; 4.4 MB raw JS |
| Entry chunk | 963.5 KB raw / **290.8 KB gzip** |
| Always-loaded entry graph | **1,716,584 B raw / 520,205 B gzip** before any route chunk |
| vendor-three | 971.0 KB raw / 261.2 KB gzip (lazy + capability-gated) |
| CSS | 320.2 KB raw / **41.7 KB gzip** — single global sheet, 3,677 rules, 215 custom props |
| Fonts | 189.4 KB / 15 woff2 — `unicode-range` gated → **healthy, no action** |
| SSR projection row | **15 kB**, one PK-indexed read → **healthy, no action** |
| Passport tokens | `crypto.randomUUID()`, 122-bit → **healthy, no action** |
| Live state | `the-oath` published 2026-08-03; Coming Soon **off**; banner off; `site_seo` = `{}` |
| Production data | 1 admin, 3 passports (3 claimed), 1 customer, 1 order, 1 subscriber, 35 media assets |
| Supabase | `cptebkgyrfmokklwtrgp`, ACTIVE_HEALTHY, Postgres 17.6, 22 tables, RLS on **all** |
| Migrations | **65 applied vs 63 on disk** — 8 applied have no file |

### The single most important prioritisation input

Production data volumes are **tiny** (1 order, 3 passports, 35 assets). Scale work — virtualization, pagination, N+1, index tuning — is therefore **not urgent**. What matters is **launch correctness and security**, because the store is live and the first real customer is the one who gets hurt by `F-01`.

---

## 1. Executive Summary

**Overall health: strong.** This is an unusually disciplined codebase for 1,241 TS/TSX files. Architectural boundaries are real, the adapter/dependency-inversion design is genuine, `workerd` SSR safety is handled deliberately, and 2,464 tests pass.

**But there is one defect that can take a customer's order and never place it**, and one security chain that can escalate a CMS *editor* to full *admin*. Both are contained and cheaply fixable.

### Highest-risk findings

| ID | Finding | Why it matters |
|---|---|---|
| **F-01** | Shopify checkout failure silently falls through to a **mock payment gateway that always returns `status: 'placed'`** | A real buyer sees "Order placed successfully" and an order number. **No order exists. No payment taken.** |
| **F-02** | CMS SVG "sanitizer" strips only `<script>`, then `dangerouslySetInnerHTML`; admin **refresh token sits in localStorage**; CSP is report-only *and* allows `'unsafe-inline'` | Complete editor → admin takeover chain. Three independent layers all fail open. |
| **F-03** | `passport_content` is a whole-map column with **no clobber guard**, unlike its identical sibling `pdp_content` | One save from an unhydrated browser erases **every** product's passport content, in both tables. |
| **F-04** | 8 applied migrations have **no file on disk** — including `tighten_cms_settings_rls…` and `sec25_remove_public_storage_listing_policies` | A `db push` into a fresh project rebuilds a **materially less secure** database than production. |
| **F-07** | Zero rate limiting anywhere (verified by repo-wide grep + `wrangler.jsonc`) | Admin login brute-force; unbounded anon insert; unauthenticated CSP-report endpoint. |

### Strongest areas — do not refactor these

- **Admin auth** (`adminAuthCache.ts`) — 45 s promise cache with an explicitly reasoned guard preventing cross-request session bleed on a reused workerd isolate. Better than most production systems.
- **Passport concurrency** — `claim_passport` / `accept_passport_transfer` put the authorization predicate *inside* the `UPDATE … WHERE`, so Postgres row locking arbitrates races for free. Correct pattern; must not be "improved" into `SELECT … FOR UPDATE`.
- **Admin shell** — the persistent sidebar/topbar **are** correctly hoisted above `<Outlet/>` (`src/routes/admin/route.tsx`), and the shell does **not** flash on editor navigation. `F-14` was investigated against the router source and **retracted**; see its row.
- **Route-level splitting** — every `/admin/*` route uses `lazyRouteComponent`; the landing registry uses `lazy()` per page; `vendor-three` / `vendor-pdfjs` / `vendor-zod` genuinely off the entry.
- **Zod discipline** — every CMS untrusted-blob parser has a dedicated test. `snippetId` (`F-08`) is the sole hole.
- **`techpack-ai` edge function** — textbook SSRF guard (origin *and* path-prefix check) with the reasoning written down.
- **Colour-token discipline** — **zero** arbitrary hex Tailwind utilities across 638 `.tsx` files.

### Recommended strategy

Four sequenced phases, smallest blast radius first. **Phase 0 is five contained changes** and closes every launch blocker. Nothing in Phase 0 touches architecture.

---

## 2. Architecture Overview

```
  Browser ──► Cloudflare Worker (workerd) — src/start.ts
              security headers · CSRF double-submit cookie · Cache-Control
                       │ SSR
              src/routes/__root.tsx  loader
                       │
              loadStorefrontProjection()  ─── 1 read, 15 kB, explicit column list
                       │
        ┌──────────────▼───────────────┐
        │ storefront_publication       │ ◄── anon SELECT (true)   [by design]
        └──────────────────────────────┘
                       ▲ adminCmsRemoteSync (Promise.all, NOT atomic — F-19)
        ┌──────────────┴───────────────┐
        │ cms_settings                 │ ◄── CMS-role only, NO anon  [verified]
        └──────────────────────────────┘

Contracts   src/app/config/clients.ts       8 interfaces (2 are dead — see Cleanup)
Wiring      src/app/config/runtime.ts       server→seed | browser→localStorage
Commerce    createCommerceClient()          Shopify (env set) | seed | localStorage
Payments    runtime.ts:57,90 → mockPaymentClient
                                            ⚠ the ONLY payment client that exists
```

### Data flows

- **Storefront read:** SSR loader → `loadStorefrontProjection()` → one anon PostgREST select of `storefront_publication` (`id=eq.1`, explicit column list, 15 kB) → `SiteThemeProvider` + `LandingPageRenderer`.
- **CMS write:** admin edits localStorage working copy → `adminCmsRemoteSync` → parallel update of `cms_settings` **and** `storefront_publication` (not atomic — `F-19`).
- **Commerce:** `createCommerceClient()` selects Shopify when `VITE_SHOPIFY_*` are set; cart handoff calls `startCheckout()` → Shopify `cartCreate` → hosted `checkoutUrl`.

### Auth & authorization flow

`/admin/*` → `beforeLoad` → `getCachedAdminSession()` (45 s cache, browser-only, bypassed when `window === undefined`) → `getAdminSessionServerFn()` → Supabase `refreshSession` + `cms_profiles.role = 'admin'` + cookie re-seal.

There are **only three server functions in the entire repo** (`loginAdminServerFn`, `logoutAdminServerFn`, `getAdminSessionServerFn`); both state-changing ones carry CSRF middleware. Every other admin mutation goes browser→Supabase under the user's own JWT, so **RLS — not the UI — is the authority**. That is a defensible design, not a bypass.

### Boundary enforcement — an important correction

An initial probe of the built entry chunk for admin **UI** markers (`AdminShell`, `adminSidebar`, `adminNav`) returns zero hits, which suggests the boundary holds. **It does not.** Verified in source:

```
src/routes/__root.tsx:19       import { AdminAuthProvider }  from '@/features/admin/auth/AdminAuthProvider'
src/routes/__root.tsx:20       import { AdminThemeProvider } from '@/features/admin/theme/AdminThemeProvider'
src/routes/__root.tsx:317-318  <AdminThemeProvider><AdminAuthProvider>   ← wraps EVERY route
```

`AdminAuthProvider.tsx:25-27` then statically imports `getAdminSupabaseBrowserClient`, `hydrateAdminCmsFromSupabase` and `clearCmsProfileRoleCache`. The built artifact confirms **`@supabase/supabase-js` lives entirely in `admin-cms-remote-*.js`** (370.6 KB raw / 98.3 KB gzip) — reachable from the storefront root via a static import edge.

**`MAINT-02` in `CLAUDE.md` claims "exactly one violation". That is stale — there are 13+**, including these two in the storefront root, plus an 11-file `cms ↔ admin` import cycle.

### Deployment / runtime assumptions

Cloudflare Workers (`workerd`) via `@cloudflare/vite-plugin`, Smart Placement enabled (SSR runs near Supabase). `VITE_*` are **build-time** and must be present when `vite build` runs. Server secrets (`ANVL_ADMIN_SESSION_SECRET`) are Worker secrets. Static hashed assets are served by the Assets binding using `public/_headers`, bypassing the SSR Worker entirely.

---

## 3. Findings Inventory

**Severity:** Critical / High / Medium / Low.
**Confidence:** `confirmed` (read and reproduced) · `probable` (one named assumption remains) · `unverified` (needs a tool not available in this pass).

### Critical

| ID | Area | Type | Finding | Files | Conf. |
|---|---|---|---|---|---|
| **F-01** | Storefront | Correctness | **Checkout falls through to the mock gateway.** Both entry points wrap `startCheckout()` in `try { … } catch { /* swallowed */ }` then `navigate('/checkout')`. `/checkout` has **no Shopify guard and no cart guard**; `runtime.ts:57,90` wires `mockPaymentClient` as the only payment client; `paymentGateway.mock.ts:10-14` returns `{ orderId: 'ANVL-'+Date.now(), status: 'placed' }` unconditionally, and the UI clears the cart and toasts "Order placed successfully." **Also reachable by typing `/checkout` directly.** | `routes/cart.tsx:47`, `cart/components/CartDrawer.tsx:31`, `routes/checkout/index.tsx:69`, `app/config/runtime.ts:57,90`, `checkout/api/paymentGateway.mock.ts:10` | confirmed |
| **F-02** | Security | Security | **Editor → admin escalation chain.** `themeSvgMarkupForTint()` strips only `<script>` via regex — no `onload`/`onerror`/`onbegin`, no `<foreignObject>`, no `javascript:` href — then the result reaches `dangerouslySetInnerHTML`. `adminAuth.ts:112,121,202,210` return `refresh_token` to the browser and `adminSupabaseBrowserClient.ts:71,79` persist it in localStorage — **contradicting the code's own comment** at `adminAuth.ts:156-158`. CSP is Report-Only **and** carries `script-src 'unsafe-inline'`, so inline handlers execute even if flipped to enforcing. | `shared/lib/themeSvgMarkup.ts:2`, `admin/auth/adminAuth.ts:112`, `admin/auth/adminSupabaseBrowserClient.ts:71`, `start.ts:42,124` | confirmed |
| **F-03** | CMS | Correctness | **`passport_content` whole-map clobber.** `WHOLE_MAP_COLUMNS` (`adminCmsRemoteSync.ts:140-153`) protects only `pdp_content` and `shop_config`. `passport_content` is structurally identical (per-slug map, read at `:237`, declared at `:67`) and has **no guard**. The file's own comment documents the failure: an unhydrated snapshot "publishes a map containing only what this session happened to touch and **destroys the rest**" — in `cms_settings` *and* the anon-readable mirror. Root cause: hydration coverage is typecheck-enforced (`:53-57`) but the guard list is hand-maintained. `support_content` (per-slug care/size) likely shares the exposure. | `admin/cmsRemote/adminCmsRemoteSync.ts:140,237`, `admin/cmsRemote/adminCmsHydration.ts:56` | confirmed |
| **F-04** | Supabase | Security | **Migrations no longer reproduce production — and the drift has two distinct layers.** (a) **Content gap:** 8 applied migrations had their SQL on disk **nowhere**, including **`tighten_cms_settings_rls_and_revoke_rls_auto_enable_grant`** and **`sec25_remove_public_storage_listing_policies`** — the two that closed anon read of CMS drafts and public listing of media buckets. (b) **Version divergence (worse, found while fixing (a)):** the on-disk folder uses synthetic `…120000` timestamps while the applied history uses real ones, so only **7** of the original 63 files matched an applied version. **56 on-disk files have versions that were never applied**, and 49 applied versions have no file at that version. `supabase db push` against production would therefore try to **re-apply ~56 migrations**, not merely miss a few. `fix_publish_drop_body_column` was also applied **twice**. See §Status for what has been fixed. | `supabase/migrations/` vs `supabase_migrations.schema_migrations` | confirmed |
| **F-05** | CMS | Correctness | **Silent CMS hydration failure → publishes code defaults over live content.** A failed per-column hydration pull is not surfaced; the editor then publishes defaults over real content. This is the mechanism that arms `F-03`. | `admin/cmsRemote/adminCmsHydration.ts:156,162`, `admin/auth/AdminAuthProvider.tsx:93` | confirmed |

### High

| ID | Area | Type | Finding | Files | Conf. |
|---|---|---|---|---|---|
| **F-06** | Architecture | Performance | **(a) FIXED 2026-08-04.** The storefront root statically imported the admin auth/theme providers, putting the admin stack in every route's graph. The whole `/admin` branch now sits behind a lazy `AdminRootShell`; the build confirms `AdminAuthProvider` became its own 2.13 kB chunk. **(b) PARTIALLY FIXED 2026-08-05; the eager fetch is STILL OPEN.** `@supabase/supabase-js` is bundled *inside* `admin-cms-remote` (380 KB raw), which the entry statically imports.

> **Correction — the previously recorded root cause was wrong.** This doc claimed `manualChunks` "is never invoked with a supabase module id at all" and that the rule was therefore unreachable code. That is false. Re-instrumenting the build printed **330 module ids**, including `.../node_modules/@supabase/auth-js/dist/module/GoTrueClient.js`, whose paths *do* contain `node_modules/@supabase` — the rule matches and fires. The real behaviour: **Rolldown merges any chunk that is always loaded alongside its importer.** Every requested chunk that emitted (`vendor-gsap`, `vendor-three`, `vendor-pdfjs`, `vendor-fuse`, `vendor-lenis`) is lazily loaded; every one that did not (`vendor-supabase`, `vendor-tanstack`) is statically reachable from the entry. Proof: switching to Rolldown `advancedChunks` with `priority: 200` **did** emit a 197 KB `vendor-supabase`, so the mechanism works — but the entry still imported it, because a merge decision follows reachability, not naming. **A `manualChunks` name is a request, not a guarantee — always verify against `dist/client/assets/`.**

**Done:** every source-level path to the SDK is now lazy — `isStorefrontAuthEnabled` split into an SDK-free module so the site-wide nav stops importing the `./auth` barrel, and the Story slice defers the publication client. A static-import graph walk confirms all four SDK importers are unreachable eagerly. `cms-core` + `vendor-sonner` pins stopped the admin chunk swallowing shared storefront code. Entry: **290.8 → 253.9 KB gzip (−12.7%)**.

**Still open:** the entry imports ~60 bindings from `admin-cms-remote`, so the SDK is still fetched on first paint. Closing it means unpicking that last binding edge — not another matcher tweak. | `routes/__root.tsx`, `vite.config.ts` | confirmed |
| **F-07** | Security | Security | No rate limiting **anywhere** (repo-wide grep + `wrangler.jsonc`: no binding, no KV/D1 counters, no WAF). Exposed: admin login, anon `coming_soon_subscribers` insert (the only anon-writable table), unauthenticated `/api/csp-report`. | `admin/auth/adminAuth.ts:61`, `comingSoon/api/subscribeComingSoon.ts:36`, `routes/api/csp-report.ts:19` | confirmed |
| **F-08** | Security | Security | `snippetId` is unconstrained `z.string()` interpolated into `script.innerHTML` in 4 places. Hotjar is worst: `hjid:${id}` is an **unquoted JS value**. Requires editor role; `site_seo` is `{}` today, so **not currently exploitable in production** — severity reflects that. | `cms/siteSeo.local.ts:110`, `shared/components/seo/MarketingToolsHead.tsx:27,40,58` | confirmed |
| **F-09** | Storefront | Correctness | `createShopifyCheckout` **silently drops** cart lines with no variant GID and proceeds when the filtered list is merely *partially* empty — buyer is checked out for part of their cart. | `shopify/api/shopifyCart.ts:41-42` | confirmed |
| **F-10** | Storefront | Correctness | `variantId` — the field deciding real money vs mock — is re-derived at **three duplicated call sites** with the same magic fallbacks (`'Default'`, `'One Size'`) and asserted at none. | `products/components/ProductCardQuickAdd.tsx:106`, `products/pdp/hooks/usePdpVariant.ts:88`, `products/components/ProductQuickView.tsx:112` | confirmed |
| **F-11** | Storefront | UI/UX | Every customer-visible price hardcodes `$`; the mapped Shopify currency is used **only** in JSON-LD. **No currency formatter exists anywhere.** | `products/pdp/PdpBuyPanel.tsx:96,177`, `products/pdp/PdpStickyBar.tsx:20`, `products/components/ProductQuickView.tsx:191,235`, `products/shop/hooks/useShopFilters.ts:159,166` | confirmed |
| **F-12** | Security | Security | Open redirect: `sanitizeInternalRedirect` rejects `//host` but accepts **`/\host`**, which the WHATWG URL spec resolves to `https://host/`. | `storefront-account/publicAccount.core.ts:113`, `routes/auth/sign-in.tsx:51`, `routes/auth/callback.tsx:49` | confirmed |
| **F-13** | CMS | Responsiveness | Admin media library: virtualizer hardcodes 3 columns while the CSS grid is 1/2/3 → rows overlap and most assets become **unreachable below 1024px**. | `admin/media/MediaAssetGrid.tsx:292,379,385` | confirmed |
| **F-14** | CMS | Performance | **RETRACTED 2026-08-05 — the flash does not reproduce.** Traced against the installed router source (`@tanstack/react-router` 1.169.2, `router-core` 1.169.1): a route renders its `pendingComponent` only when THAT match is `status: 'pending'`. On an intra-admin navigation the `/admin` layout match id is constant, so `matchRoutes` finds the existing match and **spreads it with `status: 'success'`** — `'pending'` is only ever assigned for a NEW match, and `executeBeforeLoad` sets `isFetching`, never `status`. Rendering also reads from the committed `matchStores` while in-flight updates go to `pendingMatchStores`. So the full-screen `AdminRoutePending` is reachable only when the `/admin` match is genuinely new (arriving from a storefront route) or while the `lazy()` shell chunk loads — both moments when **no shell exists**, making a full-screen loader correct. The real residual is smaller: the layout `beforeLoad` serialises ahead of the child load, stalling navigation by ~2 Supabase round trips once per cache window. **No code change made** — `pendingComponent`, `defaultPendingMs` and the 45 s TTL are all left alone, since raising the TTL would only widen the stale-admin-chrome window to fix a flash that is not there. | `routes/admin/route.tsx:44`, `router.tsx:15` | **refuted** (source-verified, not runtime-verified) |
| **F-15** | CMS | Performance | Every hard admin load blanks the shell behind "Loading CMS…" while **nine Supabase round-trips run in series**. | `admin/components/AdminShellLayout.tsx:41`, `admin/cmsRemote/adminCmsHydration.ts:126,156` | confirmed |
| **F-16** | CMS | Correctness | The 10-min session heartbeat re-hydrates localStorage and **silently discards unsaved edits**, without consulting `useAdminDirtyRegistry`. | `admin/auth/AdminAuthProvider.tsx:176-177`, `admin/hooks/useSingletonCmsEditor.ts:44` | confirmed |
| **F-17** | CMS | UI/UX | One thrown error in any editor blanks the **entire** admin shell, contradicting the error boundary's own contract. | `routes/admin/route.tsx:61`, `app/components/AdminErrorBoundary.tsx:5` | confirmed |
| **F-18** | Supabase | Correctness | `accept_passport_transfer` never resets Armory state (`wear_count`, `last_worn_at`, `featured_slot`, `is_public`) — can **hard-fail** on the `(claimed_by, featured_slot)` partial unique index and silently republishes the new owner's name. Function predates those columns. | `migrations/20260714120000_passport_transfers.sql:153`, `migrations/20260716120000_armory_life.sql:37` | confirmed |
| **F-19** | CMS | Correctness | CMS publish writes `cms_settings` + `storefront_publication` via `Promise.all` with **no transaction and no rollback** — a partial failure permanently diverges editor truth from the live storefront. | `admin/cmsRemote/adminCmsRemoteSync.ts:401,410` | confirmed |
| **F-20** | Security | Security | Admin Supabase **refresh token in localStorage** (second half of `F-02`; tracked separately because it is independently fixable). | `admin/auth/adminAuth.ts:112,121,202,210`, `admin/auth/adminSupabaseBrowserClient.ts:71,79` | confirmed |
| **F-21** | Storefront | Correctness | Order submission has **no error handling** — a failed order is completely silent. | `routes/checkout/index.tsx:57,69` | confirmed |
| **F-22** | Storefront | Correctness | Cart persisted to localStorage with **no Zod schema, no version, no migrate** — violating the project's own `createJsonStore` rule (SEC-17). A malformed value throws inside the site-wide nav; also causes a hydration mismatch for returning customers. | `cart/store/cart.store.ts:21,65`, `shared/components/layout/PremiumNavTopbar.tsx:40` | confirmed / probable |
| **F-23** | Performance | Performance | About-page GLBs are **85–88% uncompressed embedded textures**, `extensionsUsed: []` — no Draco/meshopt/KTX2. 10.8 MB combined; geometry is trivial (~18k verts each). | `public/about/anvil.glb`, `public/about/hammer.glb` | confirmed |
| **F-24** | Performance | Performance | CMS media served as **raw full-resolution originals** — `publicCmsMediaUrl()` uses the raw-object endpoint, not Supabase's `/render/image/…?width=&format=` transform. **Not one `srcSet` in the codebase.** Production `/about` points at five 2752×1536 PNGs totalling **36.7 MB**. | `cms/media/mediaUrl.ts:23`, `about/mobile/AboutMobilePage.tsx:97` | confirmed |
| **F-25** | Performance | Performance | Hidden desktop hero `<video preload="auto">` stays in the DOM on phones; both elements resolve to the **same 6.97 MB file** (no mobile encode, no WebM, no poster asset). | `TheOathLanding/components/OathHero.tsx:228,246`, `TheOathLanding/theOathAssets.ts:113` | probable |
| **F-26** | Responsiveness | UI/UX | The Oath landing **deletes two of five scenes below 1280px** rather than designing a mobile version. | `TheOathLanding/components/OathManifesto.tsx:20`, `.../OathTenets.tsx:389` | confirmed |
| **F-27** | A11y | Accessibility | Primary CTA fails WCAG AA: white on `accent #c2703d` = **3.698:1**; gradient top `mix(accent, white, .24)` = **2.612:1**. (Both recomputed independently.) | `cms/config/cmsSiteConfig.zod.ts:206,207,337` | confirmed |
| **F-28** | A11y | Accessibility | Stacked dialogs: one Escape closes **every** open dialog including the parent wizard. | `shared/hooks/useDialogFocusTrap.ts:36-41,56`, `admin/components/wizard/AdminWizard.tsx:341` | confirmed |
| **F-29** | A11y | Accessibility | ~180 admin form controls have **no programmatic label**, including the admin sign-in email field. | `shared/components/ui/FormField.tsx:27,66-68`, `routes/admin/-adminLogin.tsx:85-92` | confirmed |
| **F-30** | Storefront | UI/UX | `/account` bounces an already-signed-in customer through sign-in on **every fresh tab**. | `storefront-account/publicAccount.ui.tsx:117,124` | confirmed |
| **F-31** | Storefront | UI/UX | Cart promises "Shipping — calculated at checkout"; checkout **never calculates it**. | `routes/cart.tsx:136`, `routes/checkout/index.tsx:199,216` | confirmed |
| **F-32** | Storefront | UI/UX | Checkout payment step shows **developer copy naming a `VITE_` env var** to the shopper. | `checkout/components/CheckoutPaymentFields.tsx:26,46` | confirmed |
| **F-33** | Performance | Performance | **SSR projection is discarded and re-fetched on the client.** `@tanstack/react-router-ssr-query` is **installed and never imported** — nothing bridges the loader payload into the React Query cache. Every document load, route-loader entry and hover-preload re-fetches the same row and re-runs **~12 Zod parsers on the main thread**. | `routes/__root.tsx:82,276`, `package.json` | confirmed |

### Medium

**Storefront** — home gate hides all nav + locks scroll for up to **12 s** (`landingPages/landingEntryLoad.ts:141`, `LandingPageRenderer.tsx:79`) · loader failures render TanStack's **unbranded default error page with the raw error one click away** (`router.tsx:9`) · PDP has **no shipping/delivery/returns info at all** (`products/pdp/PdpBuyPanel.tsx:31`) · mini-cart checkout does a **full page reload** (`cart/components/CartDrawer.tsx:36`) · mobile sticky bar never shows the selected size (`products/pdp/PdpStickyBar.tsx:17`) · sign-in prints **working demo credentials** when Supabase env is missing (`routes/auth/sign-in.tsx:92`).

**CMS** — sidebar links **disable preload**, so each editor chunk downloads only on click (`admin/components/AdminSidebarNavLink.tsx:22`) · passport/media reads have **no limit or pagination** — PostgREST will silently truncate and ledger stats will be wrong (`admin/passports/passports.service.ts:92`) · passport ledger unvirtualized while the media grid beside it is virtualized (`admin/passports/AdminPassportCodesPanel.tsx:334`) · `deletePassport`/`deleteBatch` **skip the live-session guard** and never prove a row was affected (`passports.service.ts:175`) · deleting a media asset gives **no warning it is assigned to a live slot**, though the component already knows (`admin/media/MediaAssetGrid.tsx:464`) · every admin SSR request pays a **full storefront-projection fetch + Zod parse it never uses** (`routes/__root.tsx:81`).

**Supabase** — `get_product_reviews` applies **`LIMIT 50` before `ORDER BY`** → arbitrary subset past 50 reviews (`migrations/20260716120000_armory_life.sql:352`) · `orders` RLS coerces a missing JWT email to `''`, so an empty-email order is readable by any token lacking an email claim (`migrations/20260630130000_orders.sql:38`) · `shopify-webhook` compares HMAC with **short-circuiting `===`** (timing side channel) and has **no replay/ordering guard** (`supabase/functions/shopify-webhook/index.ts:29,148`) · `coming_soon_subscribers` is the only anon-writable table, shape-guard only, **no throttle** · `get_public_armory.total_pieces` counts **private** passports · `log_passport_wear` check-then-update is racy · `admin_unassign_passport` allows **`editor`** to destroy customer passport ownership though the documented model is admin-only · 21 post-PERF-20 policies still call bare `auth.uid()` · `touch_row_updated_at` has a mutable `search_path` · Supabase Auth **leaked-password protection is disabled**.

**Security** — cookies lack the **`__Host-`** prefix, so a same-site subdomain defeats both `SameSite=Lax` and double-submit CSRF · **"Remember me for 30 days" silently expires at 7 days** (`admin/auth/adminAuthSession.server.ts:13,61`) · CMS theme colours and font names are interpolated **unescaped** into the SSR `<style>` in `<head>` on every route (`cms/api/storefrontProjectionHead.ts:22`) · no timeout/abort on the Supabase fetches that block SSR (`cms/api/supabaseRest.ts:44`).

**Performance** — `vendor-supabase` and `vendor-tanstack` `manualChunks` rules **emit no chunk at all** under Vite 8/Rolldown; TanStack is inlined into the entry (`vite.config.ts:118,120`) · `public/_headers` covers only `/assets/*`, leaving **18 MB of non-fingerprinted media with no cache rule** · home entry gate **preloads two hero videos the live hero never renders** (production `heroMediaMode` is `'products'`, but the gate collapses it to a binary) and skips the images it does need (`landingPages/landingEntryLoad.ts:24`) · `useComingSoonConfig` refetches the publication row from the browser on **every page including `/admin`** for data already in the loader payload.

**React runtime** — cart badge is the one place the codebase forgets its own `mounted` hydration gate (`shared/components/layout/PremiumNavTopbar.tsx:40,153`) · storefront Supabase auth bootstrap runs **2–4× concurrently** — the exact duplication the admin half already fixed (`storefront-account/publicAccount.core.ts:272`) · customer profile fetched **twice per page** via two paths, one bypassing React Query entirely (`account/AccountMenu.tsx:41`, `products/pdp/PdpSizeSuggestion.tsx:37`).

**Animation** — `OathCursor` allocates GSAP tweens on **every** `pointermove`/`pointerover` (`TheOathLanding/components/OathCursor.tsx:54`) · `SiteDustLayer` — the most frequently mounted WebGL canvas — **ignores `useCanvasMountGate`** (`shared/webgl/SiteDustGate.tsx:53`) · Story book page-drag adds window listeners with **no unmount cleanup** (`story/components/book3d/Book.tsx:285`).

**Accessibility** — `Modal` and `Drawer` **never lock background scroll** despite `useLockPageScroll` existing (`shared/components/ui/Modal.tsx:92-99`) · inputs have a **1.4:1** border vs the 3:1 required by SC 1.4.11 · passport hotspot placement is **mouse-only** (`admin/passports/MarkerPlacerCanvas.tsx:95-108`) · `role="listbox"/"option"` on individually-tabbable buttons (`shared/components/ui/SizeSelector.tsx:15`) · tab bars declare `role="tab"` with no tabpanel/`aria-controls`/arrow keys · **two nested `<main>`** on every admin page · **no skip link** in admin.

**Design system** — **no elevation token at all** — 72 bespoke `shadow-[…]`, 54 hardcoding rgba black/white **while the CMS still offers a Light appearance** · **no z-index scale** — 25 distinct values plus two nine-digit escape hatches · 365 arbitrary `text-[…]` sizes, 308 below Tailwind's 12px floor · `ICON_SIZE` buckets bypassed in **185** places, 103 at off-scale 15/17px · the CMS-exposed **Focus ring token is never read by the storefront** (`styles.css:965`) · **no primitive implements an error state**, yet `FormField`, `PhoneInput` and the theme preview all promise one · ~28 orphaned CSS classes + 24 dead `[data-experience='theoath-modern']` selectors still shipping · `docs/design-system.md` documents **five components and three tokens that no longer exist**.

**Responsiveness** — storefront nav icon controls are **36×36 on every phone width** — the touch-target rule is inverted, 44px only from 640px *up* (`PremiumNavTopbar.tsx:52`) · shop quick-add popover clipped by the card's `overflow-hidden` below ~234px (`ProductCardQuickAdd.tsx:199`) · admin live-preview panel openable below 1024px from an ungated Locate button whose closing toggle is hidden there (`admin/preview/AdminPreviewLocateButton.tsx:26`) · PDP gallery arrows are `opacity-0` but still **hit-testable**, intercepting taps meant for zoom (`products/pdp/PdpGallery.tsx:123`) · Share Link tab uses 12px fields (iOS zoom-on-focus) and 36px copy buttons inside a modal documenting a 44px floor (`share/tabs/ShareLinkTab.tsx:68`).

### Explicitly refuted / verified-healthy — do not "fix" these

| Claim | Verdict |
|---|---|
| Supabase linter: `admin_unassign_passport` / `admin_search_profiles` callable by any authenticated user → privilege escalation | **False alarm.** Both bodies enforce an editor/admin role check. The warning describes only the `EXECUTE` grant. |
| Passport tokens enumerable | **Healthy.** `crypto.randomUUID()` = 122 bits; no anon SELECT on `product_passports`. |
| SSR projection is a TTFB bottleneck | **Healthy.** 15 kB, explicit column list, `id=eq.1` PK lookup. |
| Font subsetting bloat | **Healthy.** 189 KB across 15 files, but `unicode-range` gates download. |
| Admin shell remounts / flashes on every editor navigation | **Unfounded, twice over.** The shell is hoisted above `<Outlet/>`, and `F-14` (the residual full-screen-loader claim) was **retracted** after tracing the installed router source — the layout match is reused as `status: 'success'`, so its `pendingComponent` cannot render on an intra-admin navigation. |
| `cms_settings` publicly readable (its own table comment says "Public read") | **Healthy** — the comment is stale. Verified: no anon policy exists. |
| Admin **UI** in the storefront entry chunk | **Healthy.** Zero hits for `AdminShell`/`adminSidebar`/`adminNav`. (The *auth provider* leak is `F-06` — a different thing.) |
| Colour-token discipline is sloppy | **Healthy — measurably excellent.** Zero arbitrary hex Tailwind utilities across 638 tsx files; only 8 `bg-black`/`bg-white` literals. |
| Storefront and admin have accidentally forked into two design systems | **Deliberate and structurally enforced.** Admin composes the *same* primitives with `density="compact"`; one `themeConfigToCssVars` feeds SSR paint, theme preview, `--shop-*`, WebGL colours and the admin Studio palette. |
| React render storms / unstable refs / whole-store subscriptions | **Healthy.** None found; `useSyncExternalStore` snapshots reference-cached; cart uses atomic selectors; context values memoised. |

---

## 4. Prioritized Implementation Roadmap

Complexity: XS/S/M/L/XL. "Indep." = can land alone. "Agent" = worth a dedicated subagent.

### Phase 0 — Critical security & correctness (before any traffic)

| # | Task | IDs | Approach | Cx | Risk | Indep. | Agent |
|---|---|---|---|---|---|---|---|
| 0.1 | **Stop the fake-order path** *(decision: Shopify-only; `/checkout` is dev-only)* | F-01, F-21, F-09 | **Remove the fallback outright** — in both `catch` blocks surface the error and stay on the cart; never navigate to `/checkout`. Gate the `/checkout` route behind `import.meta.env.DEV` so a production buyer cannot reach `mockPaymentClient` by fallback *or* by URL. Make `createShopifyCheckout` throw on a *partial* variant resolve. | S | **low** | ✅ | |
| 0.2 | **Close the XSS→admin chain** | F-02, F-20, F-08 | (a) Stop inlining CMS SVGs — render via `<img src>` (the raster branch already exists), or adopt a real sanitizer. (b) Stop returning `refreshToken` to the browser — use supabase-js v2's `accessToken: async () => …` factory. (c) Constrain `snippetId` per provider by regex. | M | med | ✅ | ✅ |
| 0.3 | **Guard `passport_content`** | F-03, F-05 | Add `passport_content` (+ audit `support_content`, `legal_content`) to `WHOLE_MAP_COLUMNS`. Then make the list **typecheck-enforced exhaustive**, exactly as hydration coverage already is, so the *next* whole-map column cannot ship without a guard. Surface hydration failures. | S | low | ✅ | |
| 0.4 | **Backfill the 8 missing migrations** | F-04 | SELECT-only read of `supabase_migrations.schema_migrations`, write the 8 files verbatim, verify `db push` into a **scratch** project reproduces current RLS. Never run against production. | M | low | ✅ | ✅ |
| 0.5 | **Add rate limiting** | F-07 | Cloudflare's native Rate Limiting binding (zero dependency) in `wrangler.jsonc`, gating admin login + the CSP-report route. Turnstile on the waitlist insert, then revoke the anon INSERT policy. | M | med | ✅ | |

### Phase 1 — High-impact performance & UX

| # | Task | IDs | Approach | Cx | Risk | Indep. |
|---|---|---|---|---|---|---|
| 1.1 | **Re-encode heavy media** | F-24, F-23, F-25 | Highest value/effort ratio in the audit. Re-encode the five About backdrops to WebP ~1376×768 (**36.7 MB → single-digit MB**); run both GLBs through `gltf-transform` with texture compression (**10.8 MB → ~3 MB**); produce a real mobile hero encode + poster. Pure asset work — **no code change**. | M | **low** | ✅ |
| 1.2 | ~~Remove the admin edge from the storefront root~~ → **stop the entry statically importing `admin-cms-remote`** | F-06(b) | The admin edge is gone, all source paths to the SDK are lazy, and the entry is 12.7% smaller. What remains is one chunk-level edge: the entry pulls ~60 bindings from `admin-cms-remote`, and the SDK rides along. Identify those bindings and pin them elsewhere. **Not** a matcher tweak — `manualChunks` fires correctly; Rolldown merges on reachability. | M | med | ✅ |
| 1.3 | ~~Serve CMS images via Supabase transforms~~ **BLOCKED — do not attempt** | F-24 | Verified 2026-08-04: the Supabase org (`MOFF`) is on the **free plan**, and image transformation (`/render/image/…`) is a **Pro+ feature**. Switching `publicCmsMediaUrl()` would return errors for **every CMS image on the site**. The audit recommended this before the plan tier was checked. Real options, in order of cost: (a) re-encode the source assets to WebP and re-upload (a production Storage write — needs your go-ahead), (b) upgrade the Supabase plan, (c) put a Cloudflare Image Resizing worker in front. Until one of those, only the free wins apply — `width`/`height`/`loading`/`decoding` on CMS `<img>`s. | M | **high if attempted blind** | ✅ |
| 1.4 | **Fix the admin shell flash** | F-14, F-15 | Give the `/admin` layout a `pendingComponent` that renders the **shell** with a content-area spinner (not `min-h-screen`), and/or raise the layout's `pendingMs`. Raise `ADMIN_SESSION_CACHE_TTL_MS` toward the heartbeat interval. Parallelise the nine serial hydration round-trips. | M | med | ✅ |
| 1.5 | **Cache non-fingerprinted media** | perf | Add `public/_headers` stanzas for `/videos/*`, `/about/*`, `/brand/*`, `/page-backgrounds/*`, `/shop/*`, `/landing/*`. | XS | **low** | ✅ |
| 1.6 | **Fix the home entry gate** | perf | Handle `heroMediaMode` as the tri-state it is (production is `'products'`); stop preloading two unused videos; complete the gate on first frame rather than full load; cap the 12 s lock. | S | med | ✅ |
| 1.7 | **Restore sidebar preload** | cms | Re-enable `preload="intent"` now that the session cache makes hover-triggered `beforeLoad` cheap. | XS | low | ✅ |
| 1.8 | **Bridge SSR data into React Query** | F-33 | `@tanstack/react-router-ssr-query` is already a dependency and never imported. Wire it — or, smaller first step, seed the query with the loader value as `initialData` plus a short TTL memo on `fetchPublishedStorefrontProjection`. | S | med | ✅ |

### Phase 2 — Architecture & maintainability

| # | Task | IDs | Cx | Risk |
|---|---|---|---|---|
| 2.1 | Centralise `resolveCartVariantId()` — one helper, three call sites, unit-tested | F-10 | S | low |
| 2.2 | **Currency formatter** *(decision: Shopify per-price `currencyCode`)* — one `Intl.NumberFormat` helper fed by the code the Shopify mapper already returns; route all 7 hardcoded `$` sites through it | F-11 | M | low |
| 2.3 | Zod-validate + version the cart store per the project's own `createJsonStore` rule | F-22 | S | low |
| 2.4 | Make CMS publish atomic via one SECURITY DEFINER RPC | F-19 | M | **high** |
| 2.5 | Delete dead `CmsClient` / `SiteSettingsClient` + 6 adapters | cleanup | S | low |
| 2.6 | Correct `MAINT-02` in `CLAUDE.md` (13+ violations, not 1); resolve the `cms ↔ admin` cycle | arch | M | med |
| 2.7 | Skip the storefront projection fetch on `/admin` SSR | perf | S | low |
| 2.8 | Heartbeat must consult `useAdminDirtyRegistry` before re-hydrating | F-16 | S | med |
| 2.9 | Scope the admin error boundary so one editor cannot blank the shell | F-17 | S | low |

### Phase 3 — UI consistency & accessibility

`F-27` contrast (raise accent luminance or darken CTA text) · `F-28` Escape stack · `F-29` ~180 unlabelled controls (fix centrally in `FormField`) · `F-13` media-grid virtualizer columns · scroll-lock in `Modal`/`Drawer` · input border contrast · nested `<main>` + admin skip link · touch-target inversion in the nav · PDP gallery `pointer-events` · Share tab 16px inputs · `F-26` design a real mobile Oath experience · `F-31` shipping copy · `F-32` remove developer copy · PDP shipping/returns disclosures · z-index token scale · elevation tokens · micro-type scale · error state on the three input primitives.

### Phase 4 — Cleanup & optimisation

Test-suite speed (§9) · `vendor-*` manualChunks that emit nothing · `OathCursor` tween allocation · `SiteDustLayer` mount gate · `Book.tsx` listener cleanup · doc corrections · `docs/changelog.md` split · `assets/` 62 MB · stray root artifacts · orphaned CSS.

---

## 5. Quick Wins

Low risk, immediate value, each landable alone:

1. **`public/_headers` cache stanzas** (XS) — 18 MB of media currently uncached.
2. **Re-encode the five About PNGs to WebP** (S) — 36.7 MB → single-digit MB, zero code change.
3. **Restore `preload="intent"` on sidebar links** (XS) — every editor feels instant.
4. **`ALTER FUNCTION touch_row_updated_at() SET search_path = ''`** (XS) — clears a security advisor.
5. **Enable Supabase leaked-password protection** (XS) — dashboard toggle.
6. **Fix `get_product_reviews` `ORDER BY` before `LIMIT`** (XS) — currently invisible at 0 reviews.
7. **`/checkout` route guard** (XS) — closes the simplest path to a fake order.
8. **Gate the demo-credentials banner on `import.meta.env.DEV`** (XS).
9. **Four additive indexes** — `product_reviews.product_slug`, `armory_feats.user_id`, `passport_transfers.from_user`/`to_user`. Additive, zero behaviour change.

---

## 6. High-Risk Changes

Require staged rollout, backup, or explicit sign-off:

| Change | Why risky | Mitigation |
|---|---|---|
| **2.4** atomic publish RPC | Touches the one path every CMS save goes through | Land behind a flag; keep the current path as fallback; extend the existing (strong) `adminCmsRemoteSync` test suite *before* changing |
| **0.2b** stop returning `refreshToken` | Changes the admin auth handshake | Test login/refresh/heartbeat/logout across two tabs; signs out active sessions |
| **`__Host-` cookie prefix** | **Signs out every active admin** | Ship both cookies together; announce it |
| **0.4** migration backfill | Touching migration history is unforgiving | SELECT-only; verify in a **scratch project**, never production |
| **0.5** rate limiting | Can lock out legitimate admins | Start generous, log-only first, then enforce |
| **F-18** `accept_passport_transfer` | Live customer ownership data | Review DDL; test a transfer with a featured passport |
| **1.2** lazy admin root | Changes the entry graph; this repo has a documented history of a Rolldown "n is not a function" nested-dynamic-import bug | Verify a **production build** and real navigation, not just dev |

---

## 7. Testing Plan

The suite is **large, green, and genuinely well-crafted** (zero snapshots repo-wide, real behaviour assertions). The problem is **allocation, not craft**:

| Area | Test lines | Files |
|---|---|---|
| admin | 9,295 | 74 |
| passport | 6,381 | 42 |
| cms | 3,872 | 38 |
| TheOathLanding | 1,472 | 10 |
| **cart** | **0** | **0** |
| **checkout** | **0** | **0** |
| shopify | 251 | 1 |

**The money path has zero coverage — and tracing it is exactly what surfaced `F-01`.**

### Automated tests to add (smallest high-value set, in priority order)

1. `cart/__tests__/checkoutHandoff.test.tsx` — Shopify throws ⇒ **must not** reach the mock gateway.
2. `products/lib/__tests__/resolveCartVariantId.test.ts` — named colour, `Default`, `One Size`, miss.
3. `shopify/__tests__/shopifyCart.partial.test.ts` — partial variant resolve must not silently proceed.
4. `checkout/__tests__/checkoutPayments.config.test.ts` — ~30 lines, pure, no mocking.
5. `__tests__/cacheControl.test.ts` — export `cacheControlForResponse`; assert lookalikes `/administration`, `/accounts` are **not** `no-store`.

### Manual tests

- **Browser/device matrix:** 320 / 360 / 375 / 390 / 430 / 768 / 1024 / 1280 / 1440 / 1920; portrait + landscape; browser zoom 200%; short viewport heights.
- **Keyboard-only pass** over the admin (sidebar → editor → dialog → save) and the PDP → cart flow.
- **Network:** Slow 4G + cold cache on `/`, `/shop`, `/shop/$slug`, `/about`.
- **Network-tab check** for `admin-cms-remote-*.js` on a storefront route — resolves the one `unverified` sub-claim in `F-06`.

### Supabase / RLS validation

An RLS suite matters **least** here — the two riskiest RPCs are provably atomic on read of the SQL. Higher value: verify `db push` into a scratch project reproduces production `pg_policies` (this is `F-04`'s acceptance test).

### Regression strategy

`pnpm verify` (typecheck + test + build) after each phase; the 2,464-test baseline is the guard.

---

## 8. Performance Baseline

**Environment:** Windows 11; local `dist/` build dated 2026-08-04; Node ≥22.15; sizes via `stat` and `gzip -9`.
**Caveat:** these are **static artifact measurements, not runtime Lighthouse/RUM** — see §10.

| Artifact | Raw | Gzip |
|---|---|---|
| Entry `index-*.js` | 963.5 KB | **290.8 KB** |
| Always-loaded entry graph | 1,716.6 KB | **520.2 KB** |
| `vendor-three` | 971.0 KB | 261.2 KB |
| `admin-cms-remote` | 370.6 KB | 98.3 KB |
| `styles-*.css` | 320.2 KB | 41.7 KB |
| `vendor-react` | 175.1 KB | 54.4 KB |
| `vendor-gsap` | 141.0 KB | 54.1 KB |
| All fonts (15 woff2) | 189.4 KB | n/a (`unicode-range` gated) |
| `public/about/*.glb` | **10,995 KB** | — |
| `public/videos/WarriorHero1.mp4` | **6,808 KB** | — |
| Production `/about` CMS images | **36.7 MB** | — |
| Test suite | 606 s | — |

---

## 9. Cleanup Plan

> **Nothing was deleted during this review.** Each item lists how to prove it is unreferenced first.

### Dependencies

`CLAUDE.md` `PERF-11` claims a 2026-07-29 sweep found **no unused packages**. **That claim is now stale.** Every `dependencies` entry was grepped against `src/`:

| Package | Verdict |
|---|---|
| `@tanstack/react-router-ssr-query` | **Unused — zero references** in `src/`, `vite.config.ts`, `vitest.config.ts` or `.storybook/`. It is also exactly the fix for `F-33`: **wire it** (preferred) or remove it. |
| `@tanstack/router-plugin` | **No direct import.** `tanstackStart` comes from `@tanstack/react-start/plugin/vite`. Likely a transitive peer declared directly — verify before removing. |
| `@tailwindcss/vite`, `tailwindcss` | Used, but **build-time only, declared in `dependencies`** rather than `devDependencies`. Harmless; tidy if convenient. |
| `lenis` | **Used, correctly dynamic** — client-only, ≥768px, skipped under reduced motion. ✅ |
| `pdfjs-dist` | **Used, correctly lazy** — `typeof import('pdfjs-dist')` at `techpacks/parse/pdfExtract.ts:20`, the single boundary module. ✅ |
| Everything else (28 packages) | **In genuine use.** Heaviest legitimate: `three` (31 files), `@tanstack/react-router` (109), `zod` (48), `sonner` (55). |

No overlapping/duplicate libraries were found: `framer-motion` and `lucide-react` are **no longer** dependencies and were not reintroduced anywhere.

### Code, assets, docs

- `assets/` — **62 MB**, only 12 files tracked, **zero `src/` references**, absent from `dist/client/`. Confirm, then gitignore or remove.
- `docs/changelog.md` — **545 KB** single file; split by quarter.
- Dead contracts `CmsClient` + `SiteSettingsClient` and their six adapters (zero call sites).
- `vendor-supabase` / `vendor-tanstack` `manualChunks` rules that emit no chunk.
- ~28 orphaned CSS classes + 24 `[data-experience='theoath-modern']` selectors in the 320 KB stylesheet.
- Stray root artifacts: `.tmp-mobile.png`, `ds-bundle/`, `dist-ui/`, `.ds-sync/`, `.design-sync/` — confirm gitignore status.
- **Doc corrections:** `MAINT-02` ("exactly one violation" → 13+) · `MIG-01` (7 → 8, and re-classify as a security regression) · `docs/animation-guidelines.md:28` still prescribes **framer-motion, which is not a dependency** — this is exactly what `BANNED_DOC_TERMS` in `scripts/check-docs-freshness.mjs` exists to catch, so extend that list · `docs/design-system.md` documents five components and three tokens that no longer exist.
- **Test-suite speed** (606 s): 137 of 256 files need no DOM. Move them to the `node` environment via per-file docblocks or `environmentMatchGlobs`. **Do not** raise `maxWorkers` — the cap at 4 is a deliberate, documented Windows-stability decision.
- ~146 Tailwind-class assertions in six `TheOathLanding` test files violate the repo's own "do not test CSS class names" rule. Keep the genuinely behavioural ones (`mobileSectionVisibility`).

---

## 10. Open Questions and Assumptions

### Could not verify (no browser / dev server in this read-only pass)

- Real Lighthouse / Core Web Vitals (LCP, INP, CLS, TTFB) on any route.
- Whether `admin-cms-remote-*.js` is actually **fetched** on a storefront page load (`F-06` sub-claim). The source-level violation is confirmed; the runtime fetch is not.
- Whether the hidden desktop `<video preload="auto">` truly downloads on phones (`F-25`) — browser-dependent.
- Actual dropped frames on mid-range mobile; visual regression; real screen-reader behaviour.
- The `F-14` flash duration in practice (the arithmetic is compelling; the timing is inferred).

### Assumptions

- The inspected `dist/` build is representative of current source (dated the same day; source unchanged since).
- Production Shopify credentials are live (`VITE_SHOPIFY_*` are non-empty; `start.ts` names `anvl-2.myshopify.com`).
- `site_seo = {}` means analytics is genuinely unconfigured.

### Decisions taken during this review

1. **Checkout — Shopify only; `/checkout` is dev-only.** `F-01`'s fix is therefore the strong one: remove the silent fallback entirely and gate `/checkout` behind `import.meta.env.DEV`.
2. **Currency — use Shopify's per-price `currencyCode`** via one `Intl.NumberFormat` helper (`F-11`).

### Still open

- Is `site_seo = {}` intentional pre-launch, or did an analytics setup never get saved? **The live store currently has no tracking of any kind.**

---

## Appendix — Verification steps

- `pnpm test` → **2,464 passed / 256 files, exit 0** (the pre-change baseline).
- After each phase: `pnpm verify` (typecheck + test + build).
- **F-01:** with Shopify env set, force `startCheckout` to throw → must **not** reach `/checkout`; navigating to `/checkout` directly → must redirect.
- **F-03:** clear localStorage, open one passport editor, save → every other product's passport content must survive.
- **F-04:** `db push` into a scratch Supabase project → diff `pg_policies` against production.
- **F-06 / 1.2:** production build, load `/`, Network tab must show **no** `admin-cms-remote-*.js`.
- **1.1:** re-measure `du -sh` on the assets and re-run the §8 table.

---

## Appendix — Methodology

**14 specialist read-only reviewers** run in parallel (architecture, code quality, storefront UX, CMS workflow, bundle perf, React perf, animation, responsive, accessibility, Supabase, security, testing, dependencies, design system), each required to cite `file:line` evidence and to label confidence honestly.

**Coverage note, stated plainly:** 13 reviewers returned. The 14th (dependencies) was still running, so that analysis was performed directly instead — grepping every `package.json` runtime entry against `src/` (§9), which independently reproduced `F-33`. The workflow's 24-agent adversarial verification pass was then **stopped**, because every Critical and most High findings had already been re-verified from source by hand. This is a deliberate trade, recorded so the coverage claim is not overstated.

**Independently re-verified (not taken on reviewer trust):** the full cart → checkout → payment path and the mock gateway (`F-01`) · the SVG sanitizer and the refresh-token-in-localStorage half of the chain (`F-02`) · `WHOLE_MAP_COLUMNS` omitting `passport_content` (`F-03`) · 65 applied vs 63 on-disk migrations, the 8 missing by name, plus a duplicate application of `fix_publish_drop_body_column` (`F-04`) · **both WCAG contrast ratios recomputed by hand** — 3.698:1 and 2.612:1, matching exactly (`F-27`) · every bundle/gzip figure and asset size in §8 · the full test-suite baseline · and the *healthy* verdicts on passport token entropy, the 15 kB projection row and font `unicode-range` gating.

**A correction worth recording:** the initial bundle probe concluded the admin/storefront boundary held. **It did not** — the probe searched only for admin *UI* symbols, which the auth/theme providers do not contain. Two reviewers caught it; the violation was then verified in source (`F-06`). The corrected conclusion is what appears in §2.
