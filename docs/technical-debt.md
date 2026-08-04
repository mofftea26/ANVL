# Technical Debt

Track known compromises here.

## Audit program (2026-05-17) — closed batch; open follow-ups

The **execution batch** for the full-app audit is **closed** (Phases A–C, G–H + storage migration + lazy admin). See **`docs/audit-2026-05-17.md`** for the canonical finding IDs, phase table, and what remains **deferred**:

- **Phase D** — Extract shared types/helpers out of `features/admin/**` into `features/cms/**` / `shared/**` (MAINT-02). **Mostly resolved 2026-07-05; one violation remains** — see MAINT-02 below.
- **Phase E** — Split oversized editor files (600+ lines) for maintainability.
- **Phase F** — DX / reuse passes (helpers, tokens, query keys, dead deps).
- **Phase I** — Route codegen ergonomics (`scripts/repatch-admin-route-tree.mjs` vs upstream TanStack Start fixes).
- **Phase J** — **Production launch blockers:** admin real server auth + HttpOnly sessions **done (2026-07-04)**; security headers, HSTS, report-only CSP and the CSRF double-submit cookie **done (2026-07-06)**. Remaining: flip CSP to enforcing, rate limits, upload validation, DNS cutover. `CLAUDE.md`'s Phase J row is the single source of truth for this status — do not restate it elsewhere.

## Documentation / schema debt (2026-06-22)

| ID | Area | Description |
|---|---|---|
| **MIG-01** | Supabase migrations | **Re-scoped 2026-07-29 after a live three-way diff — larger than first recorded.** (a) Migrations `20260620130000`, `20260624120000`, `20260625120000` reintroduce `cms_publish_drop` / pg_cron referencing dropped `anvl_drops`. (b) **7 migrations are applied in production with no file on disk**: `tighten_cms_settings_rls_and_revoke_rls_auto_enable_grant`, `revoke_public_execute_on_rls_auto_enable`, `perf20_wrap_auth_uid_in_rls_policies`, `perf21_add_missing_fk_covering_indexes`, `sec24_move_pg_net_out_of_public_schema`, `sec25_remove_public_storage_listing_policies`, `site_seo_column`. (c) 7 files on disk never appear in the applied history. Net effect: a fresh `supabase db push` into an empty project would **not** reproduce production RLS/schema state. Fix = backfill the missing SQL as files before rebuilding any environment. |
| **MAINT-02** | Feature boundary | **Partially resolved 2026-07-05; one violation remains (re-verified 2026-07-29).** The 2026-07-05 pass fixed the bulk (9 files importing `MediaIndexEntry`, 2 importing `publicCmsMediaUrl`, `MediaPickerField` mislocated in `shared/`). Still open: `src/features/cms/api/cmsPersistenceMode.ts:1` imports `type CmsProfileRole` from `@/features/admin/auth/adminCmsProfileRole`. A full sweep of `cms/`, `products/`, `passport/`, `cart/`, `checkout/`, `shopify/`, `storefront-account/`, `analytics/`, `seo/`, `shared/` and the non-admin routes found no other violation. That file is only consumed by admin code today so it does not reach the storefront bundle — the import still breaks the rule. |
| **MAINT-03** | localStorage reset | **Resolved.** `resetAllLocalCmsKeys()` now clears every key in the `ADMIN_STORAGE_KEYS` registry, including `anvl.landingContent.v1` and the sidebar preference. |

## Full-platform audit follow-ups (2026-07-05) — open items carried forward

Phase 0 quick fixes (GLB-01/02, SEC-21, SEC-22, MAINT-30, CLEAN-01) and a same-day remediation round (PERF-20, PERF-21, MAINT-02, REU-14, unsaved-changes warning, `useSingletonCmsEditor` hook, CLEAN-02, SEC-24, SEC-25) are resolved — see `docs/changelog.md` and `docs/audits/anvl-remediation-roadmap.md`. Still open, lower priority:

| ID | Area | Description |
|---|---|---|
| **SEC-23** | Supabase Auth | Leaked-password protection (HaveIBeenPwned check) disabled. Attempted 2026-07-06: no MCP tool covers Auth config (it's a Management API setting, not SQL); the Supabase CLI's only relevant command (`supabase config push`) pushes an entire local `config.toml` to the remote project, but this repo has no `config.toml` at all — creating a minimal one just for this toggle risks silently resetting other unrelated Auth settings to defaults. Left as a manual 2-click dashboard toggle rather than risking a broad config push. |
| — | CMS media / cleanup | ~~Deleting `MediaPickerField` (CLEAN-02) revealed its entire backing upload module was also unreachable~~ — **Resolved 2026-07-06**: `uploadCmsMediaFile`, `deleteCmsMediaByPublicUrl`, `formatCmsDropMediaObjectPath`, and the dead `mediaAssets.service.ts` wrappers around them all deleted (user-approved). `MAINT-31` is moot now that this path is gone entirely. |
| — | Main bundle | Main client entry chunk is 271.20 kB gzip. Bundle-analyzer treemap tooling gap **confirmed unfixable within this session's scope** (reproduced the same dead end on a fresh attempt 2026-07-06 — root node is still `server.js`) — direct byte-level inspection of the real client chunk instead ruled out `react-hook-form`/`@radix-ui` as contributors and confirmed Zod as a real one (~51 kB contiguous region); see `docs/audits/anvl-performance-audit.md` for the full evidence table. Exact per-module attribution still needs a custom Rollup plugin or a newer TanStack Start bundle-analysis hook. |
| — | CMS admin | ~~Theoretical last-write-wins race if two admin tabs edit the same singleton row concurrently~~ — **Resolved 2026-07-06**: `adminCmsRemoteSync.ts` now scopes every save to only the specific column that editor changed (`CmsSettingsFieldKey`), instead of blindly rewriting all 7 columns from a possibly-stale local snapshot. |
| — | Phase J | **Security headers, CSP (report-only), and CSRF implemented 2026-07-06** — see `docs/changelog.md` and `docs/audits/anvl-phase-j-security-plan.md`. Still open: rate limiting (blocked on an Upstash account or a confirmed deployment target — recommended Vercel + Upstash Redis), switching CSP from report-only to enforcing (needs a trial period / report-collection endpoint first), and a full browser-driven login smoke test of the new CSRF check. |

## Global search follow-ups (2026-07-06)

| ID | Area | Description |
|---|---|---|
| — | About search deep-link | A search hit on an About orb navigates to `/about#about-orb-<id>` and forces the normal scrolling page (`viewMode='normal'`) even on altar-capable devices, since the desktop 3D Forge Altar has no per-orb modal deep-link yet. Wiring the altar's own hammer-strike modal to open directly from a search result is a follow-up. |
| — | Story cast search results | `story-cast` results land on the chapter's cover open (`/story?chapter=<slug>`), not a specific book page — the roster is always the book's final spread, so this is "close enough" rather than a precise deep link. |
| — | Admin CMS search | Out of scope for the storefront global search shipped 2026-07-06. `src/features/search/lib/matchEngine.ts` is written index-agnostic (`SearchDocument[]` in, `SearchResult[]` out, no `runtimeClients`/CMS knowledge) so an admin variant can reuse it later with its own document set (settings/fields inside `/admin`). |

## Current expected temporary compromises
- Frontend-only local/mock CMS until backend exists.
- ~~Temporary static admin login~~ **Resolved 2026-07-04** — admin auth is now Supabase-only, server-validated via a sealed HttpOnly session cookie (`src/features/admin/auth/adminAuth.ts` + `adminAuthSession.server.ts`), with a real Remember Me option. See `CLAUDE.md` SEC-01/02/03/SEC-11 and `docs/changelog.md` (2026-07-04).
- **Hardening backlog (remaining only):** flip CSP from report-only to enforcing, server rate limiting on auth and forms, and upload validation at the edge. Security headers, HSTS and CSRF already landed 2026-07-06.
- Currency conversion may start as static rates until backend/server cache exists.
- Scheduled activation may be simulated client/server-side until background jobs exist.
- ~~Media library may start as URL/manual asset picker until real storage exists.~~ **Resolved** — the `cms-media` Supabase Storage bucket has been live since 2026-05-18 and holds real assets; `story-media` and the private `techpacks` bucket followed.
- **Bundle size:** the main client entry chunk measured 890.95 kB raw / 271.20 kB gzip as of 2026-07-05 (down slightly from 902.02 kB / 274.33 kB pre-MAINT-02); `pnpm analyze` plus `vendor-gsap` / `vendor-lenis` / `vendor-framer-motion` / `vendor-three` splits are in place and confirmed lazy, but the dominant contributor to the main chunk itself hasn't been isolated yet — see the bundle-analyzer tooling gap noted above.
