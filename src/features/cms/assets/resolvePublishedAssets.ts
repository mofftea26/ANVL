import type { MediaIndexEntry } from '@/features/admin/media/mediaAssets.types'
import { publicCmsMediaUrl } from '@/features/admin/cmsRemote/uploadCmsMedia'
import type { AssetConfig } from '@/features/cms/config/cmsSiteConfig.zod'
import { getPassthroughSlotKeys } from '@/features/landingPages/assetSlots'

export type ResolvedDropAssets = Record<string, string | undefined>

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
