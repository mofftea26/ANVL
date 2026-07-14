/**
 * Centralized registry of every `localStorage` key the admin CMS owns.
 */
export const ADMIN_STORAGE_KEYS = {
  activeLandingPage: 'anvl.activeLandingPage.v1',
  themeConfig: 'anvl.themeConfig.v1',
  fontConfig: 'anvl.fontConfig.v1',
  assetConfig: 'anvl.assetConfig.v1',
  landingContent: 'anvl.landingContent.v1',
  shopConfig: 'anvl.shopConfig.v1',
  pdpContent: 'anvl.pdpContent.v1',
  passportContent: 'anvl.passportContent.v1',
  comingSoon: 'anvl.comingSoon.v1',
} as const

export type AdminStorageKey =
  (typeof ADMIN_STORAGE_KEYS)[keyof typeof ADMIN_STORAGE_KEYS]

export const ALL_ADMIN_STORAGE_KEYS: readonly AdminStorageKey[] =
  Object.values(ADMIN_STORAGE_KEYS) as readonly AdminStorageKey[]
