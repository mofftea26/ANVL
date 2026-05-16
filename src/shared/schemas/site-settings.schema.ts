import { z } from 'zod'

import { seoDocumentSchema } from '@/features/seo/schemas/seo-document.schema'

import { navigationItemSchema } from './navigation.schema'

export const siteSettingsSchema = z.object({
  siteName: z.string(),
  defaultLocale: z.string(),
  defaultCurrency: z.string(),
  seoDefaults: seoDocumentSchema,
  primaryNavigation: z.array(navigationItemSchema),
  footerNavigation: z.array(navigationItemSchema).optional(),
})

export type SiteSettings = z.infer<typeof siteSettingsSchema>
