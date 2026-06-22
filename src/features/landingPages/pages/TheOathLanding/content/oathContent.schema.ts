import { z } from 'zod'

/**
 * CMS content schema for Drop 01 — The Oath (key `the-oath`).
 *
 * Single source of truth: the admin Landing Content editor imports this schema
 * to validate writes, and {@link resolveOathContent} parses the published slice
 * on the storefront. Every field is optional — code defaults
 * (`oathContent.defaults.ts`) fill anything missing or blank, so an empty CMS
 * blob renders the complete designed page.
 */

const trimmedOptional = z.string().optional()

export const oathCtaSchema = z.strictObject({
  label: trimmedOptional,
  /** Sanitized via `sanitizeHref()` where it reaches the DOM, not here. */
  href: trimmedOptional,
})

export const oathTenetSchema = z.strictObject({
  title: trimmedOptional,
  line: trimmedOptional,
  marker: trimmedOptional,
  /** CMS media library id — assigned from the Landing Content editor only. */
  mediaId: trimmedOptional,
})

export const oathLandingContentSchema = z.strictObject({
  hero: z
    .strictObject({
      eyebrow: trimmedOptional,
      headline: trimmedOptional,
      subhead: trimmedOptional,
      primaryCta: oathCtaSchema.optional(),
      secondaryCta: oathCtaSchema.optional(),
      scrollCue: trimmedOptional,
    })
    .optional(),
  manifesto: z
    .strictObject({
      eyebrow: trimmedOptional,
      lines: z.array(z.string()).max(6).optional(),
    })
    .optional(),
  tenets: z
    .strictObject({
      eyebrow: trimmedOptional,
      items: z.array(oathTenetSchema).max(12).optional(),
    })
    .optional(),
  products: z
    .strictObject({
      eyebrow: trimmedOptional,
      title: trimmedOptional,
      viewAllLabel: trimmedOptional,
      /** Per-product emotional line, keyed by product slug. */
      taglines: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
  finale: z
    .strictObject({
      eyebrow: trimmedOptional,
      title: trimmedOptional,
      body: trimmedOptional,
      primaryCta: oathCtaSchema.optional(),
      secondaryCta: oathCtaSchema.optional(),
      tagline: trimmedOptional,
    })
    .optional(),
})

export type OathLandingContent = z.infer<typeof oathLandingContentSchema>
export type OathCta = z.infer<typeof oathCtaSchema>
export type OathTenet = z.infer<typeof oathTenetSchema>
