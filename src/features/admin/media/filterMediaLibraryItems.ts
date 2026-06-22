import type { MediaPickerKind } from '@/shared/components/ui/MediaPickerField'
import { filterMediaAssets } from './mediaAssets.service'
import type { CmsMediaAsset } from './mediaAssets.types'

export type MediaLibraryMimeFilter = 'all' | 'image' | 'video'

export const MEDIA_LIBRARY_MIME_FILTERS: ReadonlyArray<{
  id: MediaLibraryMimeFilter
  label: string
}> = [
  { id: 'all', label: 'All' },
  { id: 'image', label: 'Images' },
  { id: 'video', label: 'Video' },
]

function matchesKind(mime: string, kind: MediaPickerKind): boolean {
  if (kind === 'image') return mime.startsWith('image/')
  if (kind === 'video') return mime.startsWith('video/')
  return mime.startsWith('image/') || mime.startsWith('video/')
}

/** Which mime filter chips are shown for a slot-level kind restriction. */
export function mediaLibraryMimeFiltersForKind(
  kind: MediaPickerKind,
): ReadonlyArray<(typeof MEDIA_LIBRARY_MIME_FILTERS)[number]> {
  if (kind === 'image') {
    return MEDIA_LIBRARY_MIME_FILTERS.filter((f) => f.id === 'image')
  }
  if (kind === 'video') {
    return MEDIA_LIBRARY_MIME_FILTERS.filter((f) => f.id === 'video')
  }
  return MEDIA_LIBRARY_MIME_FILTERS
}

/**
 * Search + type filter for the media library picker modal.
 * When `kind` is image/video, results are restricted regardless of `mimeFilter`.
 */
export function filterMediaLibraryItems(
  assets: CmsMediaAsset[],
  search: string,
  mimeFilter: MediaLibraryMimeFilter,
  kind: MediaPickerKind = 'any',
): CmsMediaAsset[] {
  const effectiveMime =
    kind === 'image' ? 'image' : kind === 'video' ? 'video' : mimeFilter
  return filterMediaAssets(assets, search, effectiveMime).filter((asset) =>
    matchesKind(asset.mime, kind),
  )
}

export type MediaLibraryPick = {
  id: string
  publicUrl: string
  filename: string
}
