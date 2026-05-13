import type { Product } from '@/features/products/types/product.types'
import { getActiveDrop, getDropBySlug } from '@/features/admin/drops/drops.service'
import {
  adminProductIsPubliclyVisible,
  adminProductToLegacy,
} from '@/features/admin/products/products.mapper'
import { getAdminProducts } from '@/features/admin/products/products.service'

function dropDisplayName(): string {
  const drop = getActiveDrop()
  return drop ? `${drop.dropNumber}: ${drop.name}` : 'ANVL Athletics'
}

/** Shop grid — all publicly visible catalog items. */
export function getStorefrontProductsForShop(): Product[] {
  const label = dropDisplayName()
  return getAdminProducts()
    .filter(adminProductIsPubliclyVisible)
    .map((p) => adminProductToLegacy(p, label))
}

/** Homepage / drop hero — ordered list limited to active drop assignment. */
export function getStorefrontProductsForHome(): Product[] {
  const drop = getActiveDrop()
  const label = drop ? `${drop.dropNumber}: ${drop.name}` : dropDisplayName()
  if (!drop) return []
  const map = new Map(getAdminProducts().map((p) => [p.id, p]))
  return drop.productIds
    .map((id) => map.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .filter(adminProductIsPubliclyVisible)
    .map((p) => adminProductToLegacy(p, label))
}

export function getStorefrontProductsForDropSlug(slug: string): Product[] {
  const drop = getDropBySlug(slug)
  const label = drop ? `${drop.dropNumber}: ${drop.name}` : dropDisplayName()
  if (!drop) return []
  const map = new Map(getAdminProducts().map((p) => [p.id, p]))
  return drop.productIds
    .map((id) => map.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .filter(adminProductIsPubliclyVisible)
    .map((p) => adminProductToLegacy(p, label))
}

export function getStorefrontProductBySlug(slug: string): Product | null {
  const p = getAdminProducts().find((x) => x.slug === slug)
  if (!p || !adminProductIsPubliclyVisible(p)) return null
  return adminProductToLegacy(p, dropDisplayName())
}
