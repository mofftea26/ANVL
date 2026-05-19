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

export function mapShopifyProductNodeToStorefront(
  node: ShopifyProductNode,
  options?: { dropName?: string },
): Product {
  const price = Number.parseFloat(node.priceRange.minVariantPrice.amount) || 0
  const currency = node.priceRange.minVariantPrice.currencyCode || 'USD'
  const variants = node.variants.edges.map((e) => e.node)
  const dropIds = parseDropIdsFromMetafield(node.metafield?.value)
  const anyAvailable = variants.some((v) => v.availableForSale)
  const imageUrl = node.featuredImage?.url ?? '/brand/og-default.svg'
  const imageAlt = node.featuredImage?.altText ?? node.title

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
    imagesByColorName: {},
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
    colorways: collectColorways(variants),
    sizes: collectSizes(variants),
    price,
    images: [{ src: imageUrl, alt: imageAlt }],
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
