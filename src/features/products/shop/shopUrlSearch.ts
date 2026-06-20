import type { Product, StorefrontProductStatus } from '@/features/products/types/product.types'

export const SHOP_STATUS_FILTERS: readonly StorefrontProductStatus[] = [
  'available',
  'comingSoon',
  'outOfStock',
  'sale',
  'limitedEdition',
] as const

export type ShopSort = 'featured' | 'price-asc' | 'price-desc' | 'name-asc'

export const SHOP_SORT_OPTIONS: ReadonlyArray<{ value: ShopSort; label: string }> = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name-asc', label: 'Name: A–Z' },
] as const

export type ShopUrlSearch = {
  q: string
  /** Comma-separated status tokens (ignored until storefront `Product` carries `shop`). */
  status: string
  drop: string
  source: 'all' | 'drop' | 'individual'
  color: string
  size: string
  sort: ShopSort
  minPrice?: number
  maxPrice?: number
}

export const defaultShopUrlSearch: ShopUrlSearch = {
  q: '',
  status: '',
  drop: '',
  source: 'all',
  color: '',
  size: '',
  sort: 'featured',
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
  const drop = typeof search.drop === 'string' ? search.drop : ''
  const color = typeof search.color === 'string' ? search.color : ''
  const size = typeof search.size === 'string' ? search.size : ''
  const sourceRaw = typeof search.source === 'string' ? search.source : 'all'
  const source: ShopUrlSearch['source'] =
    sourceRaw === 'drop' || sourceRaw === 'individual' ? sourceRaw : 'all'
  const sortRaw = typeof search.sort === 'string' ? search.sort : 'featured'
  const sort: ShopSort = SHOP_SORT_OPTIONS.some((o) => o.value === sortRaw)
    ? (sortRaw as ShopSort)
    : 'featured'

  return {
    q,
    status,
    drop,
    source,
    color,
    size,
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
    case 'featured':
    default:
      return items
  }
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

export function uniqueColorwayNames(items: Product[]): string[] {
  const set = new Set<string>()
  for (const p of items) {
    for (const c of p.colorways) set.add(c.name)
  }
  return [...set].sort((a, b) => a.localeCompare(b))
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
