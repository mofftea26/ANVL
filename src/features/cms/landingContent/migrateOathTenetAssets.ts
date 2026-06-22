import type { AssetConfig } from '@/features/cms/config/cmsSiteConfig.zod'
import type { LandingContentConfig } from '@/features/cms/landingContent/landingContent.zod'
import { oathLandingContentSchema } from '@/features/landingPages/pages/TheOathLanding/content/oathContent.schema'

const OATH_KEY = 'the-oath'

const LEGACY_TENET_SLOT_KEYS = [
  'chapterMedia1',
  'chapterMedia2',
  'chapterMedia3',
  'chapterMedia4',
] as const

/**
 * One-time migration: move deprecated `chapterMedia*` slot assignments into
 * `landing_content['the-oath'].tenets.items[].mediaId` and strip the old keys
 * from `asset_config.drops['the-oath']`.
 */
export function migrateOathTenetAssetsFromSlots(
  landingContent: LandingContentConfig,
  assetConfig: AssetConfig,
): { landingContent: LandingContentConfig; assetConfig: AssetConfig } {
  const dropAssets = assetConfig.drops[OATH_KEY] ?? {}
  const legacyIds = LEGACY_TENET_SLOT_KEYS.map((key) => dropAssets[key]?.trim()).filter(
    Boolean,
  ) as string[]
  if (legacyIds.length === 0) {
    return { landingContent, assetConfig }
  }

  const rawSlice = landingContent[OATH_KEY] ?? {}
  const parsed = oathLandingContentSchema.safeParse(rawSlice)
  const slice = parsed.success ? parsed.data : {}
  const existingItems = slice.tenets?.items ?? []

  // Any CMS-authored item list (even without media ids) wins over legacy slot migration.
  if (existingItems.length > 0) {
    return {
      landingContent,
      assetConfig: stripLegacyTenetSlots(assetConfig),
    }
  }

  const migratedItems = LEGACY_TENET_SLOT_KEYS.map((key, i) => {
    const mediaId = dropAssets[key]?.trim()
    const existing = existingItems[i]
    if (!mediaId && !existing) return existing
    return {
      ...(existing ?? {}),
      ...(mediaId ? { mediaId } : {}),
    }
  }).filter((item) => item !== undefined)

  const nextSlice: Record<string, unknown> = {
    ...(typeof rawSlice === 'object' && rawSlice !== null && !Array.isArray(rawSlice)
      ? rawSlice
      : {}),
    tenets: {
      ...(slice.tenets ?? {}),
      items: migratedItems.length > 0 ? migratedItems : slice.tenets?.items,
    },
  }

  return {
    landingContent: { ...landingContent, [OATH_KEY]: nextSlice },
    assetConfig: stripLegacyTenetSlots(assetConfig),
  }
}

function stripLegacyTenetSlots(assetConfig: AssetConfig): AssetConfig {
  const drop = assetConfig.drops[OATH_KEY]
  if (!drop) return assetConfig

  let touched = false
  const nextDrop = { ...drop }
  for (const key of LEGACY_TENET_SLOT_KEYS) {
    if (key in nextDrop) {
      delete nextDrop[key]
      touched = true
    }
  }
  if (!touched) return assetConfig

  return {
    ...assetConfig,
    drops: { ...assetConfig.drops, [OATH_KEY]: nextDrop },
  }
}
