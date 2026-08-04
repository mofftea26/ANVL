# ANVL Phase J — Pre-Launch Security Hardening Plan

**Status:** Security headers/CSP (§3) and CSRF (§5) are **implemented** (2026-07-06) — see the "Implementation notes" callouts in each section. Rate limiting (§4) is **on hold** (2026-07-06, user's call) — the user is reconsidering whether Upstash is the right fit before committing to it, so this section's Upstash-specific design should be treated as one option, not a locked-in decision, when revisited later. Scoped separately from the rest of this audit per the user's explicit request, since these are cross-cutting features that needed a deployment-target decision first, unlike the rest of this audit's fixes (all code/schema-level and target-independent).

**Trigger:** Phase J of the original audit plan (`docs/technical-debt.md`) has tracked "CSP/HSTS, rate limits, upload validation, CSRF" as pre-launch blockers since 2026-07-04 (when admin auth itself was resolved). This document is the first concrete plan for closing them.

---

## 1. Current state (verified this session)

- **No deployment platform chosen.** No `vercel.json`, `netlify.toml`, `wrangler.toml`, or `Dockerfile` exist in the repo. `vite.config.ts`'s `tanstackStart()` plugin call has no preset override, so the build currently targets a generic Node server output. The `.gitignore` entries for `.wrangler`/`.vinxi`/`.nitro`/`.output` are just standard build-artifact directories from the underlying Vinxi/Nitro build system — not evidence of a chosen host.
- **No server middleware or response-header-setting code exists anywhere in the app.** This is a clean slate — nothing to migrate away from.
- **Admin auth (SEC-11)** is already solid: sealed HttpOnly session cookie, server-validated on every navigation, refresh-token rotation. This is the foundation the rest of Phase J builds on top of, not a replacement for it.
- **Upload validation** already has real work done this audit: client-side extension/size checks on both CMS upload paths (`MediaPickerField`'s `validateFile`, `MediaUploadZone`'s new `validateUploadFile`), server-side enforcement via the Supabase Storage bucket's `allowed_mime_types` allowlist + `file_size_limit`. This item is **effectively done** — see `anvl-storage-and-glb-audit.md`. Phase J's remaining scope is CSP/HSTS, rate limiting, and CSRF.

---

## 2. Recommended deployment target (for this plan's design decisions)

**Vercel**, with **Upstash Redis** for shared rate-limit state. Rationale:

- First-class TanStack Start support — no bespoke adapter work needed.
- Free tier covers pre-launch traffic entirely; Pro ($20/mo) is a predictable, low fixed cost once scaling starts — appropriate for a startup's cash flow.
- Global CDN benefits the WebGL/GSAP-heavy home route directly (static asset edge caching).
- Serverless execution model means **rate limiting must use shared external state, not in-memory** — Upstash's free tier (10k commands/day) is more than sufficient at this stage and integrates via Vercel's marketplace in minutes.

**If a different target gets chosen later:** the plan below is designed to degrade gracefully — the CSP/HSTS/CSRF pieces are pure application code (portable to any Node-capable host); only the rate-limit *store* (Upstash Redis client) would need swapping for a single-instance host (where an in-memory `Map` would actually be simpler and cheaper), or for Cloudflare Workers (where Workers KV or Durable Objects would replace Redis). Flagging this now so the rate-limit store is the one piece built behind an interface, not hardcoded to Upstash.

---

## 3. CSP (Content Security Policy) + security headers

**Approach:** set headers in TanStack Start's server entry / global middleware (application-level, not platform config) so the policy travels with the app regardless of eventual host — matches this repo's existing pattern of keeping deployment-target-specific concerns out of application code.

**Headers to add:**
- `Content-Security-Policy` — needs careful scoping given what's actually loaded:
  - `script-src`: self + whatever TanStack Start's own inline hydration script needs (likely a nonce-based or hash-based allowance — needs verification against how TanStack Start emits its hydration payload)
  - `connect-src`: self + the Supabase project URL (`https://cptebkgyrfmokklwtrgp.supabase.co`) + Shopify Storefront API domain (`https://anvl-2.myshopify.com`, confirmed live in this audit's Phase 2 network trace) + Shopify's CDN (`https://cdn.shopify.com`, also observed serving product images)
  - `img-src`: self + Supabase Storage (`https://cptebkgyrfmokklwtrgp.supabase.co`) + Shopify CDN
  - `frame-src` / `frame-ancestors`: likely `'none'` (no legitimate iframe embedding of this site expected)
  - `style-src`: needs verification — GSAP and some UI libraries may inject inline styles; may need `'unsafe-inline'` for styles specifically (lower risk than script) or a nonce strategy
- `Strict-Transport-Security` — `max-age=31536000; includeSubDomains` once on HTTPS (Vercel provides free automatic HTTPS, this header just tells browsers to always use it).
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` — cheap, no-risk additions.
- **Explicitly NOT recommending** an overly strict `script-src 'self'` without testing — GSAP, Three.js, and the TanStack Devtools panel (dev-only, already gated behind `import.meta.env.DEV` per existing rules) all need verification against a real CSP before shipping one, or the home page's cinematic experience could silently break. **First implementation step should be `Content-Security-Policy-Report-Only`** for a trial period to catch violations without breaking anything, then switch to enforcing once the report log is clean.

**Implementation notes (2026-07-06):** Implemented in `src/start.ts`, a global TanStack Start request middleware (`createStart({ requestMiddleware: [...] })`) that runs on every SSR page, server route, and server function response. Sets `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` (originally `DENY`; **relaxed to `SAMEORIGIN` when the admin live preview shipped** — its iframe is same-origin, and `DENY`/`frame-ancestors 'none'` blocked it entirely; third-party framing stays blocked), `Strict-Transport-Security`, and `Content-Security-Policy-Report-Only` (scoped to `'self'` + the confirmed-live Supabase and Shopify origins from this audit's own network traces). `script-src`/`style-src` currently include `'unsafe-inline'` as a starting point — tightening these to a nonce-based policy is future work once the report log (not yet wired to a collection endpoint) shows what's actually needed. Live-verified via `curl` that the headers appear on real responses across multiple routes (home, `/shop`, `/admin/login`) and that the page still renders correctly. `pnpm verify` green throughout.

---

## 4. Rate limiting

**Scope (per the original audit's finding):** `/admin` login endpoint (brute-force protection) and public forms (waitlist/contact — spam protection).

**Approach:** Upstash's `@upstash/ratelimit` package (sliding-window or token-bucket, both supported) wrapping the existing `loginAdminServerFn` and any public form submission server functions. Keyed by IP (from request headers) for public forms; keyed by IP + attempted email for admin login (prevents both a single IP hammering many accounts and distributed attempts against one account).

**Suggested limits (starting point, tune after launch traffic data exists):**
- Admin login: 5 attempts / 15 minutes per IP+email combination.
- Public forms (waitlist, contact): 10 submissions / hour per IP.

**Interface design:** wrap the rate-limit check behind a small internal function (e.g. `checkRateLimit(key, limit, window)`) so the Upstash-specific client is the only thing that would need swapping if the deployment target changes.

---

## 5. CSRF protection

**Current baseline (verified this audit):** TanStack Start server functions are invoked via a same-origin `/_serverFn/*` RPC route, which provides some inherent protection (cross-origin `fetch` to that route would need CORS to succeed, which isn't configured to allow arbitrary origins). This is *not* full CSRF protection on its own — it doesn't protect against a same-site attack or a misconfigured CORS policy introduced later.

**Recommended addition:** double-submit-cookie pattern — a `csrf_token` cookie (non-HttpOnly, so client JS can read it) set on session start, echoed back as a header on state-mutating server function calls, verified server-side that the header matches the cookie. This is a standard, framework-agnostic pattern that doesn't depend on the deployment target at all — can be implemented immediately, independent of the Vercel/Upstash decision above.

**Important scoping finding (2026-07-06):** the actual CSRF-relevant surface in this app is narrower than the generic framing above suggests. Traced every admin mutation: the CMS editors' own writes (`adminCmsRemoteSync`, media uploads, story CRUD, etc.) all go **directly from the browser to Supabase** using the admin's own Supabase client with a bearer-token `Authorization` header — not cookie-authenticated, so not forgeable cross-site the way an automatically-attached cookie is (a malicious page can't read another origin's in-memory/localStorage token or make the browser attach the right header). The **only** cookie-authenticated, TanStack-Start-server-function-based endpoints in the whole app are `loginAdminServerFn` and `logoutAdminServerFn` in `adminAuth.ts`. Also worth noting: the session cookie already sets `sameSite: 'lax'` (`adminAuthSession.server.ts`), which already blocks the classic auto-submitting-form CSRF attack on its own — the double-submit token below is defense-in-depth on top of that, not the sole protection layer.

**Implementation notes (2026-07-06):** Implemented via `src/features/admin/auth/adminCsrf.ts` — a TanStack Start **function middleware** (`createMiddleware({ type: 'function' })`, distinct from the request middleware used for headers above) with a `.client()` phase that reads the CSRF cookie via `document.cookie` and echoes it as an `X-Anvl-Csrf-Token` header, and a `.server()` phase that compares it against the cookie (read via `getRequestHeader('cookie')`) and throws if they don't match. The cookie itself is issued by `src/start.ts`'s request middleware (plain random token via `crypto.randomUUID()`, not sealed/signed — it only needs to prove same-origin cookie access, not carry a sensitive payload). Attached to `loginAdminServerFn` and `logoutAdminServerFn` via `.middleware([csrfProtectionMiddleware])`.
- **Verified:** live `curl` confirms the cookie is correctly issued (`Set-Cookie: anvl_admin_csrf=...; Path=/; SameSite=Lax`) on every response. The core double-submit comparison logic (`verifyCsrfTokens` — missing cookie / missing header / mismatched tokens / matching tokens / empty-string header) has 10 passing unit tests in `adminCsrf.test.ts`.
- **Not verified:** a full browser-driven login round-trip through the actual `/_serverFn/*` RPC wire format (blocked by a port conflict with another session's dev server this session, and no admin credentials available — consistent with this audit's other admin-UI limitations). The client-side header-echo pattern is copied directly from TanStack Start's own documented example for this exact use case, and the server-side logic is unit-tested in isolation, but recommend a manual login-attempt smoke test as a follow-up before considering this fully closed out.

---

## 6. Suggested implementation order

1. ~~CSRF (double-submit cookie)~~ — **Done** (2026-07-06), see §5.
2. ~~Security headers except CSP~~ — **Done** (2026-07-06), see §3.
3. ~~CSP in `Report-Only` mode~~ — **Done** (2026-07-06), see §3. Not yet switched to enforcing — needs a trial period first.
4. Rate limiting — needs the Upstash account/integration set up first (or confirmation that Vercel is indeed the chosen host). **Still open.**
5. Switch CSP from `Report-Only` to enforcing, once the report log is clean. **Still open** — the report-collection endpoint now exists (`src/routes/api/csp-report.ts`, wired via `report-uri`, live-verified 2026-07-06) and logs to the server console. **First real data point already captured (2026-07-06):** loaded `/` and `/about` in a live dev browser and the pipeline immediately caught a real, reproducible `script-src` violation — `blocked-uri: "eval"` from exactly 2 call sites (lines 247 and 1585) in `node_modules/.vite/deps/core-*.js`. That path is Vite's dev-time esbuild pre-bundle cache (not the production Rollup output), and this pattern (an `eval`/`Function`-based CJS↔ESM interop shim, or an environment-detection idiom some libraries use) is a well-known category of thing esbuild's pre-bundler introduces that doesn't necessarily appear in the real production build. **Before ever enforcing:** re-run this same check against `pnpm build && pnpm preview` (the actual production bundle) to confirm whether this violation is dev-only noise or a real production concern requiring `'unsafe-eval'` in `script-src`. Not yet done this session — flagging as the concrete next step rather than guessing.

## 7. Open questions for the user before implementation starts

- Confirm Vercel is acceptable, or flag a different preference now before any Upstash-specific code is written.
- Whether the waitlist/contact forms currently exist and are reachable (verify in a follow-up storefront pass — this audit didn't specifically test them) before finalizing the public-forms rate-limit scope.
