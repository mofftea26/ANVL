import type { MediaIndexEntry } from '@/features/cms/media/mediaIndex.types'
import { resolveMediaUrl } from '@/features/cms/assets/resolvePublishedAssets'
import type { ResolvedPageAssets } from '@/features/cms/assets/resolvePublishedAssets'
import type { CareIconKey } from '@/features/cms/support/supportContent.zod'
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
 *
 * Structured-first, legacy fallback (mirrors `resolveCareItems` in the support
 * feature): the card lists (`materials`/`careItems`/`details`) prefer the
 * authored structured entries and otherwise derive cards from the legacy flat
 * fields / the product's own data, so old blobs keep rendering. The flat
 * fields (`care`, `designDetails`, `materialTitle`, …) stay populated for
 * downstream consumers (the passport resolver layers on top of them).
 */

/** One material bento card, render-ready. */
export type ResolvedPdpMaterial = {
  id: string
  name: string
  /** Composition share 0–100, or null when unspecified (legacy cards). */
  percentage: number | null
  /** Fabric weight in g/m², or null when unspecified. */
  gsm: number | null
  /** Legacy free-text note (materialNote / product gsm copy) — structured cards omit it. */
  note?: string
  image?: string
}

/** One care bento card, render-ready — same shape as the support resolver's items. */
export type ResolvedPdpCareItem = {
  id: string
  icon: CareIconKey
  name: string
  value: string
  note: string
}

/** One forged-detail bento card, render-ready. */
export type ResolvedPdpDetail = {
  id: string
  title: string
  description: string
  image?: string
}

export type ResolvedPdpContent = {
  storyHeading: string
  storyBody: string
  materialTitle: string
  materialNote: string
  care: string[]
  designDetails: string[]
  materials: ResolvedPdpMaterial[]
  careItems: ResolvedPdpCareItem[]
  /** True when structured care was authored in `pdp_content` (wins over the support blob). */
  careAuthored: boolean
  details: ResolvedPdpDetail[]
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

/** Map free-text lines to generic care cards (legacy + product fallback path). */
function linesToCareItems(lines: string[]): ResolvedPdpCareItem[] {
  return lines.map((line, index) => ({
    id: `pdp-care-line-${index}`,
    icon: 'generic' as const,
    name: line,
    value: '',
    note: '',
  }))
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

  const legacyCare = c.care.map((s) => s.trim()).filter(Boolean)
  const legacyDetails = c.designDetails.map((s) => s.trim()).filter(Boolean)

  const materialTitle = firstNonEmpty(c.materialTitle, product.fabric)
  const materialNote = firstNonEmpty(c.materialNote, product.gsm)
  const materialMacro = media(c.materialMacro, globalAssets.materialMacro)

  // Materials — structured entries win; else one card from the legacy headline.
  const structuredMaterials = c.materials.filter((m) => m.name.trim().length > 0)
  const materials: ResolvedPdpMaterial[] =
    structuredMaterials.length > 0
      ? structuredMaterials.map((m, i) => ({
          id: m.id.trim() || `pdp-material-${i}`,
          name: m.name.trim(),
          percentage: m.percentage,
          gsm: m.gsm,
          image: media(m.image),
        }))
      : materialTitle || materialNote
        ? [
            {
              id: 'pdp-material-legacy',
              name: materialTitle || 'Premium fabric',
              percentage: null,
              gsm: null,
              note: materialNote || undefined,
              image: materialMacro,
            },
          ]
        : []

  // Care — structured pdp items win; else legacy lines; else the product's own.
  const structuredCare = c.careItems.filter((item) => item.name.trim().length > 0)
  const careAuthored = structuredCare.length > 0
  const careLines = legacyCare.length > 0 ? legacyCare : product.careInstructions
  const careItems: ResolvedPdpCareItem[] = careAuthored
    ? structuredCare.map((item, index) => ({
        id: item.id.trim() || `pdp-care-item-${index}`,
        icon: item.icon,
        name: item.name.trim(),
        value: item.value.trim(),
        note: item.note.trim(),
      }))
    : linesToCareItems(careLines)

  // Details — structured entries win; else legacy lines; else the product's own.
  const structuredDetails = c.details.filter((d) => d.title.trim().length > 0)
  const detailLines = legacyDetails.length > 0 ? legacyDetails : product.designDetails
  const details: ResolvedPdpDetail[] =
    structuredDetails.length > 0
      ? structuredDetails.map((d, i) => ({
          id: d.id.trim() || `pdp-detail-${i}`,
          title: d.title.trim(),
          description: d.description.trim(),
          image: media(d.image),
        }))
      : detailLines.map((line, i) => ({ id: `pdp-detail-line-${i}`, title: line, description: '' }))

  // Flat legacy views stay populated for downstream consumers (passport
  // resolver, JSON-LD): structured entries flatten back to strings.
  const care = careAuthored
    ? careItems.map((item) => (item.value ? `${item.name} — ${item.value}` : item.name))
    : careLines
  const designDetails =
    structuredDetails.length > 0 ? details.map((d) => d.title) : detailLines

  return {
    storyHeading: firstNonEmpty(c.storyHeading, 'The piece'),
    storyBody: firstNonEmpty(c.storyBody, product.storytelling),
    materialTitle,
    materialNote,
    care,
    designDetails,
    materials,
    careItems,
    careAuthored,
    details,
    materialMacro,
    lifestyleImage: media(c.lifestyleImage, globalAssets.lifestyleImage),
    ambientBackdrop: media(c.ambientBackdrop, globalAssets.ambientBackdrop),
    sizeGuideDiagram: media(c.sizeGuideDiagram, globalAssets.sizeGuideDiagram),
  }
}
