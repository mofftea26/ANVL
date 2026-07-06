# Technical Debt

Track known compromises here.

## Audit program (2026-05-17) — closed batch; open follow-ups

The **execution batch** for the full-app audit is **closed** (Phases A–C, G–H + storage migration + lazy admin). See **`docs/audit-2026-05-17.md`** for the canonical finding IDs, phase table, and what remains **deferred**:

- **Phase D** — Extract shared types/helpers out of `features/admin/**` into `features/cms/**` / `shared/**` (MAINT-02). **Resolved 2026-07-05** — see below.
- **Phase E** — Split oversized editor files (600+ lines) for maintainability.
- **Phase F** — DX / reuse passes (helpers, tokens, query keys, dead deps).
- **Phase I** — Route codegen ergonomics (`scripts/repatch-admin-route-tree.mjs` vs upstream TanStack Start fixes).
- **Phase J** — **Production launch blockers:** admin real server auth + HttpOnly sessions **done (2026-07-04)** — see below. Remaining: CSP/HSTS, rate limits, upload validation, CSRF — must be satisfied before a public launch even though the client-side audit batch is closed.

## Documentation / schema debt (2026-06-22)

| ID | Area | Description |
|---|---|---|
| **MIG-01** | Supabase migrations | Migrations `20260620130000`, `20260624120000`, `20260625120000` reintroduce `cms_publish_drop` / pg_cron referencing dropped `anvl_drops`. Fresh `db push` may fail or leave stale RPCs. App uses direct `adminCmsRemoteSync` instead. |
| **MAINT-02** | Feature boundary | **Resolved 2026-07-05** — was larger than documented (9 files importing `MediaIndexEntry`, 2 importing `publicCmsMediaUrl`, plus `MediaPickerField` itself mislocated in `shared/`). `MediaIndexEntry`/`publicCmsMediaUrl` now live in `features/cms/media/`; `MediaPickerField` moved to `features/admin/components/`. Zero remaining `features/admin/**` imports from `shared/**` or `features/products/**` (verified via grep). |
| **MAINT-03** | localStorage reset | `resetAllLocalCmsKeys()` omits `anvl.landingContent.v1` (registered in `storageKeys.ts` incompletely). |

## Full-platform audit follow-ups (2026-07-05) — open items carried forward

Phase 0 quick fixes (GLB-01/02, SEC-21, SEC-22, MAINT-30, CLEAN-01) and a same-day remediation round (PERF-20, PERF-21, MAINT-02, REU-14, unsaved-changes warning, `useSingletonCmsEditor` hook, CLEAN-02, SEC-24, SEC-25) are resolved — see `docs/changelog.md` and `docs/audits/anvl-remediation-roadmap.md`. Still open, lower priority:

| ID | Area | Description |
|---|---|---|
| **SEC-23** | Supabase Auth | Leaked-password protection (HaveIBeenPwned check) disabled. Attempted 2026-07-06: no MCP tool covers Auth config (it's a Management API setting, not SQL); the Supabase CLI's only relevant command (`supabase config push`) pushes an entire local `config.toml` to the remote project, but this repo has no `config.toml` at all — creating a minimal one just for this toggle risks silently resetting other unrelated Auth settings to defaults. Left as a manual 2-click dashboard toggle rather than risking a broad config push. |
| — | CMS media / cleanup | ~~Deleting `MediaPickerField` (CLEAN-02) revealed its entire backing upload module was also unreachable~~ — **Resolved 2026-07-06**: `uploadCmsMediaFile`, `deleteCmsMediaByPublicUrl`, `formatCmsDropMediaObjectPath`, and the dead `mediaAssets.service.ts` wrappers around them all deleted (user-approved). `MAINT-31` is moot now that this path is gone entirely. |
| — | Main bundle | Main client entry chunk is 271.20 kB gzip. Bundle-analyzer treemap tooling gap **confirmed unfixable within this session's scope** (reproduced the same dead end on a fresh attempt 2026-07-06 — root node is still `server.js`) — direct byte-level inspection of the real client chunk instead ruled out `react-hook-form`/`@radix-ui` as contributors and confirmed Zod as a real one (~51 kB contiguous region); see `docs/audits/anvl-performance-audit.md` for the full evidence table. Exact per-module attribution still needs a custom Rollup plugin or a newer TanStack Start bundle-analysis hook. |
| — | CMS admin | ~~Theoretical last-write-wins race if two admin tabs edit the same singleton row concurrently~~ — **Resolved 2026-07-06**: `adminCmsRemoteSync.ts` now scopes every save to only the specific column that editor changed (`CmsSettingsFieldKey`), instead of blindly rewriting all 7 columns from a possibly-stale local snapshot. |
| — | Phase J | **Security headers, CSP (report-only), and CSRF implemented 2026-07-06** — see `docs/changelog.md` and `docs/audits/anvl-phase-j-security-plan.md`. Still open: rate limiting (blocked on an Upstash account or a confirmed deployment target — recommended Vercel + Upstash Redis), switching CSP from report-only to enforcing (needs a trial period / report-collection endpoint first), and a full browser-driven login smoke test of the new CSRF check. |

## Current expected temporary compromises
- Frontend-only local/mock CMS until backend exists.
- ~~Temporary static admin login~~ **Resolved 2026-07-04** — admin auth is now Supabase-only, server-validated via a sealed HttpOnly session cookie (`src/features/admin/auth/adminAuth.ts` + `adminAuthSession.server.ts`), with a real Remember Me option. See `CLAUDE.md` SEC-01/02/03/SEC-11 and `docs/changelog.md` (2026-07-04).
- **Hardening backlog:** CSP headers, server rate limiting on auth and forms, upload validation at the edge, and CSRF tokens must land before public launch.
- Currency conversion may start as static rates until backend/server cache exists.
- Scheduled activation may be simulated client/server-side until background jobs exist.
- Media library may start as URL/manual asset picker until real storage exists.
- **Bundle size:** the main client entry chunk measured 890.95 kB raw / 271.20 kB gzip as of 2026-07-05 (down slightly from 902.02 kB / 274.33 kB pre-MAINT-02); `pnpm analyze` plus `vendor-gsap` / `vendor-lenis` / `vendor-framer-motion` / `vendor-three` splits are in place and confirmed lazy, but the dominant contributor to the main chunk itself hasn't been isolated yet — see the bundle-analyzer tooling gap noted above.
