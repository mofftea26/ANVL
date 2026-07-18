import { readAssetConfigFromStorage } from '@/features/cms/config/cmsSiteConfig.settings'
import type { AssetConfig } from '@/features/cms/config/cmsSiteConfig.zod'
import { readLandingContentFromStorage } from '@/features/cms/landingContent/landingContent.settings'
import { readPdpContentFromStorage } from '@/features/cms/pdpContent/pdpContent.settings'
import { readPassportContentFromStorage } from '@/features/cms/passportContent/passportContent.settings'
import { readShopConfigFromStorage } from '@/features/cms/shop/shopExperience.settings'
import { readComingSoonConfigFromStorage } from '@/features/cms/comingSoon/comingSoon.settings'

/** Deep-walk any JSON-ish value, collecting every non-empty string. */
function collectStrings(value: unknown, out: Set<string>): void {
  if (typeof value === 'string') {
    if (value) out.add(value)
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out)
    return
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectStrings(item, out)
  }
}

/**
 * Every string referenced anywhere in the CMS content blobs that assign media
 * by asset ID: the site-asset slot map, landing/About content, per-product PDP
 * and passport content, the Shop config, and Coming Soon. Media asset IDs are
 * unique UUID tokens, so `set.has(asset.id)` answers "is this library item used
 * by *any* editor?" — not just the site-asset slot map, which is all the media
 * library's Assigned/Unassigned badge previously understood.
 *
 * Pass the Assets editor's live working copy as `assetConfigOverride` so
 * in-panel slot edits reflect immediately, before they are persisted. All other
 * blobs are read from their persisted stores (they can only change on their own
 * editor routes, so a fresh read on mount is current).
 *
 * Out of scope: Story media, which lives in relational Supabase tables rather
 * than a config blob.
 */
export function collectAssignedMediaIds(
  assetConfigOverride?: AssetConfig,
): Set<string> {
  const out = new Set<string>()
  collectStrings(assetConfigOverride ?? readAssetConfigFromStorage(), out)
  collectStrings(readLandingContentFromStorage(), out)
  collectStrings(readPdpContentFromStorage(), out)
  collectStrings(readPassportContentFromStorage(), out)
  collectStrings(readShopConfigFromStorage(), out)
  collectStrings(readComingSoonConfigFromStorage(), out)
  return out
}
