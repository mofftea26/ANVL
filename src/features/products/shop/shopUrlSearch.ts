import type { Product, StorefrontProductStatus } from '@/features/products/types/product.types'

export const SHOP_STATUS_FILTERS: readonly StorefrontProductStatus[] = [
  'available',
  'comingSoon',
  'outOfStock',
  'sale',
  'limitedEdition',
] as const

export type ShopSort =
  | 'featured'
  | 'newest'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc'
  | 'availability'

export const SHOP_SORT_OPTIONS: ReadonlyArray<{ value: ShopSort; label: string }> = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name-asc', label: 'Name: A–Z' },
  { value: 'availability', label: 'Availability' },
] as const

export type ShopUrlSearch = {
  q: string
  /** Comma-separated status tokens (ignored until storefront `Product` carries `shop`). */
  status: string
  category: string
  drop: string
  source: 'all' | 'drop' | 'individual'
  color: string
  size: string
  /** Fit facet label (e.g. "Oversized") — matches `Product.shop.fit` case-insensitively. */
  fit: string
  /** Undefined when the URL carries no explicit sort — the CMS `defaultSort` then applies. */
  sort?: ShopSort
  minPrice?: number
  maxPrice?: number
}

export const defaultShopUrlSearch: ShopUrlSearch = {
  q: '',
  status: '',
  category: '',
  drop: '',
  source: 'all',
  color: '',
  size: '',
  fit: '',
  sort: undefined,
  minPrice: undefined,
  maxPrice: undefined,
}

function parseOptionalPrice(raw: unknown): number | undefined {
  if (raw == null || raw === '') return undefined
  const n = typeof raw === 'number' ? raw : Number(String(raw))
  if (!Number.isFinite(n) || n < 0) return undefined
  return n
}

export function validateShopUrlSearch(search: Record<string, unknown>): ShopUrlSearch {
  const q = typeof search.q === 'string' ? search.q : ''
  const status = typeof search.status === 'string' ? search.status : ''
  const category = typeof search.category === 'string' ? search.category : ''
  const drop = typeof search.drop === 'string' ? search.drop : ''
  const color = typeof search.color === 'string' ? search.color : ''
  const size = typeof search.size === 'string' ? search.size : ''
  const fit = typeof search.fit === 'string' ? search.fit : ''
  const sourceRaw = typeof search.source === 'string' ? search.source : 'all'
  const source: ShopUrlSearch['source'] =
    sourceRaw === 'drop' || sourceRaw === 'individual' ? sourceRaw : 'all'
  const sortRaw = typeof search.sort === 'string' ? search.sort : undefined
  const sort: ShopSort | undefined = SHOP_SORT_OPTIONS.some((o) => o.value === sortRaw)
    ? (sortRaw as ShopSort)
    : undefined

  return {
    q,
    status,
    category,
    drop,
    source,
    color,
    size,
    fit,
    sort,
    minPrice: parseOptionalPrice(search.minPrice),
    maxPrice: parseOptionalPrice(search.maxPrice),
  }
}

function parseCsvStatuses(raw: string): StorefrontProductStatus[] {
  if (!raw.trim()) return []
  const allowed = new Set<string>(SHOP_STATUS_FILTERS)
  return raw
    .split(',')
    .map((x) => x.trim())
    .filter((x): x is StorefrontProductStatus => allowed.has(x as StorefrontProductStatus))
}

function slugifyLabel(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function productInDropFilter(p: Product, dropSlug: string): boolean {
  if (!dropSlug.trim()) return true
  const fromShop = p.shop?.dropSlug?.trim().toLowerCase()
  if (fromShop) return fromShop === dropSlug.trim().toLowerCase()
  const want = dropSlug.trim().toLowerCase()
  const label = slugifyLabel(p.dropName)
  return label.includes(want) || want.includes(label)
}

function productMatchesSizeFilter(p: Product, sizeLabel: string): boolean {
  const key = sizeLabel.trim()
  if (!key) return true
  const map = p.shop?.availabilityByColorAndSize
  if (!map) return p.sizes.includes(key)
  for (const colorName of Object.keys(map)) {
    const row = map[colorName]
    const units = row?.[key] ?? 0
    if (units > 0) return true
  }
  return false
}

export function filterShopListingProducts(
  items: Product[],
  search: ShopUrlSearch,
): Product[] {
  const q = search.q.trim().toLowerCase()
  const statuses = parseCsvStatuses(search.status)
  return items.filter((p) => {
    if (q) {
      const hay = [
        p.name,
        p.role,
        p.storytelling,
        p.dropName,
        p.shop?.category ?? '',
        p.shop?.fit ?? '',
        ...(p.shop?.tags ?? []),
        ...p.colorways.map((c) => c.name),
      ]
        .join(' ')
        .toLowerCase()
      if (!hay.includes(q)) return false
    }
    if (statuses.length > 0) {
      const st = p.shop?.storefrontStatus ?? 'available'
      if (!statuses.includes(st)) return false
    }
    if (search.category.trim()) {
      const cat = (p.shop?.category ?? '').trim().toLowerCase()
      if (cat !== search.category.trim().toLowerCase()) return false
    }
    if (!productInDropFilter(p, search.drop)) return false
    if (search.source !== 'all') {
      const st = p.shop?.sourceType ?? 'individual'
      if (st !== search.source) return false
    }
    if (search.color.trim()) {
      const has = p.colorways.some((c) => c.name === search.color.trim())
      if (!has) return false
    }
    if (search.size.trim()) {
      if (!productMatchesSizeFilter(p, search.size.trim())) return false
    }
    if (search.fit.trim()) {
      const fit = (p.shop?.fit ?? '').trim().toLowerCase()
      if (fit !== search.fit.trim().toLowerCase()) return false
    }
    const price = p.price
    if (typeof search.minPrice === 'number' && price < search.minPrice) return false
    if (typeof search.maxPrice === 'number' && price > search.maxPrice) return false
    return true
  })
}

/**
 * Sort a filtered listing. `featured` preserves the catalog's curated order
 * (the array is returned untouched); the others return a sorted copy so the
 * source array is never mutated.
 */
export function sortShopListingProducts(items: Product[], sort: ShopSort): Product[] {
  switch (sort) {
    case 'price-asc':
      return [...items].sort((a, b) => a.price - b.price)
    case 'price-desc':
      return [...items].sort((a, b) => b.price - a.price)
    case 'name-asc':
      return [...items].sort((a, b) => a.name.localeCompare(b.name))
    case 'newest': {
      // Shopify-mapped products carry `shop.createdAt` — sort those by real
      // creation date (newest first, undated last). Catalogs with no
      // timestamps (seed/local) keep the stable reverse of curated order
      // (most recently appended first).
      if (items.some((p) => p.shop?.createdAt)) {
        return [...items]
          .map((p, i) => ({ p, i, t: Date.parse(p.shop?.createdAt ?? '') }))
          .sort((a, b) => {
            const at = Number.isFinite(a.t) ? a.t : Number.NEGATIVE_INFINITY
            const bt = Number.isFinite(b.t) ? b.t : Number.NEGATIVE_INFINITY
            return bt - at || a.i - b.i
          })
          .map((x) => x.p)
      }
      return [...items].reverse()
    }
    case 'availability':
      // Purchasable pieces first, sold-out / coming-soon last; stable otherwise.
      return [...items]
        .map((p, i) => ({ p, i }))
        .sort((a, b) => availabilityRank(a.p) - availabilityRank(b.p) || a.i - b.i)
        .map((x) => x.p)
    case 'featured':
    default:
      return items
  }
}

function availabilityRank(p: Product): number {
  const status = p.shop?.storefrontStatus ?? 'available'
  switch (status) {
    case 'available':
    case 'sale':
    case 'limitedEdition':
      return 0
    case 'comingSoon':
      return 1
    case 'outOfStock':
    default:
      return 2
  }
}

export type ShopFacetCounts = {
  status: Record<string, number>
  category: Record<string, number>
  fit: Record<string, number>
  color: Record<string, number>
  size: Record<string, number>
  drop: Record<string, number>
}

/**
 * Faceted result counts: for each filter dimension, count how many products
 * would match if that dimension were (re)set — i.e. holding every OTHER active
 * filter. This is the standard facet behavior so a count of 0 marks an
 * impossible combination the UI can disable. Computed from the full catalog.
 */
export function computeShopFacetCounts(
  items: Product[],
  search: ShopUrlSearch,
): ShopFacetCounts {
  const status: Record<string, number> = {}
  const category: Record<string, number> = {}
  const fit: Record<string, number> = {}
  const color: Record<string, number> = {}
  const size: Record<string, number> = {}
  const drop: Record<string, number> = {}

  const without = (patch: Partial<ShopUrlSearch>) =>
    filterShopListingProducts(items, { ...search, ...patch })

  for (const p of without({ status: '' })) {
    const s = p.shop?.storefrontStatus ?? 'available'
    status[s] = (status[s] ?? 0) + 1
  }
  for (const p of without({ category: '' })) {
    const c = p.shop?.category?.trim()
    if (c) category[c] = (category[c] ?? 0) + 1
  }
  for (const p of without({ fit: '' })) {
    const f = p.shop?.fit?.trim()
    if (f) fit[f] = (fit[f] ?? 0) + 1
  }
  for (const p of without({ color: '' })) {
    for (const c of p.colorways) color[c.name] = (color[c.name] ?? 0) + 1
  }
  const sizePool = without({ size: '' })
  for (const label of uniqueSizeLabels(items)) {
    size[label] = sizePool.filter((p) => productMatchesSizeFilter(p, label)).length
  }
  const dropPool = without({ drop: '' })
  for (const p of dropPool) {
    const slug = p.shop?.dropSlug?.trim()
    if (slug) drop[slug] = (drop[slug] ?? 0) + 1
  }

  return { status, category, fit, color, size, drop }
}

export function catalogPriceBounds(items: Product[]): { min: number; max: number } {
  if (items.length === 0) return { min: 0, max: 0 }
  let min = items[0]!.price
  let max = min
  for (const p of items) {
    min = Math.min(min, p.price)
    max = Math.max(max, p.price)
  }
  return { min, max }
}

export function uniqueCategories(items: Product[]): string[] {
  const set = new Set<string>()
  for (const p of items) {
    const c = p.shop?.category?.trim()
    if (c) set.add(c)
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}

/** Distinct fit labels across the catalog, sorted — drives the Fit facet. */
export function uniqueFitLabels(items: Product[]): string[] {
  const set = new Set<string>()
  for (const p of items) {
    const f = p.shop?.fit?.trim()
    if (f) set.add(f)
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}

export function uniqueColorwayNames(items: Product[]): string[] {
  const set = new Set<string>()
  for (const p of items) {
    for (const c of p.colorways) set.add(c.name)
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}

export type ColorwaySwatch = { name: string; base: string; accent: string }

/** First-seen swatch per colorway name, sorted by name — drives filter swatches. */
export function uniqueColorwaySwatches(items: Product[]): ColorwaySwatch[] {
  const map = new Map<string, ColorwaySwatch>()
  for (const p of items) {
    for (const c of p.colorways) {
      if (!map.has(c.name)) {
        map.set(c.name, { name: c.name, base: c.base, accent: c.accent })
      }
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
}

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']

export function uniqueSizeLabels(items: Product[]): string[] {
  const set = new Set<string>()
  for (const p of items) {
    for (const s of p.sizes) set.add(s)
  }
  return [...set].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a)
    const ib = SIZE_ORDER.indexOf(b)
    if (ia !== -1 || ib !== -1) {
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
    }
    return a.localeCompare(b)
  })
}
