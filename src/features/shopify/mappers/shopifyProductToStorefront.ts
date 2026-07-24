import { z } from 'zod'
import type { Product, ProductShopMeta } from '@/features/products/types/product.types'

const moneySchema = z.object({
  amount: z.string(),
  currencyCode: z.string(),
})

const variantNodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  availableForSale: z.boolean(),
  price: moneySchema,
  compareAtPrice: moneySchema.nullable().optional(),
  selectedOptions: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
    }),
  ),
})

const productNodeSchema = z.object({
  id: z.string(),
  handle: z.string(),
  title: z.string(),
  description: z.string().optional().default(''),
  productType: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
  createdAt: z.string().optional(),
  featuredImage: z
    .object({
      url: z.string(),
      altText: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  images: z
    .object({
      edges: z.array(
        z.object({
          node: z.object({
            url: z.string(),
            altText: z.string().nullable().optional(),
          }),
        }),
      ),
    })
    .optional(),
  priceRange: z.object({
    minVariantPrice: moneySchema,
  }),
  variants: z.object({
    edges: z.array(z.object({ node: variantNodeSchema })),
  }),
  metafield: z.object({ value: z.string() }).nullable().optional(),
})

export type ShopifyProductNode = z.infer<typeof productNodeSchema>

function parseDropIdsFromMetafield(raw: string | undefined): string[] {
  if (!raw?.trim()) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      return parsed.filter((x): x is string => typeof x === 'string')
    }
  } catch {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

/**
 * Fit facet convention: a Shopify product tag `fit:<value>` (case-insensitive,
 * e.g. `fit:oversized`, `fit:compression`, `fit:classic`) marks the piece's fit.
 * The value is title-cased for display ("oversized" → "Oversized").
 */
function parseFitFromTags(tags: string[]): string | undefined {
  for (const raw of tags) {
    const m = /^fit:(.+)$/i.exec(raw.trim())
    if (!m) continue
    const value = m[1]!.trim()
    if (!value) continue
    return value
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  }
  return undefined
}

/**
 * Product-level compare-at price: the compare-at of the cheapest variant (the
 * variant whose price backs the displayed `price`). Only meaningful when it is
 * strictly greater than the display price — otherwise treated as no sale.
 */
function resolveCompareAtPrice(
  variants: z.infer<typeof variantNodeSchema>[],
  displayPrice: number,
): number | null {
  let cheapest: z.infer<typeof variantNodeSchema> | null = null
  let cheapestPrice = Number.POSITIVE_INFINITY
  for (const v of variants) {
    const p = Number.parseFloat(v.price.amount)
    if (Number.isFinite(p) && p < cheapestPrice) {
      cheapest = v
      cheapestPrice = p
    }
  }
  const raw = cheapest?.compareAtPrice?.amount
  if (!raw) return null
  const compareAt = Number.parseFloat(raw)
  if (!Number.isFinite(compareAt) || compareAt <= displayPrice) return null
  return compareAt
}

function buildAvailabilityMatrix(
  variants: z.infer<typeof variantNodeSchema>[],
): Record<string, Record<string, number>> {
  const matrix: Record<string, Record<string, number>> = {}
  for (const v of variants) {
    const color =
      v.selectedOptions.find((o) => o.name.toLowerCase() === 'color')?.value ??
      'Default'
    const size =
      v.selectedOptions.find((o) => o.name.toLowerCase() === 'size')?.value ??
      'One Size'
    if (!matrix[color]) matrix[color] = {}
    matrix[color][size] = v.availableForSale ? 1 : 0
  }
  return matrix
}

function buildVariantIdMatrix(
  variants: z.infer<typeof variantNodeSchema>[],
): Record<string, Record<string, string>> {
  const matrix: Record<string, Record<string, string>> = {}
  for (const v of variants) {
    const color =
      v.selectedOptions.find((o) => o.name.toLowerCase() === 'color')?.value ??
      'Default'
    const size =
      v.selectedOptions.find((o) => o.name.toLowerCase() === 'size')?.value ??
      'One Size'
    if (!matrix[color]) matrix[color] = {}
    matrix[color][size] = v.id
  }
  return matrix
}

function collectSizes(variants: z.infer<typeof variantNodeSchema>[]): string[] {
  const sizes = new Set<string>()
  for (const v of variants) {
    const size = v.selectedOptions.find((o) => o.name.toLowerCase() === 'size')
      ?.value
    if (size) sizes.add(size)
  }
  return sizes.size > 0 ? [...sizes] : ['One Size']
}

function collectColorways(
  variants: z.infer<typeof variantNodeSchema>[],
): Product['colorways'] {
  const colors = new Map<string, { base: string; accent: string }>()
  for (const v of variants) {
    const name =
      v.selectedOptions.find((o) => o.name.toLowerCase() === 'color')?.value ??
      'Default'
    if (!colors.has(name)) {
      colors.set(name, { base: '#34373A', accent: '#E7E4DF' })
    }
  }
  return [...colors.entries()].map(([name, { base, accent }]) => ({
    name,
    base,
    accent,
  }))
}

type StorefrontImage = { src: string; alt: string }

/** All product gallery images (Shopify media), falling back to featured → placeholder. */
function collectImages(node: ShopifyProductNode): StorefrontImage[] {
  const media =
    node.images?.edges.map((e) => ({
      src: e.node.url,
      alt: e.node.altText ?? node.title,
    })) ?? []
  if (media.length > 0) return media
  if (node.featuredImage) {
    return [{ src: node.featuredImage.url, alt: node.featuredImage.altText ?? node.title }]
  }
  return [{ src: '/brand/og-default.svg', alt: node.title }]
}

/**
 * Group gallery images by colorway. Shopify has no first-class per-variant
 * gallery via the Storefront API, so we match each image to a colorway by its
 * alt text (we author it as e.g. "Onyx — front"). Colors with no matching image
 * are omitted, so the PDP falls back to the full gallery for that color.
 */
function buildImagesByColorName(
  images: StorefrontImage[],
  colorNames: string[],
): Record<string, StorefrontImage[]> {
  const out: Record<string, StorefrontImage[]> = {}
  for (const name of colorNames) {
    if (name === 'Default') continue
    const matched = images.filter((img) =>
      img.alt.toLowerCase().includes(name.toLowerCase()),
    )
    if (matched.length > 0) out[name] = matched
  }
  return out
}

export function mapShopifyProductNodeToStorefront(
  node: ShopifyProductNode,
  options?: { dropName?: string },
): Product {
  const price = Number.parseFloat(node.priceRange.minVariantPrice.amount) || 0
  const currency = node.priceRange.minVariantPrice.currencyCode || 'USD'
  const variants = node.variants.edges.map((e) => e.node)
  const dropIds = parseDropIdsFromMetafield(node.metafield?.value)
  const anyAvailable = variants.some((v) => v.availableForSale)
  const images = collectImages(node)
  const colorways = collectColorways(variants)
  const compareAtPrice = resolveCompareAtPrice(variants, price)
  const onSale = compareAtPrice !== null

  const shop: ProductShopMeta = {
    storefrontStatus: !anyAvailable ? 'outOfStock' : onSale ? 'sale' : 'available',
    sourceType: dropIds.length > 0 ? 'drop' : 'individual',
    dropId: dropIds[0] ?? null,
    dropIds,
    dropSlug: null,
    compareAtPrice,
    listPrice: price,
    currency,
    category: node.productType.trim() || 'Apparel',
    fit: parseFitFromTags(node.tags),
    tags: node.tags,
    createdAt: node.createdAt,
    availabilityByColorAndSize: buildAvailabilityMatrix(variants),
    variantIdByColorAndSize: buildVariantIdMatrix(variants),
    imagesByColorName: buildImagesByColorName(
      images,
      colorways.map((c) => c.name),
    ),
  }

  return {
    id: node.id,
    slug: node.handle,
    name: node.title,
    dropName: options?.dropName ?? 'ANVL Athletics',
    role: '',
    fit: '',
    fabric: '',
    gsm: '',
    storytelling: node.description,
    designDetails: [],
    careInstructions: [],
    colorways,
    sizes: collectSizes(variants),
    price,
    images,
    shop,
  }
}

export function parseShopifyProductNode(raw: unknown): ShopifyProductNode | null {
  const r = productNodeSchema.safeParse(raw)
  return r.success ? r.data : null
}

export function productMatchesDropId(
  product: Product,
  dropClientId: string,
): boolean {
  const ids = product.shop?.dropIds ?? []
  if (ids.includes(dropClientId)) return true
  return product.shop?.dropId === dropClientId
}
