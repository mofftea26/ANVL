import { z } from 'zod'

import { seoDocumentSchema } from '@/features/seo/schemas/seo-document.schema'
import { mediaAssetSchema } from '@/shared/schemas/media.schema'
import { moneySchema } from '@/shared/schemas/money.schema'

export const productStatusSchema = z.enum([
  'available',
  'comingSoon',
  'outOfStock',
  'sale',
  'limitedEdition',
  'archived',
])

export const productBadgeSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.enum(['sale', 'limited', 'launch', 'new', 'custom']).optional(),
})

export const productMediaSchema = z.object({
  gallery: z.array(mediaAssetSchema),
  thumbnail: mediaAssetSchema.optional(),
  video: mediaAssetSchema.optional(),
})

export const productOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  values: z.array(z.string()),
})

export const productVariantSchema = z.object({
  id: z.string(),
  sku: z.string().optional(),
  color: z.string(),
  size: z.string(),
  stockQuantity: z.number().int(),
  reservedQuantity: z.number().int().optional(),
  priceOverride: moneySchema.optional(),
  mediaOverride: productMediaSchema.optional(),
})

/**
 * Canonical catalog product shape from `docs/features/products-commerce.md`.
 * Distinct from storefront `Product` in `product.types.ts` (presentation layer).
 */
export const catalogProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  description: z.string(),
  sourceType: z.enum(['drop', 'individual']),
  dropId: z.string().optional(),
  releaseDate: z.string().optional(),
  basePrice: moneySchema,
  compareAtPrice: moneySchema.optional(),
  currency: z.string(),
  status: productStatusSchema,
  badges: z.array(productBadgeSchema),
  material: z.string().optional(),
  fit: z.string().optional(),
  care: z.string().optional(),
  media: productMediaSchema,
  options: z.array(productOptionSchema),
  variants: z.array(productVariantSchema),
  seo: seoDocumentSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type CatalogProduct = z.infer<typeof catalogProductSchema>
export type ProductBadge = z.infer<typeof productBadgeSchema>
export type ProductMedia = z.infer<typeof productMediaSchema>
export type ProductOption = z.infer<typeof productOptionSchema>
export type ProductStatus = z.infer<typeof productStatusSchema>
export type ProductVariant = z.infer<typeof productVariantSchema>
