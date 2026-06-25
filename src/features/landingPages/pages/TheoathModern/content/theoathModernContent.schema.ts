import { z } from 'zod'

/**
 * CMS content schema for the Theoath Modern experience (key `theoath-modern`).
 *
 * Same contract as The Oath: every field optional, code defaults
 * (`theoathModernContent.defaults.ts`) fill anything blank, so an empty CMS blob
 * renders the complete designed page. The admin Landing Content editor imports
 * this to validate writes; {@link resolveTheoathModernContent} parses the
 * published slice on the storefront.
 */

const trimmedOptional = z.string().optional()

export const tmCtaSchema = z.strictObject({
  label: trimmedOptional,
  /** Sanitized via `sanitizeHref()` where it reaches the DOM, not here. */
  href: trimmedOptional,
})

/** A technical callout anchored over the hero product (0–100 % of the stage). */
export const tmHotspotSchema = z.strictObject({
  label: trimmedOptional,
  line: trimmedOptional,
  x: z.number().min(0).max(100).optional(),
  y: z.number().min(0).max(100).optional(),
})

/** Cinematic intensity knobs — clamped, default to the designed values. */
export const tmHeroSettingsSchema = z.strictObject({
  particleIntensity: z.number().min(0).max(1).optional(),
  fogIntensity: z.number().min(0).max(1).optional(),
  animationIntensity: z.number().min(0).max(1).optional(),
  layoutAlign: z.enum(['left', 'center']).optional(),
  enable3d: z.boolean().optional(),
})

export const tmBenefitSchema = z.strictObject({
  icon: trimmedOptional,
  heading: trimmedOptional,
  description: trimmedOptional,
  href: trimmedOptional,
})

export const tmSpecSchema = z.strictObject({
  label: trimmedOptional,
  value: trimmedOptional,
})

export const tmCalloutSchema = z.strictObject({
  label: trimmedOptional,
  line: trimmedOptional,
  mediaId: trimmedOptional,
})

export const theoathModernContentSchema = z.strictObject({
  hero: z
    .strictObject({
      eyebrow: trimmedOptional,
      heading: trimmedOptional,
      /** Words within `heading` to render in the champagne highlight ink. */
      highlightWords: z.array(z.string()).max(6).optional(),
      description: trimmedOptional,
      primaryCta: tmCtaSchema.optional(),
      secondaryCta: tmCtaSchema.optional(),
      scrollPrompt: trimmedOptional,
      /** Which product slug is staged in the hero (defaults to compression). */
      heroProductSlug: trimmedOptional,
      sideIndex: z.array(z.string()).max(8).optional(),
      hotspots: z.array(tmHotspotSchema).max(8).optional(),
      settings: tmHeroSettingsSchema.optional(),
    })
    .optional(),
  techKnit: z
    .strictObject({
      eyebrow: trimmedOptional,
      title: trimmedOptional,
      description: trimmedOptional,
      callouts: z.array(tmCalloutSchema).max(8).optional(),
    })
    .optional(),
  collection: z
    .strictObject({
      eyebrow: trimmedOptional,
      title: trimmedOptional,
      viewAllLabel: trimmedOptional,
      /** Which product slug is the dominant card (defaults to compression). */
      heroProductSlug: trimmedOptional,
      /** Per-product line, keyed by product slug. */
      taglines: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
  benefits: z
    .strictObject({
      eyebrow: trimmedOptional,
      title: trimmedOptional,
      items: z.array(tmBenefitSchema).max(8).optional(),
    })
    .optional(),
  materials: z
    .strictObject({
      eyebrow: trimmedOptional,
      title: trimmedOptional,
      description: trimmedOptional,
      specs: z.array(tmSpecSchema).max(10).optional(),
      notes: z.array(z.string()).max(6).optional(),
    })
    .optional(),
  conversion: z
    .strictObject({
      eyebrow: trimmedOptional,
      title: trimmedOptional,
      body: trimmedOptional,
      primaryCta: tmCtaSchema.optional(),
      secondaryCta: tmCtaSchema.optional(),
      tagline: trimmedOptional,
    })
    .optional(),
})

export type TheoathModernContent = z.infer<typeof theoathModernContentSchema>
export type TmCta = z.infer<typeof tmCtaSchema>
export type TmHotspot = z.infer<typeof tmHotspotSchema>
export type TmBenefit = z.infer<typeof tmBenefitSchema>
export type TmSpec = z.infer<typeof tmSpecSchema>
export type TmCallout = z.infer<typeof tmCalloutSchema>
