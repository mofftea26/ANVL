import { z } from 'zod'
import { tolerantStringList } from '@/shared/schemas/stringList'

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

/** An annotated point on the product (0–100 % over the viewer). */
export const oathHotspotSchema = z.strictObject({
  label: trimmedOptional,
  description: trimmedOptional,
  /** CMS media id of the small material/tech "bubble" image. */
  bubbleId: trimmedOptional,
  x: z.number().min(0).max(100).optional(),
  y: z.number().min(0).max(100).optional(),
})

export const oathTenetSchema = z.strictObject({
  /** Product name. */
  title: trimmedOptional,
  /** Warrior-voiced one-liner under the title. */
  subtitle: trimmedOptional,
  line: trimmedOptional,
  marker: trimmedOptional,
  /** CMS media id of the product still (fallback when no GLB). */
  mediaId: trimmedOptional,
  /** CMS media id of the product 3D model (.glb) the camera shows. */
  modelId: trimmedOptional,
  /** CMS media id of the smokey abstract background for this slide. */
  bgId: trimmedOptional,
  /** Annotated points on the product (material / tech callouts). */
  hotspots: z.array(oathHotspotSchema).max(4).optional(),
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
      /** Masked manifesto lines. Tolerant of a legacy `\n`-joined string. */
      lines: tolerantStringList(6),
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
export type OathHotspot = z.infer<typeof oathHotspotSchema>
