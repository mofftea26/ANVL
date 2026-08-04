import { z } from 'zod'
import { careItemSchema } from '@/features/cms/support/supportContent.zod'
import { pdpMaterialSchema } from '@/features/cms/pdpContent/pdpContent.zod'

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
  /**
   * Structured fabric composition (name + % + gsm + image) — the same shape
   * the PDP authors, rendered as bento cards. Preferred at resolve time when
   * non-empty; the legacy `title`/`note` are kept for backward compatibility.
   */
  materials: z.array(pdpMaterialSchema).catch([]),
})

export const passportCareSectionSchema = z.object({
  intro: z.string().catch(''),
  steps: z.array(z.string()).catch([]),
  /** Optional care illustration (media id). */
  asset: z.string().catch(''),
  /** Legacy care-symbol preset keys (passport careSymbols.tsx) — kept forever;
   * superseded by `careItems` for new authoring. */
  symbols: z.array(z.string()).catch([]),
  /** Longer "why" notes shown when a care step is expanded. */
  notes: z.array(z.string()).catch([]),
  /**
   * Structured care instructions authored with the SHARED CareSelector (same
   * as the PDP): icon + name + optional value + note. Preferred at resolve
   * time when non-empty; renders the real textile care symbols.
   */
  careItems: z.array(careItemSchema).catch([]),
})

/** Technical specifications — the CRAFT tab's data panel. */
/**
 * One readout pinned to the product render, for the section EFFECTS.
 *
 * Blueprint, Specifications and Fit each draw short label/value readouts over
 * the piece. Those were briefly derived from the section cards and positioned
 * by sampling the garment's silhouette — accurate, but nobody chose where they
 * landed. These are authored instead: click the render in the CMS, name the
 * point, give it a value. Same percent-of-image-box convention the hero
 * hotspots use, so a marker holds its spot at any display size.
 *
 * `x`/`y` are percentages of `piece.heroRender` — the image the storefront
 * stages and the ONLY image the admin placer will draw on. Not of a per-section
 * picture: there is none, deliberately. A second, cropped technical flat lifted
 * out of a supplier techpack was removed on 2026-07-30 because a coordinate
 * measured against a page crop was never better than the crop.
 *
 * Deliberately one shape for all three sections — a construction callout, a
 * spec and a measurement are the same thing here (a labelled fact at a place
 * on the garment), and one schema means one placer component in the admin
 * (`SectionMarkersField`, rendered inside each of the three tabs).
 */
export const passportMarkerSchema = z.object({
  x: z.number().min(0).max(100).catch(50),
  y: z.number().min(0).max(100).catch(50),
  /** e.g. "Chest", "Flatlock", "A". */
  label: z.string().catch(''),
  /** e.g. "52 cm", "6-thread", "260 GSM". */
  value: z.string().catch(''),
})

export const passportSpecsSectionSchema = z.object({
  construction: z.string().catch(''),
  fitType: z.string().catch(''),
  compression: z.string().catch(''),
  stretch: z.string().catch(''),
  breathability: z.string().catch(''),
  intendedUse: z.string().catch(''),
  /** Readouts pinned to the render for the Specifications effect. */
  points: z.array(passportMarkerSchema).catch([]),
})

/** Fit & sizing — measurements + the canonical size map that drives advice. */
export const passportFitSectionSchema = z.object({
  intendedFit: z.string().catch(''),
  /** "Chest|52 cm" per line — parsed into label/value pairs. */
  measurements: z.array(z.string()).catch([]),
  stretchRange: z.string().catch(''),
  modelHeight: z.string().catch(''),
  modelSize: z.string().catch(''),
  /** Free advice, e.g. "Size down for a compressive fit." */
  sizeAdvice: z.string().catch(''),
  /**
   * Measurement readouts pinned to the render for the Fit effect — authored by
   * clicking where the measurement is taken (chest, waist, hem…) and typing
   * its value. Independent of `measurements` above: that list is the card's
   * table, this one is what the tape bands say on the garment.
   */
  points: z.array(passportMarkerSchema).catch([]),
  /**
   * This product's size → a CANONICAL body size (S/M/L/XL…). Two products
   * that fit the same body share a canonical value, which is what lets the
   * passport translate a registered size into other pieces. Kept per-product
   * in the CMS so a cut that runs big can be mapped honestly.
   */
  sizeEquivalence: z.record(z.string(), z.string()).catch({}),
})

/** A single Forge Note — a development fact card. */
export const passportForgeNoteSchema = z.object({
  title: z.string().catch(''),
  body: z.string().catch(''),
})

/**
 * A design-detail hotspot pinned to the product render. `x`/`y` are PERCENT
 * of the rendered image box (0–100), authored by clicking the render in the
 * CMS — percentages so a marker holds its spot at any display size.
 */
export const passportHotspotSchema = z.object({
  x: z.number().min(0).max(100).catch(50),
  y: z.number().min(0).max(100).catch(50),
  title: z.string().catch(''),
  body: z.string().catch(''),
})

/**
 * One lettered construction callout from the techpack's BASIC SPECS page.
 *
 * Text only, deliberately. This used to carry a list of `positions` pinned to
 * an extracted supplier drawing; that drawing was a page crop with residual
 * artefacts, and coordinates measured against it could only ever be as good as
 * the crop. The callouts are now rendered as cards, so the construction facts
 * survive and nothing pretends to a precision it never had.
 */
export const passportBlueprintFeatureSchema = z.object({
  /** The marker letter as printed on the techpack, e.g. 'a'. */
  code: z.string().catch(''),
  title: z.string().catch(''),
  body: z.string().catch(''),
})

export type PassportBlueprintFeature = z.infer<typeof passportBlueprintFeatureSchema>

/** The construction callouts, rendered as a card grid. */
export const passportBlueprintSectionSchema = z.object({
  heading: z.string().catch(''),
  intro: z.string().catch(''),
  features: z.array(passportBlueprintFeatureSchema).catch([]),
  /** Readouts pinned to the render for the Blueprint hologram's spec tags. */
  points: z.array(passportMarkerSchema).catch([]),
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
  /** Country preset keys (passportCountries.ts) — pins on the world map. */
  madeIn: z.string().catch(''),
  designedIn: z.string().catch(''),
})

export const passportProductContentSchema = z.object({
  identity: passportIdentitySectionSchema.catch({ tagline: '', authenticityNote: '' }),
  piece: passportPieceSectionSchema.catch({ heroRender: '', gallery: [] }),
  material: passportMaterialSectionSchema.catch({
    title: '',
    note: '',
    macroAsset: '',
    materials: [],
  }),
  specs: passportSpecsSectionSchema.catch({
    construction: '',
    fitType: '',
    compression: '',
    stretch: '',
    breathability: '',
    intendedUse: '',
    points: [],
  }),
  fit: passportFitSectionSchema.catch({
    intendedFit: '',
    measurements: [],
    stretchRange: '',
    modelHeight: '',
    modelSize: '',
    sizeAdvice: '',
    sizeEquivalence: {},
    points: [],
  }),
  forgeNotes: z.array(passportForgeNoteSchema).catch([]),
  hotspots: z.array(passportHotspotSchema).catch([]),
  blueprint: passportBlueprintSectionSchema.catch({
    heading: '',
    intro: '',
    features: [],
    points: [],
  }),
  care: passportCareSectionSchema.catch({
    intro: '',
    steps: [],
    asset: '',
    symbols: [],
    notes: [],
    careItems: [],
  }),
  details: passportDetailsSectionSchema.catch({
    heading: '',
    story: '',
    facts: [],
    funFact: '',
    asset: '',
  }),
  origin: passportOriginSectionSchema.catch({
    label: '',
    place: '',
    story: '',
    asset: '',
    madeIn: '',
    designedIn: '',
  }),
})

export type PassportProductContent = z.infer<typeof passportProductContentSchema>

export const DEFAULT_PASSPORT_PRODUCT_CONTENT: PassportProductContent = {
  identity: { tagline: '', authenticityNote: '' },
  piece: { heroRender: '', gallery: [] },
  material: { title: '', note: '', macroAsset: '', materials: [] },
  specs: {
    construction: '',
    fitType: '',
    compression: '',
    stretch: '',
    breathability: '',
    intendedUse: '',
    points: [],
  },
  fit: {
    intendedFit: '',
    measurements: [],
    stretchRange: '',
    modelHeight: '',
    modelSize: '',
    sizeAdvice: '',
    sizeEquivalence: {},
    points: [],
  },
  forgeNotes: [],
  hotspots: [],
  blueprint: { heading: '', intro: '', features: [], points: [] },
  care: { intro: '', steps: [], asset: '', symbols: [], notes: [], careItems: [] },
  details: { heading: '', story: '', facts: [], funFact: '', asset: '' },
  origin: { label: '', place: '', story: '', asset: '', madeIn: '', designedIn: '' },
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

/**
 * Fill missing keys from the defaults so a blob authored before a section
 * existed still parses (every section is object-shaped except `forgeNotes`
 * and `hotspots`, which are lists).
 *
 * EVERY schema key must appear below. This literal — not the schema — decides
 * what survives a save (`writePassportContentToStorage` parses through here),
 * so a key added to the schema and forgotten here typechecks and then silently
 * drops that section's data on the next save.
 */
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
    specs: section('specs'),
    fit: section('fit'),
    forgeNotes: Array.isArray(value.forgeNotes) ? value.forgeNotes : [],
    hotspots: Array.isArray(value.hotspots) ? value.hotspots : [],
    // Object-shaped like the rest — its nested `features` list rides along on
    // the shallow spread, exactly as `care.steps` / `material.materials` do.
    blueprint: section('blueprint'),
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
