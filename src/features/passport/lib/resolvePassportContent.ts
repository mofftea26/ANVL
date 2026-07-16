import { resolveMediaUrl } from '@/features/cms/assets/resolvePublishedAssets'
import type { MediaIndexEntry } from '@/features/cms/media/mediaIndex.types'
import {
  getPassportProductContent,
  type PassportContentConfig,
} from '@/features/cms/passportContent/passportContent.zod'
import type { ResolvedPdpContent } from '@/features/products/pdp/resolvePdpContent'
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
  material: { title: string; note: string; macroUrl?: string }
  specs: {
    construction: string
    fitType: string
    compression: string
    stretch: string
    breathability: string
    intendedUse: string
  }
  fit: {
    intendedFit: string
    /** Parsed "Chest|52 cm" lines. */
    measurements: Array<{ label: string; value: string }>
    stretchRange: string
    modelHeight: string
    modelSize: string
    sizeAdvice: string
  }
  forgeNotes: Array<{ title: string; body: string }>
  /** Design-detail markers pinned to the render (x/y are % of the image box). */
  hotspots: Array<{ x: number; y: number; title: string; body: string }>
  care: {
    intro: string
    steps: string[]
    /** Care-symbol preset keys (careSymbols.tsx). */
    symbols: string[]
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
    },
    specs: {
      construction: c.specs.construction.trim(),
      fitType: firstNonEmpty(c.specs.fitType, product?.fit),
      compression: c.specs.compression.trim(),
      stretch: c.specs.stretch.trim(),
      breathability: c.specs.breathability.trim(),
      intendedUse: c.specs.intendedUse.trim(),
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
    },
    forgeNotes: c.forgeNotes
      .map((n) => ({ title: n.title.trim(), body: n.body.trim() }))
      .filter((n) => n.title || n.body),
    hotspots: c.hotspots
      .map((h) => ({
        // Clamp defensively: a bad number must never park a marker off-image.
        x: Math.min(100, Math.max(0, h.x)),
        y: Math.min(100, Math.max(0, h.y)),
        title: h.title.trim(),
        body: h.body.trim(),
      }))
      .filter((h) => h.title),
    care: {
      intro: c.care.intro.trim(),
      steps: careSteps,
      symbols: c.care.symbols.map((s) => s.trim()).filter(Boolean),
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
