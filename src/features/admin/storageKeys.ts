/**
 * Centralized registry of every `localStorage` key the admin CMS owns.
 *
 * Why this exists (audit MAINT-08 / Phase C3):
 *   - Hard-coded literals previously lived in 5+ files (`drops.storage.ts`,
 *     `products.storage.ts`, `websiteLayout.storage.ts`, …) and were
 *     re-typed inside `resetAllLocalCmsKeys`. A typo would silently miss a
 *     reset, leaving stale state.
 *   - One canonical map keeps the bulk-reset / debugging / future
 *     migration tooling honest.
 *
 * If you add a new persisted key, add it here first, then reference it
 * from the matching `*.storage.ts` channel.
 *
 * Supabase counterpart (when `VITE_SUPABASE_URL` + anon key are set):
 *   - `drops` / `activeDropId` → `public.anvl_drops` drafts + `active_drop_id`
 *     on `storefront_publication`; published drop is `published_drop_snapshot`.
 *   - `products` → `public.cms_admin_products`; published catalog array is
 *     `storefront_publication.products_snapshot` (+ `catalog_drop_index`).
 *   - `websiteLayout` → draft: admin persistence TBD; published:
 *     `storefront_publication.website_layout`.
 *   - `globalBrand` → published: `storefront_publication.global_brand` (optional jsonb).
 *   - `siteSeo` → published: `storefront_publication.site_seo`.
 *   - `landingCmsLegacy` → migrate to `storefront_publication.legacy_landing_cms`
 *     or fold into drop/layout; local key until removed.
 *   - `dropThemePalettePresets` → **local-only** admin convenience (or future per-user row).
 *   - `dropEditorPreviewSplitPx` → **local-only** UI splitter width.
 */
export const ADMIN_STORAGE_KEYS = {
  drops: 'ANVL_DROPS',
  activeDropId: 'ANVL_ACTIVE_DROP_ID',
  products: 'ANVL_PRODUCTS',
  websiteLayout: 'ANVL_WEBSITE_LAYOUT',
  globalBrand: 'ANVL_GLOBAL_BRAND',
  landingCmsLegacy: 'anvl.landingCms.v1',
  siteSeo: 'anvl.siteSeo.v1',
  /** Saved campaign palette rows (admin theme card “Save as preset”). */
  dropThemePalettePresets: 'ANVL_DROP_THEME_PALETTE_PRESETS',
  /** Drop editor `xl` split: live preview column width (px). */
  dropEditorPreviewSplitPx: 'ANVL_DROP_EDITOR_PREVIEW_SPLIT_PX',
  /** Client drop ids pending explicit delete on next remote sync. */
  remoteDropDeleteQueue: 'ANVL_DROPS_REMOTE_DELETE_QUEUE',
} as const

export type AdminStorageKey =
  (typeof ADMIN_STORAGE_KEYS)[keyof typeof ADMIN_STORAGE_KEYS]

/** All keys as an array — convenient for bulk reset / migration helpers. */
export const ALL_ADMIN_STORAGE_KEYS: readonly AdminStorageKey[] =
  Object.values(ADMIN_STORAGE_KEYS) as readonly AdminStorageKey[]
