# Technical Debt

Track known compromises here.

## Audit program (2026-05-17) — closed batch; open follow-ups

The **execution batch** for the full-app audit is **closed** (Phases A–C, G–H + storage migration + lazy admin). See **`docs/audit-2026-05-17.md`** for the canonical finding IDs, phase table, and what remains **deferred**:

- **Phase D** — Extract shared types/helpers out of `features/admin/**` into `features/cms/**` / `shared/**` (MAINT-02).
- **Phase E** — Split oversized editor files (600+ lines) for maintainability.
- **Phase F** — DX / reuse passes (helpers, tokens, query keys, dead deps).
- **Phase I** — Route codegen ergonomics (`scripts/repatch-admin-route-tree.mjs` vs upstream TanStack Start fixes).
- **Phase J** — **Production launch blockers:** real server auth, HttpOnly sessions, CSP/HSTS, rate limits, upload validation, CSRF — must be satisfied before a public launch even though the client-side audit batch is closed.

## Documentation / schema debt (2026-06-22)

| ID | Area | Description |
|---|---|---|
| **MIG-01** | Supabase migrations | Migrations `20260620130000`, `20260624120000`, `20260625120000` reintroduce `cms_publish_drop` / pg_cron referencing dropped `anvl_drops`. Fresh `db push` may fail or leave stale RPCs. App uses direct `adminCmsRemoteSync` instead. |
| **MAINT-02** | Feature boundary | Storefront-safe code imports from `admin/**` (`publicCmsMediaUrl`, `MediaIndexEntry` type, `CmsProfileRole`). |
| **MAINT-03** | localStorage reset | `resetAllLocalCmsKeys()` omits `anvl.landingContent.v1` (registered in `storageKeys.ts` incompletely). |

## Current expected temporary compromises
- Frontend-only local/mock CMS until backend exists.
- Temporary static admin login is not production security. Credentials are read from `VITE_ANVL_ADMIN_USERNAME` / `VITE_ANVL_ADMIN_PASSWORD` at build time (still bundled client-side — dev/demo only).
- **Hardening backlog:** CSP headers, server rate limiting on auth and forms, upload validation at the edge, HttpOnly session cookies, and real admin sessions must land before public launch.
- Currency conversion may start as static rates until backend/server cache exists.
- Scheduled activation may be simulated client/server-side until background jobs exist.
- Media library may start as URL/manual asset picker until real storage exists.
- **Bundle size:** the main client entry chunk can exceed 500 kB minified; `pnpm analyze` plus `vendor-gsap` / `vendor-lenis` / `vendor-framer-motion` splits are in place, with further route-level splitting planned (see Prompt 18 performance pass).
