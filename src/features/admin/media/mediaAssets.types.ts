export type { MediaIndexEntry } from '@/features/cms/media/mediaIndex.types'

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

export type MediaAssetsListResult =
  | { ok: true; assets: CmsMediaAsset[] }
  | { ok: false; error: string }

export type MediaAssetMutationResult =
  | { ok: true; asset?: CmsMediaAsset }
  | { ok: false; error: string }
