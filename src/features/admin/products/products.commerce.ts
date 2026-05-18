import type { Product, ShopDropFilterOption } from '@/features/products/types/product.types'
import type { AdminProduct } from '@/features/admin/products/products.types'
import { getDropBySlug, readDropsArray } from '@/features/admin/drops/drops.service'
import { resolveStorefrontActiveDrop } from '@/features/cms/runtime/storefrontCmsSync'
import {
  adminProductIsPubliclyVisible,
  adminProductToLegacy,
} from '@/features/admin/products/products.mapper'
import { getAdminProducts } from '@/features/admin/products/products.service'

function dropDisplayNameFromActive(): string {
  const drop = resolveStorefrontActiveDrop()
  return drop ? `${drop.dropNumber}: ${drop.name}` : 'ANVL Athletics'
}

/** Primary assigned drop label for PDP/listing, or brand fallback for individual releases. */
export function resolveDropDisplayName(p: AdminProduct): string {
  const firstId = p.dropIds[0]
  if (!firstId) return 'ANVL Athletics'
  const drop = readDropsArray().find((d) => d.id === firstId)
  return drop ? `${drop.dropNumber}: ${drop.name}` : 'ANVL Athletics'
}

function buildShopDropFilterOptions(visible: AdminProduct[]): ShopDropFilterOption[] {
  const used = new Set<string>()
  for (const p of visible) {
    for (const id of p.dropIds) used.add(id)
  }
  return readDropsArray()
    .filter((d) => used.has(d.id))
    .map((d) => ({
      id: d.id,
      slug: d.slug,
      name: d.name,
      dropNumber: d.dropNumber,
    }))
    .sort((a, b) => a.dropNumber.localeCompare(b.dropNumber, undefined, { numeric: true }))
}

export function getStorefrontShopListingCatalog(): {
  items: Product[]
  drops: ShopDropFilterOption[]
} {
  const visible = getAdminProducts().filter(adminProductIsPubliclyVisible)
  const items = visible.map((p) => adminProductToLegacy(p, resolveDropDisplayName(p)))
  const drops = buildShopDropFilterOptions(visible)
  return { items, drops }
}

/** Shop grid — all publicly visible catalog items. */
export function getStorefrontProductsForShop(): Product[] {
  return getStorefrontShopListingCatalog().items
}

/** Homepage / drop hero — ordered list limited to active drop assignment. */
export function getStorefrontProductsForHome(): Product[] {
  const drop = resolveStorefrontActiveDrop()
  const label = drop ? `${drop.dropNumber}: ${drop.name}` : dropDisplayNameFromActive()
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
  const label = drop ? `${drop.dropNumber}: ${drop.name}` : dropDisplayNameFromActive()
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
  return adminProductToLegacy(p, resolveDropDisplayName(p))
}

/** Related products: same primary drop first, then same category, stable name order. */
export function getRelatedStorefrontProducts(slug: string, limit = 4): Product[] {
  const { items } = getStorefrontShopListingCatalog()
  const visibleAdmins = getAdminProducts().filter(adminProductIsPubliclyVisible)
  const selfAdmin = visibleAdmins.find((a) => a.slug === slug)
  if (!selfAdmin) return []
  const primaryDropId = selfAdmin.dropIds[0]
  const cat = selfAdmin.category
  const others = items.filter((i) => i.slug !== slug)
  const scored = others.map((p) => {
    const a = visibleAdmins.find((x) => x.slug === p.slug)
    let score = 0
    if (primaryDropId && a?.dropIds.includes(primaryDropId)) score += 10
    if (a && cat && a.category === cat) score += 5
    return { p, score }
  })
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.p.name.localeCompare(b.p.name)
  })
  return scored.slice(0, limit).map((s) => s.p)
}
