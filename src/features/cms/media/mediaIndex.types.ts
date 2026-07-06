/**
 * Lightweight catalog entry synced to `storefront_publication.media_index`.
 * Storefront-safe — describes published media, not admin CRUD state (that
 * lives in `CmsMediaAsset`, `features/admin/media/mediaAssets.types.ts`).
 */
export type MediaIndexEntry = {
  id: string
  path: string
  alt: string
  mime: string
  w: number | null
  h: number | null
  updatedAt: string
}
