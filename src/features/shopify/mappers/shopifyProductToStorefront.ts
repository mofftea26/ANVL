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

  const shop: ProductShopMeta = {
    storefrontStatus: anyAvailable ? 'available' : 'outOfStock',
    sourceType: dropIds.length > 0 ? 'drop' : 'individual',
    dropId: dropIds[0] ?? null,
    dropIds,
    dropSlug: null,
    compareAtPrice: null,
    listPrice: price,
    currency,
    category: 'Apparel',
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
