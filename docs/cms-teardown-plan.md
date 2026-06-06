# CMS Cleanup — Drop-Builder Teardown Plan

The CMS is moving from a **drop-builder / acts** model to a **code-owned landing page** model (see `docs/landing-pages.md`). The new model is in place and live; this document tracks the safe removal of the old system.

## Status

| Phase | State |
|---|---|
| New landing registry + The Oath page | ✅ Done |
| New CMS model migration (`cms_settings`, `landing_pages`, publication key) | ✅ Done (`20260626120000_cms_settings_landing_pages.sql`) |
| Landing-key control loop (read + write + hydrate + picker) | ✅ Done |
| Admin landing-picker UI (Dashboard) | ✅ Done |
| Decouple **navigation / footer** from the drop (`buildWebsiteNavigation` + `useWebsiteNavigation`; `__root.tsx` no longer composes from the drop) | ✅ Done |
| Decouple **home SEO + JSON-LD** from the drop (`index.tsx` uses static defaults + `organizationJsonLd`) | ✅ Done |
| Relocate **nav types** (`LandingNavigationContent` + deps) → `cms/navigation/navigation.types.ts`; chrome (PremiumNav/StickyHeader/SiteFooter) repointed | ✅ Done |
| Decouple **products snapshot READ** off `projection.drop` (`storefrontPublicationCommerce` uses `catalogDropIndex`) | ✅ Done |
| Make **publication projection** drop-optional (`projection.drop?`; normalizer returns a projection without a snapshot) + 3 tests + `p.drop` consumers (`supabaseStorefrontReaders`, `storefrontPublicationQuery` → offline-landing fallback, `commerceClient.shopify`) | ✅ Done — **storefront now resolves without the drop; teardown's column drop is safe** |
| Gut `CmsClient` (`getActiveDrop`/`getLandingCmsContent`/`getHomepageContent` + admin-drop methods) + adapters | ✅ Done — no source references remain (`pnpm verify` green) |
| Remove drop-builder code (≈40 files: act-presets, public-landing, cms/landing, drops, admin/drops, drop routes) | ✅ Done — files deleted, all dangling imports repointed/stripped (admin products + site-layout drop UI removed, `createCmsId`/`resetAllLocalCmsKeys` relocated, stale tests updated). `pnpm verify` green |
| Move **products snapshot WRITE** off `cms_publish_drop` into `adminCmsRemoteSync` (so published products stay fresh once the RPC is gone) | ✅ Done — `adminCmsRemoteSync` writes `products_snapshot` + `catalog_drop_index` directly; dead RPC helpers (`adminCmsPublish`, `adminCmsProcessScheduledDrops`) deleted |
| Apply destructive DB teardown | ✅ Done — applied 2026-06-06 via Supabase MCP, recorded as migration `20260606051107_drop_builder_teardown` and promoted into `supabase/migrations/`. Verified: `anvl_drops` dropped, 3 drop columns removed, 3 RPCs dropped, `anvl-process-scheduled-drops` cron unscheduled |
| Undeploy Edge Functions `publish-storefront` + `process-scheduled-drops` | 🟡 Folders removed from repo; **deployed instances still live** (Supabase MCP has no delete tool). They are inert (cron unscheduled, backing table/RPCs dropped). Delete via CLI: `supabase functions delete publish-storefront` / `... process-scheduled-drops` |

The destructive teardown is intentionally **not** an auto-applied migration — the storefront still depends on drop objects until the code below is removed.

## What is being removed

### Code (delete once decoupled, build must stay green)

- `src/features/admin/drops/**` — drop editor, acts builder, act sequence, presets, palette, theme presets.
- `src/features/cms/landing/**` — `composeLandingPageFromDrop`, `landingActs.*`, `landingPageCms.types` (act-driven).
- `src/features/marketing/act-presets/**` — every act preset + registry.
- `src/features/marketing/public-landing/**` — `PublicLandingActs`.
- `src/features/marketing/cinematic-hero/**`, `marketing/default-landing/**` — legacy landing surfaces.
- `src/features/drops/**` — drop document types/schemas/act sequence (audit remaining importers first).
- `src/features/landing/**` — landing-act schemas/types.
- Admin routes: `src/routes/admin/drops/**` + the `/admin/drops` nav item (`adminNav.ts`).
- `src/routes/drop/$slug.tsx` — active drop page (replace with a redirect or remove).
- Drop-coupled hydration in `src/features/admin/cmsRemote/adminCmsHydration.ts` (reads `anvl_drops`).

### Database (`supabase/teardown/2026_drop_builder_teardown.sql`)

- `anvl_drops` table (+ trigger, indexes, RLS).
- Functions `cms_publish_drop(uuid)`, `_cms_publish_drop_core(uuid)`, `cms_process_scheduled_drops()`.
- pg_cron job `anvl-process-scheduled-drops`.
- `storefront_publication` columns `active_drop_id`, `published_drop_snapshot`, `published_manifest`.

### Edge Functions (undeploy + delete folders)

- `supabase/functions/publish-storefront`
- `supabase/functions/process-scheduled-drops`

## What is retained

- `cms_profiles` (auth roles), `cms_admin_products` (catalog), `cms_media_assets` (assets/media).
- `storefront_publication` — kept, minus the three drop columns. Still carries `website_layout`, `site_seo`, `site_homepage`, `global_brand`, `products_snapshot`, `catalog_drop_index`, `media_index`, `campaigns`, `lookbook`, `active_landing_page_key`.
- New: `cms_settings`, `landing_pages`.

## Required decoupling before deletion

These read paths currently flow through the drop and must be re-sourced first:

1. ✅ **Navigation / footer.** `__root.tsx` now builds nav via `buildWebsiteNavigation(layout)` / `useWebsiteNavigation` — no `composeLandingPageFromDrop`.
2. ✅ **Home SEO + JSON-LD.** `index.tsx` uses static SEO defaults + `organizationJsonLd()` — no `landing`/`activeDrop`.
3. ⛔ **Publication projection.** `normalizeStorefrontPublicationRow` returns `null` when `published_drop_snapshot` is absent and types `projection.drop: Drop`. Make `drop` optional (or remove it) so the teardown's column drop doesn't blank the storefront. **Contract change** — update the 3 null-return tests in `publicStorefrontPublication.test.ts`, `storefrontPublicationQuery.fetchStorefrontPublicationView` (drop its `landing` composition), and the remaining `projection.drop` consumers (`supabaseStorefrontReaders` SEO slice, `useStorefrontActiveDrop`, `useActiveDrop`, `commerceClient.shopify`, `SiteThemeEditor`).
4. **Products snapshot.**
   - ✅ **Read side** — `storefrontPublicationCommerce.ts` now resolves product drop labels + home products from `catalogDropIndex`/visible catalog, **not** `projection.drop`.
   - ⛔ **Write side** — `products_snapshot` + `catalog_drop_index` are still written by `_cms_publish_drop_core`. Move this write into `adminCmsRemoteSync` so the catalog still publishes once the drop RPC is gone (`catalog_drop_index` derived from products, not `anvl_drops`).
5. ⛔ **Remaining active-drop consumers.** `getActiveDrop()` / `useStorefrontActiveDrop` / `drop/$slug` route / `ActiveDropThemeProvider` (currently passed `null`). Remove or repoint; ensure no seed nav links point at `/drop/*` once the route is gone.

## Deletion tendrils (mapped — fix these FIRST, or the build breaks)

The act/drop system is one connected component (~120 files reference `/drop` or `/admin/drops`). Before deleting, these storefront-critical / type-coupled links must be re-sourced:

1. **Seed navigation lives in the delete set.** `admin/website-layout/websiteLayout.defaults.ts` imports `landingCmsDefaults` from `admin/landing-cms/landingCms.defaults.ts`; the seed header link is `/drop/the-oath` (`landingCms.defaults.ts:39`). Move the nav defaults to a stable, drop-free module and repoint `/drop/the-oath` → `/shop` BEFORE deleting `admin/landing-cms`.
2. **Typed route Links.** `routes/about.tsx:165` is `<Link to="/drop/$slug">`; admin sidebar/nav Link to `/admin/drops`. Deleting those routes makes the `to` types invalid → typecheck error. Repoint (e.g. `/shop`, remove the admin item) BEFORE deleting the routes.
3. **Route-tree regen.** Deleting `routes/admin/drops/**` + `routes/drop/**` requires `pnpm build` to regenerate `routeTree.gen.ts`, then the fragile `scripts/repatch-admin-route-tree.mjs` re-patches media/settings — verify it still matches the regenerated structure.
4. **Live adapter still composes from the drop.** `supabaseStorefrontReaders` + `storefrontCmsSync` + `storefrontReadFallback` + `seedSnapshots` use `composeLandingPageFromDrop` / `SEED_DROP`. Re-source the offline landing fallback off a drop-free seed before deleting `cms/landing` + `drops`.
5. **SEO/theme drop refs.** `shared/components/seo/structuredData.ts` (drop JSON-LD), `cms/seoMeta.ts`, `cms/api/resolveSeoByPath.ts`, `app/providers/ActiveDropThemeProvider`/`Bridge`, `admin/site-theme`/`site-layout` reference the drop — neutralize or delete with their tests.

## Order of operations

1. Re-source products snapshot, nav/footer/SEO, and home JSON-LD off the drop (build green at each step). ✅
2. Delete the drop-builder code surfaces above; fix imports; `pnpm verify`. ✅
3. Undeploy + remove the two Edge Functions. 🟡 folders removed; deployed instances need `supabase functions delete` (MCP can't).
4. Apply teardown SQL. ✅ applied via MCP, promoted to `supabase/migrations/20260606051107_drop_builder_teardown.sql`.
5. Regenerate Supabase types if used; update `docs/project-map.md`, `docs/cms-architecture.md`, `docs/changelog.md`.

## Remote-state findings (discovered during teardown apply, 2026-06-06)

Inspecting the remote project (`cptebkgyrfmokklwtrgp`) surfaced two items **outside** the authored teardown scope:

1. **Additive new-model migrations were never applied remotely → NOW APPLIED (2026-06-06).** `cms_settings_landing_pages` (creates `cms_settings`, `landing_pages`, and `storefront_publication.active_landing_page_key` + RLS/grants/seed) and `storefront_profiles` (storefront customer identity + auto-create-on-signup trigger + RLS) were applied via MCP and recorded as migrations `20260606052134` / `20260606052151`. The local files were renamed to those versions (idempotent DROP-then-CREATE guards) for local↔remote parity; the original future-dated `20260626*/20260627*` files were removed. Also hardened: `REVOKE EXECUTE` on the `handle_new_storefront_user()` trigger function (advisor 0028/0029). Verified: all three tables + the publication column + seed rows (`the-oath`) + the `on_auth_user_created_storefront` trigger exist.
2. **Orphaned act reference tables → DROPPED (2026-06-06).** `cms_act_natures` + `cms_act_layouts` (drop-builder remnants, no code references) were dropped via MCP, recorded as migration `20260606095206_drop_orphaned_act_reference_tables`. The remote `public` schema now matches the retained-tables target exactly: `cms_profiles`, `storefront_publication`, `cms_admin_products`, `shopify_product_links`, `cms_media_assets`, `cms_settings`, `landing_pages`, `storefront_profiles`.
