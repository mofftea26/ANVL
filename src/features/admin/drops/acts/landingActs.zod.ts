import { z } from 'zod'

const cta = z.object({ label: z.string(), href: z.string() })

export const heroContentSchema = z.object({
  countdownTargetIso: z.string().optional(),
  backgroundImageUrl: z.string().optional(),
  emblemWatermarkSrc: z.string().optional(),
  primaryCta: cta.optional(),
  secondaryCta: cta.optional(),
})

export const manifestoContentSchema = z.object({
  quote: z.string().optional(),
})

export const storytellingContentSchema = z.object({
  chapterTitle: z.string().optional(),
  chapterBody: z.string().optional(),
})

export const dropRevealContentSchema = z.object({
  releaseDateIso: z.string().optional(),
})

export const productShowcaseContentSchema = z.object({
  cardStyle: z.enum(['carousel', 'grid', 'story']).optional(),
})

export const materialShowcaseContentSchema = z.object({
  gsm: z.string().optional(),
  composition: z.string().optional(),
  fitNotes: z.string().optional(),
})

export const specialEventContentSchema = z.object({
  startsAtIso: z.string().optional(),
  location: z.string().optional(),
  linkHref: z.string().optional(),
  rules: z.string().optional(),
  cta: cta.optional(),
})

export const lookbookContentSchema = z.object({
  layout: z.enum(['masonry', 'carousel', 'editorial']).optional(),
})

export const newsletterContentSchema = z.object({
  consentCopy: z.string().optional(),
})

export const finalCtaContentSchema = z.object({
  backgroundImageUrl: z.string().optional(),
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
