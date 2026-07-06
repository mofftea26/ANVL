# ANVL Cleanup Register

**Audit phase:** 12 (Cleanup and unused-code verification)
**Rule followed throughout this audit:** nothing below was deleted on the strength of a text search alone — every "confirmed" item was traced through imports, dynamic imports, and (for DB/storage) live Supabase inspection before being classified.

---

## Confirmed safe — already actioned this session

| Item | Evidence | Action taken |
|---|---|---|
| `tm-asset-ingest` Edge Function | Source reviewed: self-neutralized (`return new Response("gone", {status:410})`), own code comment said "Safe to delete from the dashboard" | **Deleted** via `supabase functions delete` (user-approved) |
| `formatCmsLibraryMediaObjectPath` (category-based variant, `uploadCmsMedia.ts`) | Grepped every call site across `src/**` and the test suite — zero references outside its own definition | **Deleted** as part of the GLB fix (MAINT-30) |
| Duplicate `extensionFor()` (verbatim copy in two files) | Same function body in `uploadCmsMedia.ts` and `mediaAssets.service.ts` | **Consolidated** into `src/features/admin/media/mediaMime.ts` |
| Public RLS policy `cms_settings_select_all` | Grepped all storefront-safe code; only `adminCmsHydration.ts` (authenticated client) reads `cms_settings` | **Replaced** with `cms_settings_select_cms` (role-gated) |
| Public `EXECUTE` grant on `rls_auto_enable()` | Confirmed via `information_schema.routine_privileges`; function can't be usefully invoked outside an event-trigger context | **Revoked** from `PUBLIC` |
| `MediaPickerField` component + its test file (CLEAN-02) | Confirmed at the last committed `HEAD` (before this session touched anything) via `git grep`: every consumer across the whole tree only imports the `MediaPickerKind` **type**; nothing renders `<MediaPickerField>` as JSX. Root cause found: `MediaLibrarySlotField` (what admin editors actually render for slot assignment) has no upload capability of its own — it only picks from the library, which is populated separately via `/admin/assets`'s `MediaUploadZone`. `MediaPickerField`'s inline-upload UI was superseded by this two-step architecture at some point pre-audit and never removed. User-approved deletion. | **Deleted**; `MediaPickerKind` re-homed to new `src/features/admin/media/mediaPickerKind.types.ts`, all 6 real (type-only) importers repointed. |
| Drop-scoped upload module (`uploadCmsMediaFile`, `deleteCmsMediaByPublicUrl`, `formatCmsDropMediaObjectPath`, `parseCmsMediaObjectPathFromPublicUrl`, `CmsDropVisualAssetRole`) + its dead wrappers in `mediaAssets.service.ts` (`uploadCmsMediaFileWithCatalog`, `registerUploadedCmsMedia`) | Re-confirmed via grep: zero external callers to any of these beyond each other and the now-deleted `MediaPickerField`; no test coverage exercised any of them. This is the exact module Phase 0's GLB-01 fix targeted. | **Deleted** (`src/features/admin/cmsRemote/uploadCmsMedia.ts` + its test, plus the two dead wrapper functions in `mediaAssets.service.ts`), user-approved 2026-07-06. Genuinely-alive exports (`CMS_MEDIA_BUCKET`, `publicCmsMediaUrl`) already had their canonical home at `@/features/cms/media/mediaUrl` (from the earlier MAINT-02 fix) and were only re-exported from the deleted file — the 2 remaining importers repointed directly to the canonical module. |

**Nuance worth remembering:** `git grep` at the commit before this whole audit session confirms `MediaPickerField` (and therefore this entire upload chain) was *already* unreachable before the audit started — meaning the GLB-01 fix (Phase 0) was a correct fix to real code, but that specific code path likely wasn't what produced the originally-reported 415 error, since it had no live caller even then. The actually-reachable path (`MediaUploadZone` → `uploadLibraryMediaFile` → `resolveUploadMimeType`) already had its own fix landed 2026-07-03, before this audit began. This doesn't undo any of this session's fixes — both paths were correctly parity-fixed regardless — but the practical, user-facing impact of GLB-01 specifically should be read as smaller than first assumed; the dedup/cleanup value (MAINT-30) and the metadata-correctness value (GLB-02) stand on their own.

---

## Likely unused but requires manual verification (not removed)

| Item | Why it's a candidate | Why it wasn't removed | Verification needed |
|---|---|---|---|
| `story_cast` table (0 rows) | Empty at audit time — "generals/recruits/loyal members" feature may not have been populated yet | This is a schema/feature, not dead code — an empty table is not evidence of an unused feature, just an unpopulated one. The admin Story editor has full CRUD UI for cast members (confirmed in Phase 3). | Ask the content team whether cast/roster content is planned; do not drop the table |
| 3 orphaned migrations (`20260620130000`, `20260624120000`, `20260625120000` — already tracked as `MIG-01`) | Reference dropped `anvl_drops`/`cms_publish_drop` objects from the removed drop-builder system | Supabase migrations are an append-only historical log — "removing" a migration file doesn't undo its already-applied effects, and rewriting migration history on a project with a real production history is a much higher-risk operation than it looks | Confirm current schema has no lingering `anvl_drops`-related objects (this audit's `list_tables` pass found none — the tables are already gone), then simply leave the historical migration files as a record; do not attempt to rewrite history |
| `MediaAssetGrid.tsx`'s inline empty-state markup (vs. the shared `EmptyState` component) | Phase 7 found this as a minor duplication — a plain `<p>` where `EmptyState` could be used | Cosmetic/consistency, not correctness — low priority, not "unused code" in the traditional sense | Swap in `EmptyState` next time this file is touched for another reason; not worth a standalone PR |

---

## Dynamically/CMS/DB referenced — must not remove

| Item | Why it looks unused if you only grep | Actual reference |
|---|---|---|
| `mediaMime.ts` exports (`extensionFor`, `resolveUploadMimeType`) | New file this session — a stale-cache text search tool might not have indexed it yet | Statically imported by both `uploadCmsMedia.ts` and `mediaAssets.service.ts`, confirmed via direct read post-edit, `pnpm typecheck` passing |
| `cms_profiles_role_idx`, `orders_created_at_idx`, `cms_media_assets_filename_idx` (flagged "unused" by Supabase advisor) | Advisor flags these as never-scanned | This reflects current *data volume* (1-19 rows per table), not that the feature using them is dead — the code paths that would use them (role checks, chronological order lists, filename search) all exist and are exercised in the admin UI. **Do not drop** — they'll show usage once there's real production traffic. |
| `pg_cron` extension (installed, 0 scheduled jobs) | Zero rows in `cron.job` | Installed but genuinely inert — this one actually IS unused right now (the scheduled-drop-activation feature it supported was removed with the drop-builder teardown). Still, dropping an installed extension is a schema change with its own review cycle — not done in this pass, listed here for visibility, not urgency. |

---

## Database cleanup candidates

None found requiring action beyond what's listed above. Schema is otherwise clean: no orphan records (all FKs correctly cascade or set-null), no duplicate rows (unique constraints properly enforced on `landing_pages.key`, `story_chapters.slug`, `orders.shopify_order_id`, `cms_media_assets.storage_path`), no missing RLS.

---

## Storage cleanup candidates

- **`cms-media` bucket:** 24 objects total (per `storage.objects` row count at audit time). No orphan-detection sweep was performed (would require cross-referencing every object path against every `cms_media_assets.storage_path` + every CMS asset-slot value that might reference a path directly) — flagged as a **future task**, not urgent given the low object count. The MAINT-31 narrowing (Phase 5) shows the primary replace-path already cleans up after itself, reducing the likely orphan rate going forward.
- **`story-media` bucket:** not separately audited for orphans this session — same recommendation applies if/when the object count grows.

---

## Dependency cleanup candidates

**Re-verified this session (Phase 1 architecture pass), all found genuinely used — no new removal candidates:**
`@radix-ui/react-popover`, `@radix-ui/react-select`, `@tanstack/react-virtual`, `@tanstack/react-devtools`, `@tanstack/react-router-devtools`, `class-variance-authority`, `sonner`, `lenis`.

`docs/technical-debt.md`'s Phase F entry already documents prior removals (`@fontsource/bebas-neue`, `@fontsource/manrope`, `@tanstack/react-query-devtools`, `@tailwindcss/typography`, `react-colorful`, `react-day-picker`) — no reason to revisit those; they were verified gone and their removal is confirmed still correct (no re-introduction found in this pass).

**No new unused dependencies found in this audit.**

---

## Duplicate implementation candidates (code-level, not deletable without a refactor)

| Duplication | Files | Classification |
|---|---|---|
| Singleton CMS editor read/save/toast boilerplate (~40 lines repeated per editor) | Shop, Theme, Fonts, Assets, About, Content, PDP editors (`src/features/admin/**`) | Candidate for shared hook (e.g. `useSingletonCmsEditor<T>()`) — flagged in Phase 3, not executed this session (would touch 7 files, warrants its own reviewed PR per the project's "do not rewrite major features without discussing the plan first" rule) |
| Bare-array TanStack Query keys (REU-14) | `ChapterForm.tsx:49`, `AdminPdpContentEditor.tsx:68`, `useMediaAssetsQuery.ts:11` | Candidate for shared query-key-factory pattern, matching `accountQueryKeys` (`publicAccount.core.ts`) as the reference implementation |

---

## Quarantine approach for anything still uncertain

Nothing in this audit met the bar for an outright deletion beyond the 5 items in the "confirmed safe" table above (all separately approved by the user before action). Everything else is left in place with a documented rationale here and in `docs/technical-debt.md`, to be revisited as a deliberate, reviewed follow-up rather than folded into this audit's scope creep.
