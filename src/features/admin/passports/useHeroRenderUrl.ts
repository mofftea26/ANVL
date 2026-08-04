import { useMemo } from 'react'
import { mediaAssetPublicUrl } from '@/features/admin/media/mediaAssets.service'
import type { CmsMediaAsset } from '@/features/admin/media/mediaAssets.types'
import type { PassportProductContent } from '@/features/cms/passportContent/passportContent.zod'

/**
 * Resolve THE image every passport marker is pinned to.
 *
 * One hook, deliberately, because four editors (design details, blueprint,
 * specifications, fit) all place coordinates and every one of them must be
 * aiming at the identical picture — a marker at 42/18 means nothing if two
 * tabs disagree about what 42/18 is a percentage of.
 *
 * No fallback to the gallery or the product's catalogue images: the storefront
 * substitutes the owner's own colourway when `piece.heroRender` is blank, and
 * that image is unknowable at authoring time. Showing a stand-in here would
 * quietly place every coordinate against the wrong garment, so a blank render
 * is surfaced as a blocker instead (see `MarkerPlacerCanvas`).
 */
export function useHeroRenderUrl(
  content: PassportProductContent,
  mediaAssets: CmsMediaAsset[],
): string | null {
  const heroRenderId = content.piece.heroRender
  return useMemo(() => {
    const id = heroRenderId.trim()
    if (!id) return null
    const asset = mediaAssets.find((candidate) => candidate.id === id)
    return asset ? mediaAssetPublicUrl(asset) : null
  }, [heroRenderId, mediaAssets])
}
