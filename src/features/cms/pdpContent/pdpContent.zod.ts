import { z } from 'zod'

/**
 * Per-product PDP editorial content — the non-commerce parts of the product
 * detail page (the bento story/material/care/details + the per-product editorial
 * assets), authored in the CMS and keyed by product slug. Commerce data
 * (name/price/variants/images) stays on the product itself (Shopify later); this
 * blob only overrides/supplies the editorial layer.
 *
 * Stored as a jsonb map `{ [slug]: PdpProductContent }`, mirroring how
 * `landing_content` flows: edited locally → `adminCmsRemoteSync` →
 * `cms_settings.pdp_content` + `storefront_publication.pdp_content` → SSR. Every
 * field carries a `.catch` default so partial/legacy blobs never crash a render;
 * blank fields mean "fall back to the product field / global slot / code default".
 */

export const pdpProductContentSchema = z.object({
  // Copy (blank → falls back to the product's own field).
  storyHeading: z.string().catch(''),
  storyBody: z.string().catch(''),
  materialTitle: z.string().catch(''),
  materialNote: z.string().catch(''),
  care: z.array(z.string()).catch([]),
  designDetails: z.array(z.string()).catch([]),
  // Asset references — CMS media ids, resolved to URLs on the storefront. Blank →
  // falls back to the global `pages.pdp` asset slot (then a CSS/text fallback).
  materialMacro: z.string().catch(''),
  lifestyleImage: z.string().catch(''),
  ambientBackdrop: z.string().catch(''),
  sizeGuideDiagram: z.string().catch(''),
})

export type PdpProductContent = z.infer<typeof pdpProductContentSchema>

export const DEFAULT_PDP_PRODUCT_CONTENT: PdpProductContent = {
  storyHeading: '',
  storyBody: '',
  materialTitle: '',
  materialNote: '',
  care: [],
  designDetails: [],
  materialMacro: '',
  lifestyleImage: '',
  ambientBackdrop: '',
  sizeGuideDiagram: '',
}

export type PdpContentConfig = Record<string, PdpProductContent>

export const DEFAULT_PDP_CONTENT: PdpContentConfig = {}

/** Parse any stored blob into a `{ [slug]: PdpProductContent }` map. */
export function parsePdpContent(raw: unknown): PdpContentConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: PdpContentConfig = {}
  for (const [slug, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!slug.trim()) continue
    const base =
      value && typeof value === 'object' && !Array.isArray(value)
        ? { ...DEFAULT_PDP_PRODUCT_CONTENT, ...(value as object) }
        : { ...DEFAULT_PDP_PRODUCT_CONTENT }
    out[slug] = pdpProductContentSchema.parse(base)
  }
  return out
}

/** The authored content for one product slug, or empty defaults. */
export function getPdpProductContent(config: PdpContentConfig, slug: string): PdpProductContent {
  return config[slug] ?? { ...DEFAULT_PDP_PRODUCT_CONTENT }
}
