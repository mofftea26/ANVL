import type { PublishedStorefrontProjection } from '@/features/cms/api/publicStorefrontPublication'
import type { AdminProduct } from '@/features/admin/products/products.types'
import {
  adminProductIsPubliclyVisible,
  adminProductToLegacy,
} from '@/features/admin/products/products.mapper'
import type { Product, ShopDropFilterOption } from '@/features/products/types/product.types'

/** Product drop label from the catalog drop index (no active-drop dependency). */
function resolveDropDisplayName(
  product: AdminProduct,
  dropIndex: ShopDropFilterOption[],
): string {
  const firstId = product.dropIds[0]
  if (!firstId) return 'ANVL Athletics'
  const row = dropIndex.find((d) => d.id === firstId)
  return row ? `${row.dropNumber}: ${row.name}` : 'ANVL Athletics'
}

function buildShopDropFilterOptionsFromIndex(
  visible: AdminProduct[],
  index: ShopDropFilterOption[],
): ShopDropFilterOption[] {
  const used = new Set<string>()
  for (const p of visible) {
    for (const id of p.dropIds) used.add(id)
  }
  return index
    .filter((d) => used.has(d.id))
    .sort((a, b) =>
      a.dropNumber.localeCompare(b.dropNumber, undefined, { numeric: true }),
    )
}

/** Storefront shop listing + filter options from a published projection (SSR-safe). */
export function buildStorefrontShopCatalogFromProjection(
  p: PublishedStorefrontProjection,
): { items: Product[]; drops: ShopDropFilterOption[] } {
  const visible = p.adminProducts.filter(adminProductIsPubliclyVisible)
  const idx = p.catalogDropIndex
  const items = visible.map((prod) =>
    adminProductToLegacy(prod, resolveDropDisplayName(prod, idx), {
      dropIndex: idx,
    }),
  )
  const drops = buildShopDropFilterOptionsFromIndex(visible, idx)
  return { items, drops }
}

/**
 * Home products. New model: the landing page surfaces the publicly-visible
 * catalog (the page itself picks how many) — no active-drop `productIds`.
 */
export function getStorefrontProductsForHomeFromProjection(
  p: PublishedStorefrontProjection,
): Product[] {
  return buildStorefrontShopCatalogFromProjection(p).items
}

export function getStorefrontProductBySlugFromProjection(
  p: PublishedStorefrontProjection,
  slug: string,
): Product | null {
  const match = p.adminProducts.find((x) => x.slug === slug)
  if (!match || !adminProductIsPubliclyVisible(match)) return null
  return adminProductToLegacy(
    match,
    resolveDropDisplayName(match, p.catalogDropIndex),
    { dropIndex: p.catalogDropIndex },
  )
}

export function getRelatedStorefrontProductsFromProjection(
  p: PublishedStorefrontProjection,
  slug: string,
  limit = 4,
): Product[] {
  const { items } = buildStorefrontShopCatalogFromProjection(p)
  const visible = p.adminProducts.filter(adminProductIsPubliclyVisible)
  const selfAdmin = visible.find((a) => a.slug === slug)
  if (!selfAdmin) return []
  const primaryDropId = selfAdmin.dropIds[0]
  const cat = selfAdmin.category
  const others = items.filter((i) => i.slug !== slug)
  const scored = others.map((prod) => {
    const a = visible.find((x) => x.slug === prod.slug)
    let score = 0
    if (primaryDropId && a?.dropIds.includes(primaryDropId)) score += 10
    if (a && cat && a.category === cat) score += 5
    return { prod, score }
  })
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.prod.name.localeCompare(b.prod.name)
  })
  return scored.slice(0, limit).map((s) => s.prod)
}
