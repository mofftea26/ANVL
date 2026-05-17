# Technical Debt

Track known compromises here.

## Current expected temporary compromises
- Frontend-only local/mock CMS until backend exists.
- Temporary static admin login is not production security. Credentials are read from `VITE_ANVL_ADMIN_USERNAME` / `VITE_ANVL_ADMIN_PASSWORD` at build time (still bundled client-side — dev/demo only).
- **Hardening backlog:** CSP headers, server rate limiting on auth and forms, upload validation at the edge, HttpOnly session cookies, and real admin sessions must land before public launch.
- Currency conversion may start as static rates until backend/server cache exists.
- Scheduled activation may be simulated client/server-side until background jobs exist.
- Media library may start as URL/manual asset picker until real storage exists.
- **Bundle size:** the main client entry chunk can exceed 500 kB minified; `pnpm analyze` plus `vendor-gsap` / `vendor-lenis` / `vendor-framer-motion` splits are in place, with further route-level splitting planned (see Prompt 18 performance pass).

## 2026-05-17 audit cross-reference

A full read-only audit (security, performance / bundle, reusability,
responsiveness / a11y / smoothness, SOLID / scalability / maintainability) lives
in `docs/audit-2026-05-17.md` with a prioritized **Phase A–J task list**. Every
audit finding has an ID (e.g. `SEC-04`, `PERF-02`, `MAINT-01`); reference them
in commits and PRs.

### Hosted-demo blockers (do not deploy publicly until fixed)

These items expand on the bullets above with explicit "do not deploy" wording:

- **SEC-01 — Admin "session" is forgeable client JSON.** `readAdminSession()`
  (`src/features/admin/auth/adminAuth.storage.ts`) only checks string fields;
  anyone who can write `localStorage` becomes admin. **Block any hosted
  admin until real server auth lands.**
- **SEC-02 — Admin password bundled into client JS** via `VITE_ANVL_ADMIN_*`.
  Recoverable from the production bundle / source map.
- **SEC-03 — `/admin` is gated only on the client.** No `beforeLoad`, no
  server middleware; combined with SEC-01/02 the admin shell renders for
  anyone who hits the route.
- **SEC-11 — Storefront account session is a `sessionStorage` customer id
  pointer.** Trivial to spoof in the demo. Replace with HttpOnly cookies +
  server session before any real customers.

Other launch-blockers (CSP, rate limits, server-side cart, upload validation,
CSRF) are tracked in Phase J of the audit.
