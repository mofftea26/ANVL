import { resolveMediaUrl } from '@/features/cms/assets/resolvePublishedAssets'
import type { MediaIndexEntry } from '@/features/cms/media/mediaIndex.types'
import {
  getPassportProductContent,
  type PassportContentConfig,
} from '@/features/cms/passportContent/passportContent.zod'
import type {
  ResolvedPdpCareItem,
  ResolvedPdpContent,
  ResolvedPdpMaterial,
} from '@/features/products/pdp/resolvePdpContent'
import type { Product } from '@/features/products/types/product.types'

/**
 * The passport page's render model, resolved once in the route loader.
 * Layering per field: CMS passport_content (the wizard) → pdp_content →
 * the product's own field → code default. Media ids resolve to URLs here so
 * components render pure data.
 */
export interface ResolvedPassportContent {
  identity: { tagline: string; authenticityNote: string }
  piece: {
    /** Transparent render URL feeding the particle forge (may be undefined). */
    heroRenderUrl?: string
    gallery: Array<{ src: string; alt: string }>
  }
  material: {
    title: string
    note: string
    macroUrl?: string
    /** Structured fabric cards (PDP bento shape) — empty when unauthored. */
    materials: ResolvedPdpMaterial[]
  }
  specs: {
    construction: string
    fitType: string
    compression: string
    stretch: string
    breathability: string
    intendedUse: string
    /** Authored readouts the Specifications effect pins to the render. */
    points: ResolvedPassportMarker[]
  }
  fit: {
    intendedFit: string
    /** Parsed "Chest|52 cm" lines. */
    measurements: Array<{ label: string; value: string }>
    stretchRange: string
    modelHeight: string
    modelSize: string
    sizeAdvice: string
    /** Authored measurement readouts the Fit effect pins to the render. */
    points: ResolvedPassportMarker[]
  }
  forgeNotes: Array<{ title: string; body: string }>
  /** Design-detail markers pinned to the render (x/y are % of the image box). */
  hotspots: Array<{ x: number; y: number; title: string; body: string }>
  blueprint: {
    heading: string
    intro: string
    /** Construction callouts, rendered as cards — no drawing, no coordinates. */
    features: Array<{ code: string; title: string; body: string }>
    /** Authored readouts the Blueprint hologram pins to the render. */
    points: ResolvedPassportMarker[]
  }
  care: {
    intro: string
    steps: string[]
    /** Legacy care-symbol preset keys (passport careSymbols.tsx). */
    symbols: string[]
    /** Structured care instructions (real care symbols) — empty when unauthored. */
    careItems: ResolvedPdpCareItem[]
    /** Optional per-step "why" note (index-aligned with `steps`). */
    notes: string[]
    assetUrl?: string
  }
  details: { heading: string; story: string; facts: string[]; funFact: string; assetUrl?: string }
  origin: {
    label: string
    place: string
    story: string
    assetUrl?: string
    /** Country preset keys for the world-map pins (passportCountries.ts). */
    madeIn: string
    designedIn: string
  }
}

/** A bad number must never park a marker off-image. */
function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value))
}

/** One authored readout pinned to the render (percent of the image box). */
export interface ResolvedPassportMarker {
  x: number
  y: number
  label: string
  value: string
}

/**
 * Clean the authored effect markers.
 *
 * A marker with neither a label nor a value says nothing, so it is dropped
 * rather than drawn as an empty plate — the same rule the hero hotspots use.
 * One of the two is enough: "A" alone is a legitimate construction callout,
 * and "52 cm" alone is a legitimate measurement.
 */
function resolveMarkers(
  markers: ReadonlyArray<{ x: number; y: number; label: string; value: string }>,
): ResolvedPassportMarker[] {
  return markers
    .map((m) => ({
      x: clampPercent(m.x),
      y: clampPercent(m.y),
      label: m.label.trim(),
      value: m.value.trim(),
    }))
    .filter((m) => m.label || m.value)
}

/** A blank techpack code still needs a legible mark — fall back to its letter. */
function markerCode(code: string, index: number): string {
  const trimmed = code.trim()
  if (trimmed) return trimmed
  return index < 26 ? String.fromCharCode(97 + index) : String(index + 1)
}

function firstNonEmpty(...vals: (string | undefined)[]): string {
  for (const v of vals) {
    const t = v?.trim()
    if (t) return t
  }
  return ''
}

export function resolvePassportContent(input: {
  product: Product | null
  passportContent: PassportContentConfig
  pdpContent: ResolvedPdpContent | null
  mediaIndex: MediaIndexEntry[]
  productSlug: string
}): ResolvedPassportContent {
  const { product, passportContent, pdpContent, mediaIndex, productSlug } = input
  const c = getPassportProductContent(passportContent, productSlug)

  const media = (id: string): string | undefined => resolveMediaUrl(id, mediaIndex) ?? undefined

  const gallery = c.piece.gallery
    .map((id) => media(id))
    .filter((src): src is string => Boolean(src))
    .map((src) => ({ src, alt: product?.name ?? 'Product view' }))

  const careSteps = (
    c.care.steps.length ? c.care.steps : (pdpContent?.care ?? product?.careInstructions ?? [])
  )
    .map((s) => s.trim())
    .filter(Boolean)

  const facts = (
    c.details.facts.length
      ? c.details.facts
      : (pdpContent?.designDetails ?? product?.designDetails ?? [])
  )
    .map((s) => s.trim())
    .filter(Boolean)

  // Structured fabric cards — authored passport materials win, else the PDP's.
  const structuredMaterials = c.material.materials.filter((m) => m.name.trim().length > 0)
  const materials: ResolvedPdpMaterial[] =
    structuredMaterials.length > 0
      ? structuredMaterials.map((m, i) => ({
          id: m.id.trim() || `passport-material-${i}`,
          name: m.name.trim(),
          percentage: m.percentage,
          gsm: m.gsm,
          image: media(m.image),
        }))
      : (pdpContent?.materials ?? [])

  // Structured care instructions — authored passport items win, else the PDP's.
  const structuredCareItems = c.care.careItems.filter((item) => item.name.trim().length > 0)
  const careItems: ResolvedPdpCareItem[] =
    structuredCareItems.length > 0
      ? structuredCareItems.map((item, i) => ({
          id: item.id.trim() || `passport-care-${i}`,
          icon: item.icon,
          name: item.name.trim(),
          value: item.value.trim(),
          note: item.note.trim(),
        }))
      : (pdpContent?.careItems ?? [])

  return {
    identity: {
      tagline: c.identity.tagline.trim(),
      authenticityNote: c.identity.authenticityNote.trim(),
    },
    piece: {
      heroRenderUrl: media(c.piece.heroRender),
      gallery: gallery.length
        ? gallery
        : (product?.images ?? []).map((img) => ({ src: img.src, alt: img.alt })),
    },
    material: {
      title: firstNonEmpty(c.material.title, pdpContent?.materialTitle, product?.fabric),
      note: firstNonEmpty(c.material.note, pdpContent?.materialNote, product?.gsm),
      macroUrl: media(c.material.macroAsset) ?? pdpContent?.materialMacro,
      materials,
    },
    specs: {
      construction: c.specs.construction.trim(),
      fitType: firstNonEmpty(c.specs.fitType, product?.fit),
      compression: c.specs.compression.trim(),
      stretch: c.specs.stretch.trim(),
      breathability: c.specs.breathability.trim(),
      intendedUse: c.specs.intendedUse.trim(),
      points: resolveMarkers(c.specs.points),
    },
    fit: {
      intendedFit: firstNonEmpty(c.fit.intendedFit, product?.fit),
      measurements: c.fit.measurements
        .map((line) => {
          const [label, ...rest] = line.split('|')
          return { label: (label ?? '').trim(), value: rest.join('|').trim() }
        })
        .filter((m) => m.label && m.value),
      stretchRange: c.fit.stretchRange.trim(),
      modelHeight: c.fit.modelHeight.trim(),
      modelSize: c.fit.modelSize.trim(),
      sizeAdvice: c.fit.sizeAdvice.trim(),
      points: resolveMarkers(c.fit.points),
    },
    forgeNotes: c.forgeNotes
      .map((n) => ({ title: n.title.trim(), body: n.body.trim() }))
      .filter((n) => n.title || n.body),
    hotspots: c.hotspots
      .map((h) => ({
        x: clampPercent(h.x),
        y: clampPercent(h.y),
        title: h.title.trim(),
        body: h.body.trim(),
      }))
      .filter((h) => h.title),
    blueprint: {
      heading: firstNonEmpty(c.blueprint.heading, 'Blueprint'),
      intro: c.blueprint.intro.trim(),
      // The title is the card — a callout without one has nothing to say.
      features: c.blueprint.features
        .map((f, i) => ({
          code: markerCode(f.code, i),
          title: f.title.trim(),
          body: f.body.trim(),
        }))
        .filter((f) => f.title),
      points: resolveMarkers(c.blueprint.points),
    },
    care: {
      intro: c.care.intro.trim(),
      steps: careSteps,
      symbols: c.care.symbols.map((s) => s.trim()).filter(Boolean),
      careItems,
      notes: c.care.notes.map((n) => n.trim()),
      assetUrl: media(c.care.asset),
    },
    details: {
      heading: firstNonEmpty(c.details.heading, pdpContent?.storyHeading, 'Forged details'),
      story: firstNonEmpty(c.details.story, pdpContent?.storyBody, product?.storytelling),
      facts,
      funFact: c.details.funFact.trim(),
      assetUrl: media(c.details.asset) ?? pdpContent?.lifestyleImage,
    },
    origin: {
      label: firstNonEmpty(c.origin.label, 'Forged in Lebanon'),
      place: c.origin.place.trim(),
      story: c.origin.story.trim(),
      assetUrl: media(c.origin.asset),
      madeIn: firstNonEmpty(c.origin.madeIn, 'lebanon'),
      designedIn: firstNonEmpty(c.origin.designedIn, 'lebanon'),
    },
  }
}
