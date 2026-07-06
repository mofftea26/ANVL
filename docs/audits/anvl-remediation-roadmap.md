# ANVL Remediation Roadmap

**Audit phase:** 13, last updated 2026-07-06 after two remediation rounds. Consolidates every finding from `anvl-issue-register.md`. Resolved items are kept here (struck through) rather than deleted, so the roadmap's history stays legible — the issue register's "Resolved this audit" table is the authoritative detail for each.

---

## Done this session

**Architecture / maintainability**
- ~~MAINT-02 boundary cleanup~~ — bigger than first scoped (`MediaIndexEntry`, `publicCmsMediaUrl`, `MediaPickerField` all moved out of `shared/`/storefront-reachable code into `features/cms/media/` and `features/admin/components/`).
- ~~CLEAN-02 + follow-up~~ — `MediaPickerField` deleted, which revealed its entire backing upload module (`uploadCmsMediaFile`, `deleteCmsMediaByPublicUrl`, `formatCmsDropMediaObjectPath`, plus dead wrappers in `mediaAssets.service.ts`) was also unreachable — deleted too.
- ~~REU-14~~ — 3 bare-array query keys migrated to factories; found and fixed a genuine duplicate-request bug along the way (`useAdminProductCatalogQuery()`).
- ~~Unsaved-changes warning in `/admin`~~ — `useAdminDirtyRegistry` + `useRegisterAdminDirty` + `AdminUnsavedChangesGuard` (TanStack Router `useBlocker`), wired into all 7 editors.
- ~~Shared `useSingletonCmsEditor<T>()` hook~~ — adopted by the 5 editors with a plain `config`/`stored` shape (Theme, Shop, Fonts, Assets, PDP). About/Landing Content deliberately kept on their own React-Hook-Form-driven pattern.
- ~~Last-write-wins race on singleton CMS rows~~ — root cause confirmed (every save blindly rewrote all 7 `cms_settings`/`storefront_publication` columns); fixed by scoping each editor's save to only its own column (`CmsSettingsFieldKey`).

**Supabase / security**
- ~~PERF-20~~ — 24 RLS policies rewritten to wrap `auth.uid()`/`auth.jwt()` in `(select ...)` (user-approved).
- ~~PERF-21~~ — 2 missing FK-covering indexes added.
- ~~SEC-24~~ — `pg_net` moved out of `public` schema (drop+recreate, since not relocatable; verified zero callers/queued requests first).
- ~~SEC-25~~ — dropped both public bucket listing policies; verified live that direct object fetch is unaffected and anon listing now returns nothing.
- ~~Phase J: CSRF~~ — double-submit-cookie (`adminCsrf.ts`) on the only two cookie-authenticated server functions (`loginAdminServerFn`/`logoutAdminServerFn`); found the session cookie's `sameSite: 'lax'` already blocks the classic attack vector, so this is defense-in-depth, not the sole layer.
- ~~Phase J: security headers + CSP~~ — global request middleware (`src/start.ts`) sets HSTS/`X-Content-Type-Options`/`Referrer-Policy`/`X-Frame-Options` plus a scoped `Content-Security-Policy-Report-Only`; live-verified via `curl` across multiple routes.
- ~~Phase J: CSP report endpoint~~ — `src/routes/api/csp-report.ts`, wired via `report-uri`, live-verified end to end.
- **SEC-23 — attempted, correctly declined.** No MCP tool covers Supabase Auth config (Management API territory, not SQL); the CLI's only relevant command (`supabase config push`) pushes an entire local `config.toml`, but this repo has none — creating one just for this toggle risked silently resetting unrelated Auth settings. Left as a manual 2-click dashboard toggle.

**Performance**
- **Main bundle decomposition — attempted again, dead end reproduced identically** (confirms the `dist/stats.html` gap isn't a fluke — root node is still `server.js`). Pivoted to direct byte-level inspection of the real client chunk: ruled out `react-hook-form`/`@radix-ui` as contributors (0 occurrences), confirmed Zod as a real one (~51 kB contiguous region), confirmed vendor chunking is genuinely clean (0 GSAP/Three/Lenis leakage). See `anvl-performance-audit.md` for the full evidence table. **Still open** — exact per-module attribution needs a custom Rollup plugin or a newer TanStack Start bundle-analysis hook.

---

## Still open

| Item | Priority | Notes |
|---|---|---|
| Rate limiting (`/admin` login + public forms) | On hold | User is reconsidering Upstash — the design in `anvl-phase-j-security-plan.md` §4 is one option, not locked in. |
| CSP: switch from report-only to enforcing | P2 | The report endpoint now exists, but needs a real trial period against actual traffic first — no urgency to force this. |
| SEC-23 (leaked-password protection) | P3 | Manual dashboard toggle, ~2 clicks, whenever convenient. |
| Main bundle decomposition (exact attribution) | P2 | Needs a custom Rollup plugin or a newer TanStack Start release; not worth more time without better tooling. |
| `listMediaAssets()` unbounded `SELECT *` | P3 | Add `.range()`/pagination before the library grows past ~100 assets (currently 19). |
| MIG-01 (orphaned migrations) | P3 | No action needed beyond documentation — migrations are historical record, current schema is already clean. |

---

## Test coverage still worth adding (see `anvl-test-matrix.md`)

1. Regression test guarding `resolveUploadMimeType` usage in both upload call sites (prevents GLB-01 from silently regressing).
2. Test for `AccountShellLayout`'s redirect gate (prevents FUNC-01 from regressing).
3. Extract Shopify webhook's pure mapping functions into a testable module.
4. pgTAP-based RLS policy tests (extension already installed, unused) — larger investment, lower near-term priority given RLS was manually verified correct in this audit.

---

## Long-term (no active timeline, matches `docs/next-steps.md`'s "Deferred" section)

- Bone-light editorial theme.
- `@tanstack/react-table` adoption for admin tables (installed, unused).
- Medusa backend exploration.
- Real-time CMS sync via Supabase Realtime.
- Phase I router-repatch fix (waiting on upstream TanStack Start).
- Lighthouse/Core Web Vitals CI integration.
- Proper client-bundle treemap tooling — worth resolving before investing more time in bundle-size work, since without it every future size investigation is guesswork.
