import { z } from 'zod'

/**
 * CMS content schema for The Oath Modern experience (key `theoath-modern`).
 *
 * The Oath Modern is the continuous-3D ceremonial rebuild of Drop 01: one
 * evolving world told in six chapters — Threshold, Pressure, Formation, The Oath,
 * The Armory (product system), and The Vow (conversion).
 *
 * Same contract as every code-owned landing page: every field is optional, the
 * code defaults (`oathModernContent.defaults.ts`) fill anything blank, so an empty
 * CMS blob renders the complete designed page. The admin Landing Content editor
 * imports this to validate writes; {@link resolveOathModernContent} parses the
 * published slice on the storefront.
 */

const trimmedOptional = z.string().optional()

export const omCtaSchema = z.strictObject({
  label: trimmedOptional,
  /** Sanitized via `sanitizeHref()` where it reaches the DOM, not here. */
  href: trimmedOptional,
})

/** A label + supporting line (vows, construction marks). */
export const omPairSchema = z.strictObject({
  label: trimmedOptional,
  line: trimmedOptional,
})

/** Cinematic intensity knobs — clamped, default to the designed values. */
export const omThresholdSettingsSchema = z.strictObject({
  particleIntensity: z.number().min(0).max(1).optional(),
  fogIntensity: z.number().min(0).max(1).optional(),
  animationIntensity: z.number().min(0).max(1).optional(),
  layoutAlign: z.enum(['left', 'center']).optional(),
  enable3d: z.boolean().optional(),
})

export const oathModernContentSchema = z.strictObject({
  /** Chapter I — Threshold: the entrance, the hero object emerging from dark. */
  threshold: z
    .strictObject({
      eyebrow: trimmedOptional,
      heading: trimmedOptional,
      /** Words within `heading` to render in the wax-metal highlight ink. */
      highlightWords: z.array(z.string()).max(6).optional(),
      body: trimmedOptional,
      primaryCta: omCtaSchema.optional(),
      secondaryCta: omCtaSchema.optional(),
      scrollPrompt: trimmedOptional,
      /** Which product slug is staged in the hero (defaults to compression). */
      heroProductSlug: trimmedOptional,
      settings: omThresholdSettingsSchema.optional(),
    })
    .optional(),
  /** Chapter II — Pressure: the forging forces, sworn as vows. */
  pressure: z
    .strictObject({
      eyebrow: trimmedOptional,
      heading: trimmedOptional,
      body: trimmedOptional,
      vows: z.array(omPairSchema).max(6).optional(),
    })
    .optional(),
  /** Chapter III — Formation: how the piece is forged, not sewn. */
  formation: z
    .strictObject({
      eyebrow: trimmedOptional,
      heading: trimmedOptional,
      body: trimmedOptional,
      marks: z.array(omPairSchema).max(6).optional(),
    })
    .optional(),
  /** Chapter IV — The Oath: the sworn creed (orbital moment). */
  oath: z
    .strictObject({
      eyebrow: trimmedOptional,
      heading: trimmedOptional,
      lines: z.array(z.string()).max(8).optional(),
      attribution: trimmedOptional,
    })
    .optional(),
  /** Chapter V — The Armory: the three-piece product system. */
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
  /** Chapter VI — The Vow: conversion + reassurance, handing off to the footer. */
  conversion: z
    .strictObject({
      eyebrow: trimmedOptional,
      title: trimmedOptional,
      body: trimmedOptional,
      primaryCta: omCtaSchema.optional(),
      secondaryCta: omCtaSchema.optional(),
      tagline: trimmedOptional,
      reassurances: z.array(z.string()).max(6).optional(),
    })
    .optional(),
})

export type OathModernContent = z.infer<typeof oathModernContentSchema>
export type OmCta = z.infer<typeof omCtaSchema>
export type OmPair = z.infer<typeof omPairSchema>
