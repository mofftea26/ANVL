import { z } from 'zod'

/**
 * Per-product PASSPORT content — the editorial layer of the /p/$token passport
 * experience, authored in the CMS passport wizard and keyed by product slug.
 * One object per passport SECTION (mirroring the wizard steps and the page's
 * bento cards), each carrying its own copy + asset references.
 *
 * Stored as a jsonb map `{ [slug]: PassportProductContent }`, mirroring
 * `pdp_content`: edited locally → `adminCmsRemoteSync` →
 * `cms_settings.passport_content` + `storefront_publication.passport_content`
 * → SSR. Every field has a `.catch` default; blank means "fall back to
 * pdp_content → the product's own field → code default".
 */

export const passportIdentitySectionSchema = z.object({
  /** Short line under the product name on the identity plate. */
  tagline: z.string().catch(''),
  /** Optional replacement for the "Verified authentic" line. */
  authenticityNote: z.string().catch(''),
})

export const passportPieceSectionSchema = z.object({
  /** Transparent-PNG render (media id) — feeds the particle forge silhouette. */
  heroRender: z.string().catch(''),
  /** Gallery media ids shown in the piece section. */
  gallery: z.array(z.string()).catch([]),
})

export const passportMaterialSectionSchema = z.object({
  title: z.string().catch(''),
  note: z.string().catch(''),
  /** Macro fabric shot (media id). */
  macroAsset: z.string().catch(''),
})

export const passportCareSectionSchema = z.object({
  intro: z.string().catch(''),
  steps: z.array(z.string()).catch([]),
  /** Optional care illustration (media id). */
  asset: z.string().catch(''),
})

export const passportDetailsSectionSchema = z.object({
  heading: z.string().catch(''),
  story: z.string().catch(''),
  facts: z.array(z.string()).catch([]),
  funFact: z.string().catch(''),
  /** Optional detail shot (media id). */
  asset: z.string().catch(''),
})

export const passportOriginSectionSchema = z.object({
  /** e.g. "Forged in Lebanon". */
  label: z.string().catch(''),
  /** e.g. the atelier city shown beside the map point. */
  place: z.string().catch(''),
  story: z.string().catch(''),
  /** Optional custom map/atelier image (media id) — blank uses the SVG map. */
  asset: z.string().catch(''),
})

export const passportProductContentSchema = z.object({
  identity: passportIdentitySectionSchema.catch({ tagline: '', authenticityNote: '' }),
  piece: passportPieceSectionSchema.catch({ heroRender: '', gallery: [] }),
  material: passportMaterialSectionSchema.catch({ title: '', note: '', macroAsset: '' }),
  care: passportCareSectionSchema.catch({ intro: '', steps: [], asset: '' }),
  details: passportDetailsSectionSchema.catch({
    heading: '',
    story: '',
    facts: [],
    funFact: '',
    asset: '',
  }),
  origin: passportOriginSectionSchema.catch({ label: '', place: '', story: '', asset: '' }),
})

export type PassportProductContent = z.infer<typeof passportProductContentSchema>

export const DEFAULT_PASSPORT_PRODUCT_CONTENT: PassportProductContent = {
  identity: { tagline: '', authenticityNote: '' },
  piece: { heroRender: '', gallery: [] },
  material: { title: '', note: '', macroAsset: '' },
  care: { intro: '', steps: [], asset: '' },
  details: { heading: '', story: '', facts: [], funFact: '', asset: '' },
  origin: { label: '', place: '', story: '', asset: '' },
}

export type PassportContentConfig = Record<string, PassportProductContent>

export const DEFAULT_PASSPORT_CONTENT: PassportContentConfig = {}

/** Parse any stored blob into a `{ [slug]: PassportProductContent }` map. */
export function parsePassportContent(raw: unknown): PassportContentConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: PassportContentConfig = {}
  for (const [slug, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!slug.trim()) continue
    const base =
      value && typeof value === 'object' && !Array.isArray(value)
        ? deepMergeDefaults(value as Record<string, unknown>)
        : DEFAULT_PASSPORT_PRODUCT_CONTENT
    out[slug] = passportProductContentSchema.parse(base)
  }
  return out
}

function deepMergeDefaults(value: Record<string, unknown>): PassportProductContent {
  const d = DEFAULT_PASSPORT_PRODUCT_CONTENT
  const section = (key: keyof PassportProductContent) => {
    const v = value[key]
    return v && typeof v === 'object' && !Array.isArray(v)
      ? { ...d[key], ...(v as object) }
      : { ...d[key] }
  }
  return {
    identity: section('identity'),
    piece: section('piece'),
    material: section('material'),
    care: section('care'),
    details: section('details'),
    origin: section('origin'),
  } as PassportProductContent
}

/** The authored passport content for one product slug, or empty defaults. */
export function getPassportProductContent(
  config: PassportContentConfig,
  slug: string,
): PassportProductContent {
  return config[slug] ?? structuredClone(DEFAULT_PASSPORT_PRODUCT_CONTENT)
}
