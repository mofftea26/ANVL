/**
 * Storefront-safe helper to pair per-product support entries (keyed by commerce
 * slug) with their display names, in catalog order. Used by the size + care
 * guides to render one block per product without importing any admin hook.
 */

export type ProductNameEntry = { slug: string; name: string }

/** "1 piece" / "4 pieces" — the guide section headers' count meta. */
export function formatPieceCount(count: number): string {
  return `${count} ${count === 1 ? 'piece' : 'pieces'}`
}

export type OrderedPerProduct<T> = { slug: string; name: string; entry: T }

/**
 * Orders a `Record<slug, T>` of authored per-product entries by the commerce
 * catalog order first, then appends any authored slugs not in the catalog
 * (display name falls back to the slug). Empty entries are the caller's concern
 * — everything present in the record is returned.
 */
export function orderPerProduct<T>(
  perProduct: Record<string, T>,
  productNames: ProductNameEntry[],
): OrderedPerProduct<T>[] {
  const nameBySlug = new Map(productNames.map((p) => [p.slug, p.name]))
  const seen = new Set<string>()
  const ordered: OrderedPerProduct<T>[] = []

  for (const { slug, name } of productNames) {
    const entry = perProduct[slug]
    if (entry === undefined) continue
    ordered.push({ slug, name, entry })
    seen.add(slug)
  }

  for (const [slug, entry] of Object.entries(perProduct)) {
    if (seen.has(slug)) continue
    ordered.push({ slug, name: nameBySlug.get(slug) ?? slug, entry })
  }

  return ordered
}
