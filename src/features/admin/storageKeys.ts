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
 */
export const ADMIN_STORAGE_KEYS = {
  drops: 'ANVL_DROPS',
  activeDropId: 'ANVL_ACTIVE_DROP_ID',
  products: 'ANVL_PRODUCTS',
  websiteLayout: 'ANVL_WEBSITE_LAYOUT',
  globalBrand: 'ANVL_GLOBAL_BRAND',
  landingCmsLegacy: 'anvl.landingCms.v1',
  siteSeo: 'anvl.siteSeo.v1',
} as const

export type AdminStorageKey =
  (typeof ADMIN_STORAGE_KEYS)[keyof typeof ADMIN_STORAGE_KEYS]

/** All keys as an array — convenient for bulk reset / migration helpers. */
export const ALL_ADMIN_STORAGE_KEYS: readonly AdminStorageKey[] =
  Object.values(ADMIN_STORAGE_KEYS) as readonly AdminStorageKey[]
