import type { MediaIndexEntry } from '@/features/cms/media/mediaIndex.types'
import { publicCmsMediaUrl } from '@/features/cms/media/mediaUrl'
import type { AssetConfig } from '@/features/cms/config/cmsSiteConfig.zod'
import { getPassthroughSlotKeys } from '@/features/landingPages/assetSlots'
import { getStorefrontPagePassthroughKeys } from '@/features/cms/assets/storefrontPageSlots'

export type ResolvedDropAssets = Record<string, string | undefined>

/** Resolved slot map for a storefront (non-landing) page. */
export type ResolvedPageAssets = Record<string, string | undefined>

function resolveMediaId(
  mediaId: string | undefined,
  mediaIndex: MediaIndexEntry[],
): string | undefined {
  if (!mediaId?.trim()) return undefined
  const entry = mediaIndex.find((m) => m.id === mediaId)
  const objectPath = entry?.path?.trim()
  if (!objectPath) return undefined
  const url = publicCmsMediaUrl(objectPath)
  if (url) return url
  return objectPath.startsWith('/') ? objectPath : `/${objectPath}`
}

/** Public: resolve a single CMS media id to its public URL (or undefined). */
export function resolveMediaUrl(
  mediaId: string | undefined,
  mediaIndex: MediaIndexEntry[],
): string | undefined {
  return resolveMediaId(mediaId, mediaIndex)
}

export function resolvePublishedAssets(
  assetConfig: AssetConfig,
  activeDropKey: string,
  mediaIndex: MediaIndexEntry[],
): ResolvedDropAssets {
  const merged: Record<string, string> = {
    ...assetConfig.general,
    ...(assetConfig.drops[activeDropKey] ?? {}),
  }
  const passthroughKeys = getPassthroughSlotKeys(activeDropKey)
  const out: ResolvedDropAssets = {}
  for (const [slot, mediaId] of Object.entries(merged)) {
    if (passthroughKeys.has(slot)) {
      out[slot] = mediaId?.trim() || undefined
      continue
    }
    out[slot] = resolveMediaId(mediaId, mediaIndex)
  }
  return out
}

/**
 * Resolve the assigned assets for a storefront (non-landing) page. Merges the
 * site-wide `general` slots with the page's own `pages[pageKey]` assignments and
 * resolves each media id to a public URL (passthrough slots keep their raw
 * string). Unassigned slots are simply absent — callers fall back to code
 * defaults.
 */
export function resolveStorefrontPageAssets(
  assetConfig: AssetConfig,
  pageKey: string,
  mediaIndex: MediaIndexEntry[],
): ResolvedPageAssets {
  const merged: Record<string, string> = {
    ...assetConfig.general,
    ...(assetConfig.pages?.[pageKey] ?? {}),
  }
  const passthroughKeys = getStorefrontPagePassthroughKeys(pageKey)
  const out: ResolvedPageAssets = {}
  for (const [slot, mediaId] of Object.entries(merged)) {
    if (passthroughKeys.has(slot)) {
      out[slot] = mediaId?.trim() || undefined
      continue
    }
    out[slot] = resolveMediaId(mediaId, mediaIndex)
  }
  return out
}
