# Technical Debt

Track known compromises here.

## Audit program (2026-05-17) — closed batch; open follow-ups

The **execution batch** for the full-app audit is **closed** (Phases A–C, G–H + storage migration + lazy admin). See **`docs/audit-2026-05-17.md`** for the canonical finding IDs, phase table, and what remains **deferred**:

- **Phase D** — Move CMS read surfaces out of `features/admin/**` into `features/cms/**` / `features/drops/**` so the storefront bundle does not depend on admin modules.
- **Phase E** — Split oversized editor files (600+ lines) for maintainability.
- **Phase F** — DX / reuse passes (helpers, tokens, query keys, dead deps).
- **Phase I** — Route codegen ergonomics (`scripts/repatch-admin-route-tree.mjs` vs upstream TanStack Start fixes).
- **Phase J** — **Production launch blockers:** real server auth, HttpOnly sessions, CSP/HSTS, rate limits, upload validation, CSRF — must be satisfied before a public launch even though the client-side audit batch is closed.

## Current expected temporary compromises
- Frontend-only local/mock CMS until backend exists.
- Temporary static admin login is not production security. Credentials are read from `VITE_ANVL_ADMIN_USERNAME` / `VITE_ANVL_ADMIN_PASSWORD` at build time (still bundled client-side — dev/demo only).
- **Hardening backlog:** CSP headers, server rate limiting on auth and forms, upload validation at the edge, HttpOnly session cookies, and real admin sessions must land before public launch.
- Currency conversion may start as static rates until backend/server cache exists.
- Scheduled activation may be simulated client/server-side until background jobs exist.
- Media library may start as URL/manual asset picker until real storage exists.
- **Bundle size:** the main client entry chunk can exceed 500 kB minified; `pnpm analyze` plus `vendor-gsap` / `vendor-lenis` / `vendor-framer-motion` splits are in place, with further route-level splitting planned (see Prompt 18 performance pass).
