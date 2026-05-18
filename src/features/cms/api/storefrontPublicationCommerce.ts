import type { PublishedStorefrontProjection } from '@/features/cms/api/publicStorefrontPublication'
import type { AdminProduct } from '@/features/admin/products/products.types'
import {
  adminProductIsPubliclyVisible,
  adminProductToLegacy,
} from '@/features/admin/products/products.mapper'
import type { Drop } from '@/features/drops/drop.types'
import type { Product, ShopDropFilterOption } from '@/features/products/types/product.types'

function resolveDropDisplayNameFromPublication(
  product: AdminProduct,
  dropIndex: ShopDropFilterOption[],
  activeDrop: Drop,
): string {
  const firstId = product.dropIds[0]
  if (!firstId) return 'ANVL Athletics'
  const row = dropIndex.find((d) => d.id === firstId)
  if (row) return `${row.dropNumber}: ${row.name}`
  if (firstId === activeDrop.id) {
    return `${activeDrop.dropNumber}: ${activeDrop.name}`
  }
  return 'ANVL Athletics'
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
    adminProductToLegacy(
      prod,
      resolveDropDisplayNameFromPublication(prod, idx, p.drop),
      { dropIndex: idx },
    ),
  )
  const drops = buildShopDropFilterOptionsFromIndex(visible, idx)
  return { items, drops }
}

export function getStorefrontProductsForHomeFromProjection(
  p: PublishedStorefrontProjection,
): Product[] {
  const drop = p.drop
  const label = `${drop.dropNumber}: ${drop.name}`
  const map = new Map(p.adminProducts.map((x) => [x.id, x]))
  return drop.productIds
    .map((id) => map.get(id))
    .filter((row): row is AdminProduct => Boolean(row))
    .filter(adminProductIsPubliclyVisible)
    .map((row) =>
      adminProductToLegacy(row, label, { dropIndex: p.catalogDropIndex }),
    )
}

export function getStorefrontProductBySlugFromProjection(
  p: PublishedStorefrontProjection,
  slug: string,
): Product | null {
  const match = p.adminProducts.find((x) => x.slug === slug)
  if (!match || !adminProductIsPubliclyVisible(match)) return null
  return adminProductToLegacy(
    match,
    resolveDropDisplayNameFromPublication(match, p.catalogDropIndex, p.drop),
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
