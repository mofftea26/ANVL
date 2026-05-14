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
