import type { MediaIndexEntry } from '@/features/admin/media/mediaAssets.types'
import { publicCmsMediaUrl } from '@/features/admin/cmsRemote/uploadCmsMedia'
import type { AssetConfig } from '@/features/cms/config/cmsSiteConfig.zod'

export type ResolvedDropAssets = Record<string, string | undefined>

function resolveMediaId(
  mediaId: string | undefined,
  mediaIndex: MediaIndexEntry[],
): string | undefined {
  if (!mediaId?.trim()) return undefined
  const entry = mediaIndex.find((m) => m.id === mediaId)
  if (!entry) return undefined
  const url = publicCmsMediaUrl(entry.path)
  if (url) return url
  return entry.path.startsWith('/') ? entry.path : `/${entry.path}`
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
  const out: ResolvedDropAssets = {}
  for (const [slot, mediaId] of Object.entries(merged)) {
    out[slot] = resolveMediaId(mediaId, mediaIndex)
  }
  return out
}
