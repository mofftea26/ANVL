import type { Product } from '@/features/products/types/product.types'
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
  }
}

export function adminProductAllowsAddToCart(p: AdminProduct): boolean {
  if (!adminProductIsPubliclyVisible(p)) return false
  if (p.status === 'comingSoon' || p.status === 'outOfStock') return false
  return true
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
