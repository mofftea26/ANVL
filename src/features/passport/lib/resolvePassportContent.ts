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
  care: { intro: string; steps: string[] }
  details: { heading: string; story: string; facts: string[]; funFact: string; assetUrl?: string }
  origin: { label: string; place: string; story: string; assetUrl?: string }
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
    care: {
      intro: c.care.intro.trim(),
      steps: careSteps,
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
    },
  }
}
