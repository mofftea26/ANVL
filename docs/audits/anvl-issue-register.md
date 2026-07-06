# ANVL Issue Register

Format (per the audit plan): ID, Title, System, Severity, Priority, Type, Confidence, Evidence, Root cause, Affected files/DB objects, Impact, Fix, Tests, Rollback. Entries are condensed where a full `anvl-*-audit.md` doc already carries the detail — this register is the single index, not a duplicate of every doc's prose.

**Priority key:** P0 immediate production risk · P1 fix before next release · P2 important improvement · P3 maintenance/polish

---

## Resolved this audit

| ID | Title | System | Severity | Priority | Type | Confidence | Fix summary |
|---|---|---|---|---|---|---|---|
| GLB-01 | Drop-scoped GLB upload sent raw `file.type` as Storage `contentType`, causing the reported 415 | CMS media upload | High | P0 (was the reported bug) | Functional bug | Verified | `uploadCmsMediaFile()` now uses `resolveUploadMimeType()` |
| GLB-02 | Same upload path stored unresolved mime in `cms_media_assets.mime` | CMS media | Medium | P1 | Data-integrity | Verified | `registerUploadedCmsMedia()` now uses `resolveUploadMimeType()` |
| SEC-21 | `cms_settings` draft table was public-readable (anon SELECT) | Supabase RLS | Medium | P0 | Security | Verified | New role-gated policy `cms_settings_select_cms` |
| SEC-22 | Stray public EXECUTE grant on `rls_auto_enable()` | Supabase functions | Low | P1 | Security | Verified | Revoked from `PUBLIC` (two migrations — first attempt was a no-op) |
| MAINT-30 | Duplicate, diverging `extensionFor`/`formatCmsLibraryMediaObjectPath` across two files | CMS media | Medium | P1 | Maintainability | Verified | Consolidated into `mediaMime.ts`; dead duplicate deleted |
| CLEAN-01 | Dead `tm-asset-ingest` Edge Function | Supabase Edge Functions | Info | P2 | Cleanup | Verified | Deleted via Supabase CLI |
| FUNC-01 | `/account` could hang indefinitely for signed-out visitors in a backgrounded tab (`requestAnimationFrame`-gated redirect) | Storefront account | Medium | P1 | Functional bug | Verified (reproduced directly: rAF confirmed never firing in a hidden tab) | Replaced rAF with a plain `useEffect` |
| (unlabeled) | Cart button `aria-label` didn't pluralize ("1 items") | Storefront nav | Low | P3 | Accessibility/polish | Verified | `PremiumNavTopbar.tsx` now pluralizes correctly |
| (unlabeled) | `MediaUploadZone` had no client-side extension/size validation | CMS media | Low | P2 | Functional gap | Verified | Added `validateUploadFile()` + 5 new tests |
| PERF-20 | ~24 RLS policies re-evaluated `auth.uid()`/`auth.jwt()` per row instead of `(select ...)` | Supabase RLS | Low (grows with scale) | P2 | Performance | Verified, user-approved before applying | Rewrote all 24 policies, byte-for-byte identical logic; advisor confirms clear |
| PERF-21 | 2 unindexed FKs (`cms_media_assets.created_by`, `story_cast.act_id`) | Supabase indexes | Low | P3 | Performance | Verified | Added covering indexes |
| MAINT-02 | Storefront/shared code imported `features/admin/**` — bigger in scope than first documented (9 files for `MediaIndexEntry`, 2 for `publicCmsMediaUrl`, plus `MediaPickerField` itself mislocated in `shared/`) | Architecture | Medium | P1 | Architecture/maintainability | Verified, fully resolved | New `features/cms/media/{mediaIndex.types.ts,mediaUrl.ts}`; `MediaPickerField` moved to `features/admin/components/` |
| REU-14 | 3 bare-array TanStack Query keys instead of factories | React Query | Medium | P2 | Maintainability | Verified | Migrated to factory pattern; `useAdminProductCatalogQuery()` also fixed a genuine duplicate-request bug found along the way |
| (unlabeled, found during MAINT-02) | `ChapterForm.tsx` and `AdminPdpContentEditor.tsx` fetched the identical product catalog under two different, unrelated cache keys — duplicate network request | React Query | Low | P2 | Performance/duplication | Verified | Consolidated onto shared `useAdminProductCatalogQuery()` |
| — | No unsaved-change navigation warning anywhere in `/admin` | CMS admin | Medium | P1 | Functional gap | Verified, fully resolved | Shared `useAdminDirtyRegistry` + `useRegisterAdminDirty` + `AdminUnsavedChangesGuard` (TanStack Router `useBlocker`), wired into all 7 editors |
| — | ~40 lines duplicated per singleton CMS editor | CMS admin | Low | P2 | Maintainability | Verified, fully resolved | New `useSingletonCmsEditor<T>()` hook, adopted by Theme/Shop/Fonts/Assets/PDP (About/Landing Content intentionally kept on RHF's own `isDirty`) |
| CLEAN-02 | `MediaPickerField` component was fully dead code | CMS media / cleanup | Low | P3 | Cleanup | Verified, deleted (user-approved) | Component + test deleted; `MediaPickerKind` type re-homed to `features/admin/media/mediaPickerKind.types.ts` |
| CLEAN-02b | Entire drop-scoped upload module (`uploadCmsMediaFile`, `deleteCmsMediaByPublicUrl`, `formatCmsDropMediaObjectPath`, `CmsDropVisualAssetRole`) + dead wrappers in `mediaAssets.service.ts` (`uploadCmsMediaFileWithCatalog`, `registerUploadedCmsMedia`) had zero callers — only reachable via the now-deleted `MediaPickerField` | CMS media / cleanup | Low | P3 | Cleanup | Verified, deleted (user-approved) | Deleted `uploadCmsMedia.ts` + test; the 2 genuinely-alive exports (`CMS_MEDIA_BUCKET`, `publicCmsMediaUrl`) already had a canonical home at `features/cms/media/mediaUrl` — repointed the 2 remaining importers there directly. Clarifies GLB-01's real-world impact was smaller than first assumed, since this path was already unreachable before the audit started. |
| SEC-24 | `pg_net` extension in `public` schema | Supabase extensions | Info | P3 | Security/hygiene | Verified, fully resolved (user-approved) | Not relocatable — required `DROP EXTENSION` + `CREATE EXTENSION ... SCHEMA extensions`. Verified safe first (zero functions call `net.http_*`, zero queued requests, no cron jobs). Advisor confirms cleared. |
| SEC-25 | Public buckets (`cms-media`, `story-media`) allowed object listing | Supabase Storage | Low/Info | P2 | Security | Verified, fully resolved (user-approved) | Dropped both public SELECT policies on `storage.objects` — public buckets serve individual object fetches via the bucket's own `public: true` flag, not via this RLS policy. Verified live: direct object fetch still returns 200; anon list call now returns an empty array instead of real filenames. No `.list()` call exists anywhere in the app (catalog is the `cms_media_assets` table), so nothing broke. |
| — | No CSP/HSTS/security headers anywhere in the app (part of Phase J) | Security / launch readiness | High | P1 | Security | Verified, fully resolved for headers; CSP intentionally report-only | New `src/start.ts` global request middleware sets `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Strict-Transport-Security`, and a scoped `Content-Security-Policy-Report-Only` on every response. Live-verified via `curl` across multiple routes. |
| — | No CSRF protection on cookie-authenticated admin server functions (part of Phase J) | Security / launch readiness | Medium (narrower than first assumed — see finding) | P1 | Security | Verified, fully resolved | Double-submit-cookie (`adminCsrf.ts`) wired onto `loginAdminServerFn`/`logoutAdminServerFn` — the only two cookie-authenticated mutation endpoints (everything else uses bearer-token Supabase auth directly, not CSRF-exploitable). Found the session cookie's existing `sameSite: 'lax'` already blocks the classic attack vector — this is defense-in-depth, not the sole layer. 10 unit tests. |
| — | Last-write-wins race: two admin tabs saving different CMS sections could clobber each other's column | CMS admin / Supabase | Medium | P1 | Architecture / data-integrity | Verified, fully resolved | Confirmed root cause: `flushAdminCmsRemoteSync()` always wrote all 7 `cms_settings`/`storefront_publication` columns regardless of which one changed. Threaded an optional `fields: CmsSettingsFieldKey[]` scope through `afterLocalCmsMutation` → `flushAdminCmsWriteThrough` → `flushAdminCmsRemoteSync`; all 7 singleton editors' save functions now pass their own column, so concurrent saves of different sections can no longer overwrite each other. 5 new unit tests on the extracted pure scoping function. |

---

## Open — carried to the remediation roadmap

| ID | Title | System | Severity | Priority | Type | Confidence | Evidence location |
|---|---|---|---|---|---|---|---|
| SEC-23 | Leaked-password protection disabled | Supabase Auth | Low | P2 | Security | Verified | `anvl-security-audit.md` §SEC-23 |
| MAINT-31 (narrowed) | Drop-scoped asset replace orphan risk — narrower than first thought | CMS media / Storage | Low | P3 | Cleanup | Verified (narrowed scope) | `anvl-storage-and-glb-audit.md` §5 |
| MIG-01 | 3 orphaned migrations reference dropped drop-builder objects | Supabase migrations | Medium | P3 | Cleanup | Verified, still open | `anvl-cleanup-register.md` |
| — | No role-specific UI gating within individual CMS editors (mitigated by route-level gate) | CMS admin | Low | P3 | Defense-in-depth | Verified | Phase 3 CMS audit findings |
| — | PDP content can orphan if a product's slug changes post-authoring | CMS admin / commerce | Low | P3 | Data hygiene | Verified | Phase 3 CMS audit findings |
| — | Main storefront JS entry chunk is 271 kB gzip (was 274 kB pre-MAINT-02), shipped on every route — dominant contributor not yet isolated | Performance | Medium | P1 | Performance | Verified (measured) | `anvl-performance-audit.md` §1 |
| — | Bundle-analyzer tooling produced misleading output — `dist/stats.html` only ever captured one of TanStack Start's two build passes | Tooling | Low | P3 | Tooling gap | Verified, partially fixed | `vite.config.ts`, `anvl-performance-audit.md` §1 |
| Phase J (bundle) | No rate limiting, CSRF tokens, or CSP/HSTS headers | Security / launch readiness | High | **P0 pre-launch blocker** | Security | Verified, already tracked | `anvl-security-audit.md`, `docs/technical-debt.md` |

---

## Verified compliant — no action, listed for completeness

GSAP/Three.js cleanup (DustField, SiteDustGate, TheOathLanding, AltarAnvil, Story `Book.tsx`); admin route lazy-loading; vendor chunk splitting; SSR guards in `runtime.ts`; admin auth (SEC-11); Shopify webhook HMAC verification; secrets hygiene (no `VITE_*` leaks); dependency sample (8 packages checked, all used); React hooks discipline (no Rules-of-Hooks violations, correct dependency arrays, proper Zustand selector usage, memoized context values); Zustand cart store usage; shared `Skeleton`/error-boundary usage at appropriate boundaries; Story chapter/act/cast cascade-delete safety (DB-level, not just UI-level); checkout handoff code correctness (network-verified, navigation completion unconfirmed only due to environment constraints, not a code defect).
