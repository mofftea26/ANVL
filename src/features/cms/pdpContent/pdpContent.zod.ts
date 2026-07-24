import { z } from 'zod'
import { careItemSchema } from '@/features/cms/support/supportContent.zod'

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
 *
 * Two authoring generations coexist (ADDITIVE — old blobs stay valid, same
 * convention as `support_content`):
 * - legacy free text: `materialTitle`/`materialNote`, `care: string[]`,
 *   `designDetails: string[]` — kept forever for backward compat
 * - structured lists: `materials` (name + % + gsm + image), `careItems`
 *   (shared {@link careItemSchema} vocabulary — same shape the support care
 *   guide stores), `details` (title + description + image)
 * `resolvePdpContent` prefers the structured fields when any are authored and
 * maps legacy text at resolve time — stored blobs are never mutated.
 */

/** One fabric/composition entry — a bento card on the storefront PDP. */
export const pdpMaterialSchema = z.object({
  id: z.string().catch(''),
  name: z.string().catch(''),
  /** Composition share 0–100 (null = unspecified). */
  percentage: z.number().min(0).max(100).nullable().catch(null),
  /** Fabric weight in g/m² (null = unspecified). */
  gsm: z.number().positive().nullable().catch(null),
  /** CMS media id — optional card backdrop, resolved to a URL on the storefront. */
  image: z.string().catch(''),
})
export type PdpMaterial = z.infer<typeof pdpMaterialSchema>

/** One forged-detail entry — a bento card on the storefront PDP. */
export const pdpDetailSchema = z.object({
  id: z.string().catch(''),
  title: z.string().catch(''),
  description: z.string().catch(''),
  /** CMS media id — optional card image, resolved to a URL on the storefront. */
  image: z.string().catch(''),
})
export type PdpDetail = z.infer<typeof pdpDetailSchema>

export const pdpProductContentSchema = z.object({
  // Copy (blank → falls back to the product's own field).
  storyHeading: z.string().catch(''),
  storyBody: z.string().catch(''),
  /** Legacy single-material headline — superseded by `materials`, kept forever. */
  materialTitle: z.string().catch(''),
  /** Legacy material note (e.g. "240 GSM") — superseded by `materials`, kept forever. */
  materialNote: z.string().catch(''),
  /** Legacy free-text care lines — superseded by `careItems`, kept forever. */
  care: z.array(z.string()).catch([]),
  /** Legacy free-text detail lines — superseded by `details`, kept forever. */
  designDetails: z.array(z.string()).catch([]),
  // Structured lists — preferred at resolve time when non-empty.
  materials: z.array(pdpMaterialSchema).catch([]),
  careItems: z.array(careItemSchema).catch([]),
  details: z.array(pdpDetailSchema).catch([]),
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
  materials: [],
  careItems: [],
  details: [],
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

/**
 * True when a slug carries any authored editorial content — powers the
 * "authored" indicator in the admin product picker.
 */
export function hasAuthoredPdpContent(entry: PdpProductContent | undefined): boolean {
  if (!entry) return false
  const strings = [
    entry.storyHeading,
    entry.storyBody,
    entry.materialTitle,
    entry.materialNote,
    entry.materialMacro,
    entry.lifestyleImage,
    entry.ambientBackdrop,
    entry.sizeGuideDiagram,
  ]
  if (strings.some((s) => s.trim().length > 0)) return true
  if (entry.care.some((s) => s.trim().length > 0)) return true
  if (entry.designDetails.some((s) => s.trim().length > 0)) return true
  if (entry.materials.some((m) => m.name.trim().length > 0)) return true
  if (entry.careItems.some((i) => i.name.trim().length > 0)) return true
  return entry.details.some((d) => d.title.trim().length > 0)
}
