import { z } from 'zod'

import { mediaAssetSchema } from '@/shared/schemas/media.schema'

/** Recommended act natures from `docs/features/acts-builder.md`. */
export const actNatureSchema = z.enum([
  'hero',
  'manifesto',
  'dropReveal',
  'productShowcase',
  'materialShowcase',
  'fitGuidePreview',
  'storytelling',
  'specialEvent',
  'lookbook',
  'socialProof',
  'newsletterWaitlist',
  'finalCTA',
])

export const actAnimationConfigSchema = z.object({
  enabled: z.boolean(),
  desktopOnly: z.boolean(),
  type: z.enum(['fadeUp', 'parallax', 'pinReveal', 'stagger', 'videoScrub', 'none']),
  intensity: z.enum(['low', 'medium', 'high']),
  duration: z.number().positive().optional(),
  scrub: z.boolean().optional(),
})

export const actMediaSchema = z.object({
  primary: mediaAssetSchema.optional(),
  secondary: z.array(mediaAssetSchema).optional(),
})

export const landingActSchema = z.object({
  id: z.string(),
  nature: actNatureSchema,
  preset: z.string(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  eyebrow: z.string().optional(),
  body: z.string().optional(),
  media: actMediaSchema.optional(),
  animation: actAnimationConfigSchema.optional(),
  content: z.record(z.string(), z.unknown()),
  productIds: z.array(z.string()).optional(),
  isEnabled: z.boolean(),
  sortOrder: z.number(),
})

export type ActNature = z.infer<typeof actNatureSchema>
export type ActAnimationConfig = z.infer<typeof actAnimationConfigSchema>
export type ActMedia = z.infer<typeof actMediaSchema>
export type LandingAct = z.infer<typeof landingActSchema>
