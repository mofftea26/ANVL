# ANVL Performance Audit

**Audit phase:** 8 (Performance & memory profiling), cross-referencing Phase 9's live GSAP/Three.js repeat-navigation test.
**Method:** `ANVL_ANALYZE=1 pnpm build` (real bundle output, not estimated), live browser memory/canvas-count checks via preview tooling on the About page (WebGL-heaviest route), code-level review of lazy-loading/gating already confirmed compliant in earlier phases.

---

## 1. Bundle size — measured, current numbers

| Chunk | Raw | Gzip | Loaded on |
|---|---|---|---|
| `index-*.js` (main entry) | 902.02 kB | **274.33 kB** | **Every route** |
| `vendor-three-*.js` | 994.29 kB | 271.60 kB | Only WebGL-gated routes (home, about, story) — lazy |
| `vendor-react-*.js` | 182.38 kB | 57.36 kB | Every route (baseline React 19 + ReactDOM cost) |
| `vendor-gsap-*.js` | 144.38 kB | 56.00 kB | Lazy, only where GSAP is used |
| `vendor-framer-motion-*.js` | 128.40 kB | 41.86 kB | Lazy |
| `vendor-lenis-*.js` | 17.67 kB | 5.06 kB | Lazy, ≥768px only |
| `vendor-zod-*.js` | 0.35 kB | 0.19 kB | (Most of Zod ends up inlined per-route rather than in this near-empty shared chunk) |
| `TheOathLanding-*.js` | 49.23 kB | ~16 kB (est.) | Home route only |

**Key finding:** the main `index` entry chunk is **274 kB gzipped, shipped on every single route** — this is the number that matters most for first-load performance, since unlike `vendor-three`/`vendor-gsap`/`vendor-framer-motion` (all confirmed lazy/code-split), this chunk is not optional. `docs/technical-debt.md` already flags "the main client entry chunk can exceed 500 kB minified" as known debt (PERF-11 area) — this audit **confirms and quantifies** that with an exact current number (902 kB raw / 274 kB gzip) rather than the previous approximate description.

**MAINT-02 fixed, measured impact was small:** after extracting the CMS media facade (moving `MediaIndexEntry`, `publicCmsMediaUrl`, and `MediaPickerField` out of/off of the storefront-reachable boundary — see `anvl-remediation-roadmap.md`), the main chunk dropped from 902.02 kB → 890.95 kB raw (274.33 → 271.20 kB gzip). Real, but a ~1% reduction — MAINT-02 was the right architectural fix regardless, but it was not the dominant contributor to the chunk's size.

**Bundle-analyzer tooling gap found and partially fixed, full decomposition still open:** `dist/stats.html` used a single shared filename for both of TanStack Start's build passes, so one pass always silently overwrote the other's report — this is why the treemap read attempted in this session came back empty/misleading. Fixed the filename collision in `vite.config.ts` (now `dist/stats-client.html` / `dist/stats-server.html`, keyed on Vite's `isSsrBuild`), but discovered a deeper issue in the process: **only one of the two files is actually produced, and its contents describe the server chunk graph, not the client one** — TanStack Start's internal build orchestration doesn't appear to route its client-targeted Vite pass through the top-level plugin list the way a plain Vite app would, so `rollup-plugin-visualizer` never sees it. Getting a real client-bundle treemap will need a different approach (e.g. invoking Vite's client build directly, bypassing the Start wrapper, or checking whether TanStack Start exposes its own bundle-analysis hook) — left as an open item rather than solved blind. The comment in `vite.config.ts` documents this so the next person doesn't lose time rediscovering it.

**Until that's resolved, likely candidates for the main chunk's size** (reasoned from what's confirmed NOT separately vendor-chunked, per `vite.config.ts`'s `manualChunks`): `@supabase/supabase-js`, `react-hook-form` + `@hookform/resolvers`, `@radix-ui/react-select`/`react-popover`, and baseline TanStack Router/Query runtime not captured by the `vendor-tanstack` bucket (the `router-*.js` (75.5 kB gzip 20.4 kB) and `runtime-*.js` (53.6 kB gzip 15 kB) chunks seen in the build output are plausibly where most of this actually lives, separate from the always-loaded `index` chunk — this also wasn't conclusively separated from `index` in this pass).

**Follow-up attempt (2026-07-06): the treemap dead end reproduced identically, but direct byte-level inspection of the real client chunk gave concrete, evidence-based answers to the speculation above** — regenerated `dist/stats-client.html` fresh and parsed its embedded JSON data directly (not just eyeballing the visualization): confirmed again the root node is `server.js` — this is genuinely, reproducibly the server chunk graph mislabeled by filename, not a one-off. Rather than sink more time into forcing the analyzer, grepped the real `dist/client/assets/index-*.js` (893,699 bytes) for distinctive class/identifier names each candidate library would leave even after minification:

| Candidate | Evidence found | Verdict |
|---|---|---|
| `react-hook-form` | 0 occurrences of `react-hook-form`, `@radix-ui`, `react-select`, `react-popover` anywhere in the chunk | **Ruled out** — these are route-code-split into their own per-editor/form chunks, not in the always-loaded main chunk. The Phase 8 speculation above was wrong on this point. |
| `@supabase/supabase-js` | `SupabaseClient` (1), `GoTrueClient` (1), `RealtimeClient` (3) present; `PostgrestClient`, `PostgrestQueryBuilder`, `SupabaseStorageClient`, `FunctionsClient` all **0** occurrences | **Partially confirmed** — the core auth/client machinery is bundled, but the Postgrest/Storage/Functions sub-clients aren't detectable by their class names, suggesting real tree-shaking is happening, not a blind full-package include. |
| `zod` | 345 occurrences of the string `zod`; the `ZodError` identifier specifically spans a contiguous ~51 kB region (208,628–259,427 byte offset) of the 893 kB file | **Confirmed real contributor** — schema validation code (mandated by `CLAUDE.md` for all external/CMS data) is a measurable, non-trivial chunk of the main bundle, more concretely than any other single candidate checked. |
| `sonner` | 126 occurrences | Present, but toast UI code is inherently small — not a major contributor on its own. |
| GSAP / Three.js / Lenis (sanity check — these should NOT be here) | `THREE.WebGLRenderer`, `gsap.timeline`, `ScrollTrigger`: **0** occurrences each; `Lenis`: 1 (just an import specifier for the already-lazy dynamic import) | **Confirms vendor chunking is genuinely working** — no heavy animation/3D libraries are leaking into the always-loaded chunk. |

**RESOLVED (2026-07-12) — supabase-js was a removable villain after all.** The "Supabase core auth client is just part of the long tail" conclusion below was too pessimistic. Root-caused the eager pull to a *single* static import: `app/config/runtime.ts` imported `supabaseAccountClient`, whose module graph (`storefrontSupabaseClient` → `createAnvlSupabaseClient` → `@supabase/supabase-js`) dragged GoTrue + RealtimeClient into `runtimeClients` — a top-level singleton imported by `__root.tsx`, i.e. every route. Every *other* supabase-js consumer (`/auth/*` routes, account panels) is already code-split. Fix: `lazySupabaseAccountClient` (dynamic-imports the real client on first method call) + a `vendor-supabase` `manualChunks` bucket. **Measured: client `index` 930.22 kB → 733.39 kB raw, 283.26 kB → 233.27 kB gzip — a real −50 kB gzip on every page load**, with supabase-js relocated to a `vendor-supabase` chunk (196.73 kB / 50.18 kB gzip) that only loads on auth/account routes. `pnpm verify` green (686 tests). Remaining entry weight is now genuinely the Zod-schema + TanStack-runtime long tail described next.

**Conclusion (pre-fix):** the main chunk's size is very likely a "long tail" of many small-to-medium modules (Zod schemas spread across every feature, TanStack Router/Query core runtime, Supabase's core auth client, shared UI primitives, CMS adapter code) rather than one dominant, easily-removable villain — which is a common, unglamorous but real finding for an app with this many features sharing one entry point. Getting exact per-module byte attribution still requires either a custom Rollup plugin intercepting the client-targeted pass before TanStack Start's wrapper consumes it, or checking whether a newer TanStack Start release exposes its own bundle-analysis hook — both are larger investments than fit this pass, so this is documented as the practical stopping point rather than solved blind.

---

## 2. Performance budget (proposed, for the remediation roadmap — not yet enforced anywhere in CI)

| Route | Current gzip (main + route chunk, excl. lazy vendor) | Proposed budget |
|---|---|---|
| Home (`/`) | 274 kB (index) + ~16 kB (TheOathLanding) + lazy `vendor-three`/`vendor-gsap` on scroll | ≤ 320 kB core-path JS |
| Shop listing (`/shop`) | 274 kB (index) + 36.7 kB → ~11 kB gzip (shop chunk, est.) | ≤ 300 kB |
| PDP (`/shop/$slug`) | 274 kB (index) + ~11 kB gzip (`_slug` chunk, est.) | ≤ 300 kB |
| Account (`/account`) | 274 kB (index) + small account chunk | ≤ 290 kB |
| Admin dashboard | Admin bundle is fully separate from storefront (lazy-loaded per-route) — not measured in this pass since it doesn't affect customer-facing performance | Track separately |

These budgets are proposed based on the *current* main-chunk size as the floor (since it can't be avoided without splitting it further) — the real target should be **reducing the 274 kB floor itself** via the MAINT-02 boundary cleanup already tracked, not just budgeting around it.

---

## 3. Memory / repeat-navigation test (live, Phase 9 cross-reference)

Performed 16 consecutive client-side SPA navigation cycles between `/shop` and `/about` (the WebGL-heaviest storefront route) in a live preview browser:

- **Canvas/WebGL context count stayed at exactly 1 throughout** — no accumulation of orphaned `<canvas>` elements or duplicate WebGL contexts, confirming the Three.js scene is correctly disposed on route-away and recreated on route-back (matches the code-level finding from the earlier GSAP/Three.js pass: `DustField`, `AltarAnvil`, and the Oath scene all have disposal logic).
- Console logged `THREE.WebGLRenderer: Context Lost.` on each navigation away — this is the **expected, correct** message when a WebGL context is properly torn down (not an error).
- `performance.memory.usedJSHeapSize` grew from ~67 MB to ~90 MB over 16 cycles — this reading alone is **not conclusive** of a leak (V8's heap-used metric reflects garbage not yet collected, not "still reachable" memory; the browser session used for this test was itself backgrounded/hidden — see below — which further throttles GC timing). The canvas-count-stable result is the more reliable signal and shows no leak in the WebGL layer specifically.
- **Zero console errors** across all 16 cycles.

**Caveat on this test environment:** the preview browser session was confirmed (`document.hidden === true`, `visibilityState === 'hidden'`) to be a backgrounded/inactive tab throughout this audit (this also explains a real bug found and fixed in Phase 2 — see `FUNC-01` in the changelog, where `requestAnimationFrame`-gated logic never fired). A true heap-snapshot-diff memory audit (Chrome DevTools Memory panel, three-snapshot technique) requires a real, focused, visible browser tab and wasn't performable through the available automated tooling — **recommend as a manual QA task** for someone with a real browser: repeat the same 16-cycle navigation test while capturing heap snapshots before/after, and diff for detached DOM nodes.

---

## 4. Gating / lazy-loading (verified compliant, re-confirmed this phase)

- All admin routes: `lazyRouteComponent` — confirmed (Phase 1/architecture pass), no drift.
- `vendor-gsap`, `vendor-lenis`, `vendor-framer-motion`, `vendor-three` are genuinely separate, lazy chunks — confirmed by direct build output in this phase (they are not present in the always-loaded `index` chunk's size; each has its own file).
- The Oath cinematic (GSAP + WebGL) is gated to `≥1280px` + no-reduced-motion via `oathBreakpoints.ts`'s `OATH_DESKTOP_CINEMATIC_MQ` — code-level confirmed in earlier phases, not re-verified live this session (would require a real, focused browser + `prefers-reduced-motion` emulation, which the backgrounded-tab constraint above also affects).
- Lenis gates at `≥768px` + no reduced motion, independent of the Oath's 1280px cinematic gate — code-level confirmed, matches `CLAUDE.md`.

---

## 5. Not measured in this pass (requires tooling this session didn't have)

- **Lighthouse/Core Web Vitals** (LCP, INP, CLS) — no Lighthouse CLI or CI integration exists in this repo (`package.json` has no such script), and the preview browser tooling available doesn't expose Lighthouse's audit APIs. Recommend adding `lighthouse-ci` or a manual periodic Lighthouse pass as a Phase 11/13 follow-up if Core Web Vitals tracking is desired pre-launch.
- **Edge Function cold starts** (`shopify-webhook`) — not measured; would require production traffic or synthetic load testing against the live Supabase project, which wasn't in scope for a read-mostly audit session.
- **Database query latency under load** — `anvl-database-audit.md` covers schema/index correctness; actual query timing under realistic concurrent load wasn't tested (current data volumes are too small — 1-19 rows per table — to produce meaningful timing data).
- **Font loading / CLS from web fonts** — `@fontsource/anton`, `@fontsource/sora`, `@fontsource/cinzel` are self-hosted (not Google Fonts CDN, avoiding a common CLS/privacy issue), and `docs/audit-2026-05-17.md`'s Phase G already covered font preload — not re-verified live this session.
