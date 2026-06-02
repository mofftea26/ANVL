import { z } from 'zod'

const cta = z.object({ label: z.string(), href: z.string() })

const heroMetaItem = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
})

const galleryItem = z.object({
  src: z.string(),
  caption: z.string().optional(),
  mediaType: z.enum(['image', 'video']).optional(),
})

export const heroContentSchema = z.object({
  countdownTargetIso: z.string().optional(),
  /** Poster / fallback still when video is set or motion is reduced. */
  backgroundImageUrl: z.string().optional(),
  /** Hosted hero loop (.mp4 / .webm) — prefer Supabase `cms-media` public URL. */
  backgroundVideoUrl: z.string().optional(),
  playVideoOnMobile: z.boolean().optional(),
  emblemWatermarkSrc: z.string().optional(),
  metaItems: z.array(heroMetaItem).max(6).optional(),
  primaryCta: cta.optional(),
  secondaryCta: cta.optional(),
})

export const manifestoContentSchema = z.object({
  quote: z.string().optional(),
  storyParagraphs: z.string().optional(),
})

export const storytellingContentSchema = z.object({
  chapterTitle: z.string().optional(),
  chapterBody: z.string().optional(),
})

export const dropRevealContentSchema = z.object({
  releaseDateIso: z.string().optional(),
  primaryCta: cta.optional(),
  secondaryCta: cta.optional(),
  dropVisualSrc: z.string().optional(),
})

export const productShowcaseContentSchema = z.object({
  cardStyle: z.enum(['carousel', 'grid', 'story']).optional(),
  viewAllLabel: z.string().optional(),
  viewAllHref: z.string().optional(),
})

export const materialShowcaseContentSchema = z.object({
  materialName: z.string().optional(),
  gsm: z.string().optional(),
  composition: z.string().optional(),
  fitNotes: z.string().optional(),
  constructionNotes: z.string().optional(),
})

export const specialEventContentSchema = z.object({
  eventTitle: z.string().optional(),
  startsAtIso: z.string().optional(),
  endsAtIso: z.string().optional(),
  location: z.string().optional(),
  linkHref: z.string().optional(),
  rules: z.string().optional(),
  cta: cta.optional(),
})

export const lookbookContentSchema = z.object({
  layout: z.enum(['masonry', 'carousel', 'editorial']).optional(),
  galleryItems: z.array(galleryItem).max(40).optional(),
})

export const newsletterContentSchema = z.object({
  consentCopy: z.string().optional(),
  preferredProductOptions: z.array(z.string()).max(24).optional(),
  formIntro: z.string().optional(),
})

export const finalCtaContentSchema = z.object({
  backgroundImageUrl: z.string().optional(),
  primaryCta: cta.optional(),
  secondaryCta: cta.optional(),
  tertiaryCta: cta.optional(),
})

const SCHEMAS: Record<string, z.ZodType<Record<string, unknown>>> = {
  hero: heroContentSchema,
  manifesto: manifestoContentSchema,
  storytelling: storytellingContentSchema,
  dropReveal: dropRevealContentSchema,
  productShowcase: productShowcaseContentSchema,
  materialShowcase: materialShowcaseContentSchema,
  specialEvent: specialEventContentSchema,
  lookbook: lookbookContentSchema,
  newsletterWaitlist: newsletterContentSchema,
  finalCTA: finalCtaContentSchema,
}

export function safeParseActContent(
  nature: string,
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const schema = SCHEMAS[nature] ?? z.record(z.string(), z.unknown())
  const res = schema.safeParse(raw)
  return res.success ? (res.data as Record<string, unknown>) : {}
}
