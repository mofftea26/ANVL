import { z } from 'zod'

/**
 * Persistence Zod schema for admin products (audit SEC-07 / Phase C2).
 *
 * Mirrors the drops persistence pattern: tolerant where the runtime is
 * resilient (optional fields, unknown extras) but strict on the shape /
 * types we actually consume. A tampered localStorage blob — or a stale
 * schema from an older client — yields `safeParse({ success: false })`,
 * and the service falls back to seed defaults instead of casting blindly.
 *
 * NOTE: do NOT z.infer<typeof persistedProductSchema> as the canonical
 * AdminProduct type. The hand-written `AdminProduct` interface in
 * products.types.ts stays the public surface; this schema only guards
 * the storage boundary.
 */

const productStatusSchema = z.enum([
  'draft',
  'active',
  'inactive',
  'comingSoon',
  'outOfStock',
  'sale',
  'archived',
])

const productSourceTypeSchema = z.enum(['drop', 'individual'])

const productImageSchema = z.object({
  id: z.string(),
  url: z.string(),
  alt: z.string(),
  isPrimary: z.boolean(),
  sortOrder: z.number(),
})

const productColorSchema = z.object({
  id: z.string(),
  name: z.string(),
  hex: z.string(),
  images: z.array(productImageSchema),
})

const productSizeSchema = z.object({
  id: z.string(),
  label: z.string(),
  sortOrder: z.number(),
})

const productVariantAvailabilitySchema = z.object({
  colorId: z.string(),
  sizeId: z.string(),
  sku: z.string().optional(),
  stockQuantity: z.number(),
  reservedQuantity: z.number(),
  isAvailable: z.boolean(),
})

const productDetailsSchema = z.object({
  fit: z.string().optional(),
  fabric: z.string().optional(),
  gsm: z.string().optional(),
  construction: z.string().optional(),
  care: z.string().optional(),
  features: z.array(z.string()).optional(),
})

const productSeoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  canonicalUrl: z.string().optional(),
  noIndex: z.boolean().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  twitterTitle: z.string().optional(),
  twitterDescription: z.string().optional(),
  twitterImage: z.string().optional(),
  structuredDataType: z
    .enum(['Organization', 'Product', 'CollectionPage', 'WebPage', 'BreadcrumbList'])
    .optional(),
})

/** Validates a single persisted product row before merge / hydration. */
export const persistedProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  shortDescription: z.string(),
  description: z.string(),
  price: z.number(),
  compareAtPrice: z.number().optional(),
  isOnSale: z.boolean(),
  saleLabel: z.string().optional(),
  status: productStatusSchema,
  isActive: z.boolean(),
  releaseDate: z.string().optional(),
  saleStartsAt: z.string().optional(),
  saleEndsAt: z.string().optional(),
  currency: z.string(),
  sourceType: productSourceTypeSchema,
  category: z.string(),
  tags: z.array(z.string()),
  colors: z.array(productColorSchema),
  sizes: z.array(productSizeSchema),
  availability: z.array(productVariantAvailabilitySchema),
  dropIds: z.array(z.string()),
  details: productDetailsSchema,
  videoUrl: z.string().optional(),
  model3dUrl: z.string().optional(),
  seo: productSeoSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
})

/** Validates the outer wrapper persisted at `ANVL_PRODUCTS`. */
export const productsPersistedPayloadSchema = z.object({
  products: z.array(z.unknown()),
})
