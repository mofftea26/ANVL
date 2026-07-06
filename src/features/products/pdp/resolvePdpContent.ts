import type { MediaIndexEntry } from '@/features/cms/media/mediaIndex.types'
import { resolveMediaUrl } from '@/features/cms/assets/resolvePublishedAssets'
import type { ResolvedPageAssets } from '@/features/cms/assets/resolvePublishedAssets'
import {
  getPdpProductContent,
  type PdpContentConfig,
} from '@/features/cms/pdpContent/pdpContent.zod'
import type { Product } from '@/features/products/types/product.types'

/**
 * The PDP editorial content actually rendered, after layering: per-product CMS
 * content → the product's own field (Shopify/seed) → the global `pages.pdp`
 * asset slot → a code default. Built once in the route loader and passed down so
 * the bento renders pure data.
 */
export type ResolvedPdpContent = {
  storyHeading: string
  storyBody: string
  materialTitle: string
  materialNote: string
  care: string[]
  designDetails: string[]
  materialMacro?: string
  lifestyleImage?: string
  ambientBackdrop?: string
  sizeGuideDiagram?: string
}

function firstNonEmpty(...vals: (string | undefined)[]): string {
  for (const v of vals) {
    const t = v?.trim()
    if (t) return t
  }
  return ''
}

/**
 * Resolve a product's PDP editorial content. Per-product CMS copy wins, then the
 * product's own field; per-product CMS media wins, then the global pdp slot.
 */
export function resolvePdpContent(input: {
  product: Product
  pdpContent: PdpContentConfig
  globalAssets: ResolvedPageAssets
  mediaIndex: MediaIndexEntry[]
}): ResolvedPdpContent {
  const { product, pdpContent, globalAssets, mediaIndex } = input
  const c = getPdpProductContent(pdpContent, product.slug)

  const media = (id: string, fallback?: string) =>
    resolveMediaUrl(id, mediaIndex) ?? (fallback?.trim() || undefined)

  const care = c.care.map((s) => s.trim()).filter(Boolean)
  const designDetails = c.designDetails.map((s) => s.trim()).filter(Boolean)

  return {
    storyHeading: firstNonEmpty(c.storyHeading, 'The piece'),
    storyBody: firstNonEmpty(c.storyBody, product.storytelling),
    materialTitle: firstNonEmpty(c.materialTitle, product.fabric),
    materialNote: firstNonEmpty(c.materialNote, product.gsm),
    care: care.length > 0 ? care : product.careInstructions,
    designDetails: designDetails.length > 0 ? designDetails : product.designDetails,
    materialMacro: media(c.materialMacro, globalAssets.materialMacro),
    lifestyleImage: media(c.lifestyleImage, globalAssets.lifestyleImage),
    ambientBackdrop: media(c.ambientBackdrop, globalAssets.ambientBackdrop),
    sizeGuideDiagram: media(c.sizeGuideDiagram, globalAssets.sizeGuideDiagram),
  }
}
