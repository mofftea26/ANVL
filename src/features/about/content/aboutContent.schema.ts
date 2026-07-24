import { z } from 'zod'
import { tolerantStringList } from '@/shared/schemas/stringList'

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

/**
 * Per-orb layout preset. `classic` is today's free-form render and the default
 * for every legacy orb (no migration — absent/invalid values resolve to it).
 */
export const aboutOrbLayoutSchema = z.enum(['classic', 'text', 'stats', 'map', 'timeline'])

/** A pin on the world map ('map' preset) — percent coords of the map image. */
export const aboutMapPinSchema = z.strictObject({
  id: trimmedOptional,
  /** Percent of the map image box — clamped to 0–100 by the resolver. */
  x: z.number().catch(50),
  y: z.number().catch(50),
  label: trimmedOptional,
})

/** A milestone in the vertical timeline ('timeline' preset). */
export const aboutTimelineEntrySchema = z.strictObject({
  id: trimmedOptional,
  /** Short marker riding the hairline (a year, a tag). */
  marker: trimmedOptional,
  title: trimmedOptional,
  body: trimmedOptional,
})

export const aboutOrbSchema = z.strictObject({
  /** Short orb label shown under the orb / on its chip. */
  label: trimmedOptional,
  /** Orb color as #RRGGBB — drives the orb, its halo, and the burst. */
  color: trimmedOptional,
  /**
   * Layout preset — how the orb's fields compose in the modal/section.
   * Optional + caught so legacy blobs and bad values fall back to `classic`
   * at resolve time without failing the whole slice.
   */
  layout: aboutOrbLayoutSchema.optional().catch(undefined),
  eyebrow: trimmedOptional,
  title: trimmedOptional,
  /** Editorial lead line under the title ('text' preset). */
  subhead: trimmedOptional,
  body: trimmedOptional,
  /** Mono-tracked spec line. */
  detail: trimmedOptional,
  /** Oversized stacked lines (e.g. the creed). Tolerant of a legacy `\n` string. */
  lines: tolerantStringList(8),
  points: z.array(aboutPointSchema).max(6).optional(),
  stats: z.array(aboutStatSchema).max(8).optional(),
  /** World-map pins ('map' preset). Caught so a malformed list never nukes the orb. */
  mapPins: z.array(aboutMapPinSchema).max(12).optional().catch(undefined),
  /** Vertical milestones ('timeline' preset). */
  timeline: z.array(aboutTimelineEntrySchema).max(12).optional().catch(undefined),
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
export type AboutOrbLayout = z.infer<typeof aboutOrbLayoutSchema>
export type AboutMapPin = z.infer<typeof aboutMapPinSchema>
export type AboutTimelineEntry = z.infer<typeof aboutTimelineEntrySchema>
export type AboutOrb = z.infer<typeof aboutOrbSchema>
