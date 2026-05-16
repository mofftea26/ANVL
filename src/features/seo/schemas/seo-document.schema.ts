import { z } from 'zod'

import { mediaAssetSchema } from '@/shared/schemas/media.schema'

export const structuredDataTypeSchema = z.enum([
  'Organization',
  'Product',
  'CollectionPage',
  'WebPage',
  'BreadcrumbList',
])

export const seoDocumentSchema = z.object({
  metaTitle: z.string(),
  metaDescription: z.string(),
  /** Absolute URL or site-relative path, depending on environment */
  canonicalUrl: z.string().optional(),
  noIndex: z.boolean().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: mediaAssetSchema.optional(),
  twitterTitle: z.string().optional(),
  twitterDescription: z.string().optional(),
  twitterImage: mediaAssetSchema.optional(),
  structuredDataType: structuredDataTypeSchema.optional(),
  structuredData: z.record(z.string(), z.unknown()).optional(),
})

export type SeoDocument = z.infer<typeof seoDocumentSchema>
