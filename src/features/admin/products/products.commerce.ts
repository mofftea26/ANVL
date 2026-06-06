import type { Product, ShopDropFilterOption } from '@/features/products/types/product.types'
import type { AdminProduct } from '@/features/admin/products/products.types'
import {
  adminProductIsPubliclyVisible,
  adminProductToLegacy,
} from '@/features/admin/products/products.mapper'
import { getAdminProducts } from '@/features/admin/products/products.service'

/**
 * Drop label for PDP/listing. The drop-builder was removed in the CMS teardown,
 * so the local/seed catalog has no drop metadata source — products surface the
 * brand name. (The published Supabase path uses `catalog_drop_index`.)
 */
export function resolveDropDisplayName(_p: AdminProduct): string {
  return 'ANVL Athletics'
}

export function getStorefrontShopListingCatalog(): {
  items: Product[]
  drops: ShopDropFilterOption[]
} {
  const visible = getAdminProducts().filter(adminProductIsPubliclyVisible)
  const items = visible.map((p) => adminProductToLegacy(p, resolveDropDisplayName(p)))
  return { items, drops: [] }
}

/** Shop grid — all publicly visible catalog items. */
export function getStorefrontProductsForShop(): Product[] {
  return getStorefrontShopListingCatalog().items
}

/** Homepage hero — publicly visible catalog (the page decides how many). */
export function getStorefrontProductsForHome(): Product[] {
  return getStorefrontShopListingCatalog().items
}

export function getStorefrontProductBySlug(slug: string): Product | null {
  const p = getAdminProducts().find((x) => x.slug === slug)
  if (!p || !adminProductIsPubliclyVisible(p)) return null
  return adminProductToLegacy(p, resolveDropDisplayName(p))
}

/** Related products: same category first, then stable name order. */
export function getRelatedStorefrontProducts(slug: string, limit = 4): Product[] {
  const { items } = getStorefrontShopListingCatalog()
  const visibleAdmins = getAdminProducts().filter(adminProductIsPubliclyVisible)
  const selfAdmin = visibleAdmins.find((a) => a.slug === slug)
  if (!selfAdmin) return []
  const cat = selfAdmin.category
  const others = items.filter((i) => i.slug !== slug)
  const scored = others.map((p) => {
    const a = visibleAdmins.find((x) => x.slug === p.slug)
    let score = 0
    if (a && cat && a.category === cat) score += 5
    return { p, score }
  })
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.p.name.localeCompare(b.p.name)
  })
  return scored.slice(0, limit).map((s) => s.p)
}
