import { z } from 'zod'

/**
 * CMS content schema for the About page (key `about`, `landing_content.about`).
 *
 * Single source of truth: the admin About editor imports this schema to
 * validate writes, and {@link resolveAboutContent} parses the published slice
 * on the storefront. Every field is optional — code defaults
 * (`aboutContent.defaults.ts`) fill anything missing or blank, so an empty CMS
 * blob renders the complete designed page. Imagery is assigned separately on
 * the Assets page (`asset_config.pages.about`) — this schema is copy-only.
 */

const trimmedOptional = z.string().optional()

export const aboutCtaSchema = z.strictObject({
  label: trimmedOptional,
  /** Sanitized via `sanitizeHref()` where it reaches the DOM, not here. */
  href: trimmedOptional,
})

/** An annotated point on the construction close-up (0–100 % over the image). */
export const aboutHotspotSchema = z.strictObject({
  label: trimmedOptional,
  description: trimmedOptional,
  x: z.number().min(0).max(100).optional(),
  y: z.number().min(0).max(100).optional(),
})

export const aboutProcessStepSchema = z.strictObject({
  eyebrow: trimmedOptional,
  title: trimmedOptional,
  body: trimmedOptional,
  hotspots: z.array(aboutHotspotSchema).max(4).optional(),
})

export const aboutStatSchema = z.strictObject({
  label: trimmedOptional,
  /** Kept as a string so editors can write "100", "3x", "0", etc. freely. */
  value: trimmedOptional,
  suffix: trimmedOptional,
})

export const aboutLandingContentSchema = z.strictObject({
  hero: z
    .strictObject({
      eyebrow: trimmedOptional,
      headline: trimmedOptional,
      subhead: trimmedOptional,
      primaryCta: aboutCtaSchema.optional(),
      secondaryCta: aboutCtaSchema.optional(),
      scrollCue: trimmedOptional,
    })
    .optional(),
  philosophy: z
    .strictObject({
      eyebrow: trimmedOptional,
      lines: z.array(z.string()).max(6).optional(),
    })
    .optional(),
  process: z
    .strictObject({
      eyebrow: trimmedOptional,
      title: trimmedOptional,
      /** Exactly three designed steps: materials, construction, testing. */
      steps: z.array(aboutProcessStepSchema).max(3).optional(),
    })
    .optional(),
  stats: z
    .strictObject({
      eyebrow: trimmedOptional,
      title: trimmedOptional,
      items: z.array(aboutStatSchema).max(8).optional(),
    })
    .optional(),
  finale: z
    .strictObject({
      eyebrow: trimmedOptional,
      title: trimmedOptional,
      body: trimmedOptional,
      primaryCta: aboutCtaSchema.optional(),
      secondaryCta: aboutCtaSchema.optional(),
      tagline: trimmedOptional,
    })
    .optional(),
})

export type AboutLandingContent = z.infer<typeof aboutLandingContentSchema>
export type AboutCta = z.infer<typeof aboutCtaSchema>
export type AboutHotspot = z.infer<typeof aboutHotspotSchema>
export type AboutProcessStep = z.infer<typeof aboutProcessStepSchema>
export type AboutStat = z.infer<typeof aboutStatSchema>
