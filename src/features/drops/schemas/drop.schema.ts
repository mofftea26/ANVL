import { z } from 'zod'

import { landingActSchema } from '@/features/landing/schemas/landing-act.schema'
import { seoDocumentSchema } from '@/features/seo/schemas/seo-document.schema'
import { mediaAssetSchema } from '@/shared/schemas/media.schema'

export const dropStatusSchema = z.enum(['inactive', 'scheduled', 'active'])

export const dropThemeSchema = z.object({
  paletteName: z.string(),
  colors: z.object({
    background: z.string(),
    surface: z.string(),
    surfaceMuted: z.string(),
    text: z.string(),
    textMuted: z.string(),
    accent: z.string(),
    border: z.string(),
    glow: z.string().optional(),
  }),
  fonts: z
    .object({
      heading: z.string().optional(),
      body: z.string().optional(),
    })
    .optional(),
})

export const dropBrandingSchema = z.object({
  campaignEmblem: mediaAssetSchema.optional(),
  campaignWordmark: mediaAssetSchema.optional(),
  loadingEmblem: mediaAssetSchema.optional(),
})

export const dropPageContentSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  body: z.string().optional(),
  gallery: z.array(mediaAssetSchema).optional(),
})

export const dropSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  status: dropStatusSchema,
  releaseDate: z.string().optional(),
  scheduledActivationAt: z.string().optional(),
  theme: dropThemeSchema,
  brand: dropBrandingSchema,
  heroMedia: mediaAssetSchema.optional(),
  dropPage: dropPageContentSchema,
  acts: z.array(landingActSchema),
  productIds: z.array(z.string()),
  seo: seoDocumentSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type DropStatus = z.infer<typeof dropStatusSchema>
export type DropTheme = z.infer<typeof dropThemeSchema>
export type DropBranding = z.infer<typeof dropBrandingSchema>
export type DropPageContent = z.infer<typeof dropPageContentSchema>
export type Drop = z.infer<typeof dropSchema>
