/** Row shape for `public.cms_media_assets`. */
export type CmsMediaAsset = {
  id: string
  storagePath: string
  filename: string
  alt: string
  mime: string
  byteSize: number
  width: number | null
  height: number | null
  tags: string[]
  createdAt: string
  createdBy: string | null
}

/** Lightweight catalog entry synced to `storefront_publication.media_index`. */
export type MediaIndexEntry = {
  id: string
  path: string
  alt: string
  mime: string
  w: number | null
  h: number | null
  updatedAt: string
}

export type MediaAssetsListResult =
  | { ok: true; assets: CmsMediaAsset[] }
  | { ok: false; error: string }

export type MediaAssetMutationResult =
  | { ok: true; asset?: CmsMediaAsset }
  | { ok: false; error: string }
