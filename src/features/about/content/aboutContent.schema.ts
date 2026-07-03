import { z } from 'zod'

/**
 * CMS content schema for the About page (key `about`, `landing_content.about`).
 *
 * Single source of truth: the admin About editor imports this schema to
 * validate writes, and {@link resolveAboutContent} parses the published slice
 * on the storefront. Every field is optional — code defaults
 * (`aboutContent.defaults.ts`) fill anything missing or blank, so an empty CMS
 * blob renders the complete designed page.
 *
 * The **orbs** array is the page's content model: each orb is one section —
 * an orbiting orb on the desktop Forge Altar (its strike modal shows the
 * fields below) and a stacked section on the mobile page. Editors can add,
 * edit, remove, and reorder orbs; an empty array falls back to the seven
 * designed defaults.
 */

const trimmedOptional = z.string().optional()

export const aboutCtaSchema = z.strictObject({
  label: trimmedOptional,
  /** Sanitized via `sanitizeHref()` where it reaches the DOM, not here. */
  href: trimmedOptional,
})

/** A labelled callout inside an orb (e.g. construction details). */
export const aboutPointSchema = z.strictObject({
  label: trimmedOptional,
  description: trimmedOptional,
})

export const aboutStatSchema = z.strictObject({
  label: trimmedOptional,
  /** Kept as a string so editors can write "100", "3x", "Beirut" freely. */
  value: trimmedOptional,
  suffix: trimmedOptional,
})

export const aboutOrbSchema = z.strictObject({
  /** Short orb label shown under the orb / on its chip. */
  label: trimmedOptional,
  /** Orb color as #RRGGBB — drives the orb, its halo, and the burst. */
  color: trimmedOptional,
  eyebrow: trimmedOptional,
  title: trimmedOptional,
  body: trimmedOptional,
  /** Mono-tracked spec line. */
  detail: trimmedOptional,
  /** Oversized stacked lines (e.g. the creed). */
  lines: z.array(z.string()).max(8).optional(),
  points: z.array(aboutPointSchema).max(6).optional(),
  stats: z.array(aboutStatSchema).max(8).optional(),
  primaryCta: aboutCtaSchema.optional(),
  secondaryCta: aboutCtaSchema.optional(),
  tagline: trimmedOptional,
  /** CMS media id of the section image (resolved via the media index). */
  mediaId: trimmedOptional,
})

export const aboutLandingContentSchema = z.strictObject({
  /** Mobile-page hero (the desktop altar carries no headline). */
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
  /** The sections — orbiting orbs on desktop, stacked sections on mobile. */
  orbs: z.array(aboutOrbSchema).max(10).optional(),
  /** Counter-scrolling type band (mobile page). */
  marquee: z
    .strictObject({
      text: trimmedOptional,
    })
    .optional(),
})

export type AboutLandingContent = z.infer<typeof aboutLandingContentSchema>
export type AboutCta = z.infer<typeof aboutCtaSchema>
export type AboutPoint = z.infer<typeof aboutPointSchema>
export type AboutStat = z.infer<typeof aboutStatSchema>
export type AboutOrb = z.infer<typeof aboutOrbSchema>
