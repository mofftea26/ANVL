import { readDropsArray } from '@/features/admin/drops/drops.service'
import type {
  Product,
  ProductShopMeta,
  StorefrontProductStatus,
} from '@/features/products/types/product.types'
import type { AdminProduct, ProductImage, ProductSize } from './products.types'
import { effectiveSellableUnits } from './products.matrix'

export function sortSizes(sizes: ProductSize[]): ProductSize[] {
  return [...sizes].sort((a, b) => a.sortOrder - b.sortOrder)
}

export function sortImages(images: ProductImage[]): ProductImage[] {
  return [...images].sort((a, b) => a.sortOrder - b.sortOrder)
}

/** Visible on shop listing / PDP unless inactive, archived, or draft. */
export function adminProductIsPubliclyVisible(p: AdminProduct): boolean {
  if (!p.isActive) return false
  if (
    p.status === 'draft' ||
    p.status === 'inactive' ||
    p.status === 'archived'
  )
    return false
  return true
}

export function effectivePrice(p: AdminProduct): number {
  if (p.isOnSale && typeof p.compareAtPrice === 'number') {
    return Math.min(p.price, p.compareAtPrice)
  }
  return p.price
}

function totalSellableUnits(p: AdminProduct): number {
  return p.availability.reduce((sum, row) => sum + effectiveSellableUnits(row), 0)
}

function computeStorefrontStatus(p: AdminProduct): StorefrontProductStatus {
  if (p.status === 'comingSoon') return 'comingSoon'
  if (p.status === 'outOfStock') return 'outOfStock'
  if (totalSellableUnits(p) <= 0) return 'outOfStock'
  const limited =
    p.tags.some((t) => t.toLowerCase().includes('limited')) ||
    (p.saleLabel?.toLowerCase().includes('limited') ?? false)
  if (limited) return 'limitedEdition'
  if (
    p.status === 'sale' ||
    (p.isOnSale &&
      typeof p.compareAtPrice === 'number' &&
      p.compareAtPrice > effectivePrice(p))
  ) {
    return 'sale'
  }
  return 'available'
}

function buildProductShopMeta(p: AdminProduct): ProductShopMeta {
  const drops = readDropsArray()
  const sortedColors = [...p.colors].sort((a, b) => a.name.localeCompare(b.name))
  const sizes = sortSizes(p.sizes)

  const primaryDropId = p.dropIds[0] ?? null
  const primaryDrop = primaryDropId
    ? drops.find((d) => d.id === primaryDropId) ?? null
    : null

  const availabilityByColorAndSize: Record<string, Record<string, number>> = {}
  for (const c of sortedColors) {
    availabilityByColorAndSize[c.name] = {}
    for (const s of sizes) {
      const row = p.availability.find((a) => a.colorId === c.id && a.sizeId === s.id)
      const units = row ? effectiveSellableUnits(row) : 0
      availabilityByColorAndSize[c.name]![s.label] = units
    }
  }

  const imagesByColorName: Record<string, Array<{ src: string; alt: string }>> = {}
  for (const c of sortedColors) {
    const imgs = sortImages(c.images)
    imagesByColorName[c.name] =
      imgs.length > 0
        ? imgs.map((img) => ({ src: img.url, alt: img.alt }))
        : [{ src: '/brand/placeholder-product.svg', alt: p.name }]
  }

  const compareAt =
    typeof p.compareAtPrice === 'number' && p.compareAtPrice > effectivePrice(p)
      ? p.compareAtPrice
      : null

  return {
    storefrontStatus: computeStorefrontStatus(p),
    sourceType: p.sourceType,
    dropId: primaryDropId,
    dropSlug: primaryDrop?.slug ?? null,
    compareAtPrice: compareAt,
    listPrice: p.price,
    currency: p.currency || 'USD',
    saleLabel: p.saleLabel,
    videoUrl: p.videoUrl,
    model3dUrl: p.model3dUrl,
    category: p.category,
    availabilityByColorAndSize,
    imagesByColorName,
  }
}

export function adminProductToLegacy(
  p: AdminProduct,
  dropDisplayName: string,
): Product {
  const sortedColors = [...p.colors].sort((a, b) => a.name.localeCompare(b.name))
  const sizes = sortSizes(p.sizes).map((s) => s.label)

  const primaryColor =
    sortedColors.find((c) => c.images.some((img) => img.isPrimary)) ??
    sortedColors[0]

  const imgs = primaryColor ? sortImages(primaryColor.images) : []
  const legacyImages =
    imgs.length > 0
      ? imgs.map((img) => ({ src: img.url, alt: img.alt }))
      : [{ src: '/brand/placeholder-product.svg', alt: p.name }]

  const colorways = sortedColors.map((c) => ({
    name: c.name,
    base: c.hex,
    accent: c.hex,
  }))

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    dropName: dropDisplayName,
    role: p.shortDescription || p.category || '',
    fit: p.details.fit ?? '',
    fabric: p.details.fabric ?? '',
    gsm: p.details.gsm ?? '',
    storytelling: p.description || p.shortDescription,
    designDetails: p.details.features ?? [],
    careInstructions: p.details.care ? [p.details.care] : [],
    colorways:
      colorways.length > 0
        ? colorways
        : [{ name: 'Default', base: '#0B0B0C', accent: '#1D1F21' }],
    sizes: sizes.length > 0 ? sizes : ['M'],
    price: effectivePrice(p),
    images: legacyImages,
    shop: buildProductShopMeta(p),
  }
}

export function adminProductAllowsAddToCart(p: AdminProduct): boolean {
  if (!adminProductIsPubliclyVisible(p)) return false
  if (p.status === 'comingSoon' || p.status === 'outOfStock') return false
  return true
}

/** Primary listing image URL + alt text for admin surfaces. */
export function adminProductPrimaryPreviewImage(p: AdminProduct): {
  src: string
  alt: string
} | null {
  const color0 = p.colors[0]
  if (!color0) return null
  const sorted = sortImages(color0.images)
  const primary = sorted.find((i) => i.isPrimary) ?? sorted[0]
  const url = primary?.url?.trim()
  if (!url) return null
  const productName = p.name?.trim() || 'Product'
  const colorName = color0.name?.trim() || 'Color'
  const alt =
    primary.alt?.trim() ||
    `${productName} preview — ${colorName}`
  return { src: url, alt }
}

export function variantIsPurchasable(
  admin: AdminProduct,
  colorIndex: number,
  sizeLabel: string,
): boolean {
  if (!adminProductAllowsAddToCart(admin)) return false
  const colors = [...admin.colors].sort((a, b) => a.name.localeCompare(b.name))
  const sizes = sortSizes(admin.sizes)
  const color = colors[colorIndex]
  const size = sizes.find((s) => s.label === sizeLabel)
  if (!color || !size) return false
  const row = admin.availability.find(
    (a) => a.colorId === color.id && a.sizeId === size.id,
  )
  if (!row) return false
  if (effectiveSellableUnits(row) <= 0) return false
  return true
}
