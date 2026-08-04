import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  ShopDropFilterOption,
  StorefrontProductStatus,
} from '@/features/products/types/product.types'
import {
  defaultShopUrlSearch,
  SHOP_STATUS_FILTERS,
  type ShopUrlSearch,
} from '@/features/products/shop/shopUrlSearch'
import { formatMoney } from '@/shared/lib/money'

const STATUS_CHIP_LABELS: Record<StorefrontProductStatus, string> = {
  available: 'Available',
  comingSoon: 'Coming soon',
  outOfStock: 'Out of stock',
  sale: 'Sale',
  limitedEdition: 'Limited',
}

export type ShopActiveChip = {
  key: string
  label: string
  onRemove: () => void
}

export type ShopFacets = {
  drops: ShopDropFilterOption[]
}

type NavigateUpdater = (prev: ShopUrlSearch) => ShopUrlSearch

export type UseShopFiltersOptions = {
  search: ShopUrlSearch
  /** Apply a search-param change. `replace` keeps shop filtering out of history. */
  onNavigate: (updater: NavigateUpdater, opts?: { replace?: boolean }) => void
  facets: ShopFacets
  /** Debounce window for the search box → URL sync (ms). */
  searchDebounceMs?: number
}

function parseCsvStatuses(raw: string): StorefrontProductStatus[] {
  if (!raw.trim()) return []
  const allowed = new Set<string>(SHOP_STATUS_FILTERS)
  return raw
    .split(',')
    .map((x) => x.trim())
    .filter((x): x is StorefrontProductStatus => allowed.has(x))
}

/**
 * Centralizes all shop URL-filter state: debounced search box → URL sync,
 * `patchSearch`/`resetSearch`, the active-filter chip list, and the active
 * count. Pure with respect to the router — the route passes `search` +
 * `onNavigate`, so this hook stays unit-testable and reusable across the
 * desktop rail and the mobile drawer.
 */
export function useShopFilters({
  search,
  onNavigate,
  facets,
  searchDebounceMs = 350,
}: UseShopFiltersOptions) {
  const [draftQuery, setDraftQuery] = useState(search.q)

  // Keep the draft in step when the URL changes from elsewhere (chip removal,
  // back/forward, reset).
  useEffect(() => {
    setDraftQuery(search.q)
  }, [search.q])

  // Debounce the search box into the URL (replace — no history spam).
  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (draftQuery.trim() === search.q.trim()) return
      onNavigate((prev) => ({ ...prev, q: draftQuery }), { replace: true })
    }, searchDebounceMs)
    return () => window.clearTimeout(handle)
  }, [draftQuery, onNavigate, search.q, searchDebounceMs])

  const patchSearch = useCallback(
    (patch: Partial<ShopUrlSearch>) => {
      onNavigate((prev) => ({ ...prev, ...patch }), { replace: true })
    },
    [onNavigate],
  )

  const resetSearch = useCallback(() => {
    onNavigate(() => ({ ...defaultShopUrlSearch }), { replace: true })
    setDraftQuery('')
  }, [onNavigate])

  const activeChips = useMemo<ShopActiveChip[]>(() => {
    const chips: ShopActiveChip[] = []
    if (search.q.trim()) {
      chips.push({
        key: 'q',
        label: `“${search.q.trim()}”`,
        onRemove: () => {
          setDraftQuery('')
          patchSearch({ q: '' })
        },
      })
    }
    const statuses = parseCsvStatuses(search.status)
    for (const s of statuses) {
      chips.push({
        key: `status:${s}`,
        label: STATUS_CHIP_LABELS[s] ?? s,
        onRemove: () =>
          patchSearch({ status: statuses.filter((x) => x !== s).join(',') }),
      })
    }
    if (search.category.trim()) {
      chips.push({
        key: 'category',
        label: search.category,
        onRemove: () => patchSearch({ category: '' }),
      })
    }
    if (search.drop.trim()) {
      const drop = facets.drops.find((d) => d.slug === search.drop)
      chips.push({
        key: 'drop',
        label: drop ? `${drop.dropNumber}: ${drop.name}` : search.drop,
        onRemove: () => patchSearch({ drop: '' }),
      })
    }
    if (search.source !== 'all') {
      chips.push({
        key: 'source',
        label: search.source === 'drop' ? 'Drop release' : 'Individual',
        onRemove: () => patchSearch({ source: 'all' }),
      })
    }
    if (search.color.trim()) {
      chips.push({
        key: 'color',
        label: search.color,
        onRemove: () => patchSearch({ color: '' }),
      })
    }
    if (search.size.trim()) {
      chips.push({
        key: 'size',
        label: `Size ${search.size}`,
        onRemove: () => patchSearch({ size: '' }),
      })
    }
    if (search.fit.trim()) {
      chips.push({
        key: 'fit',
        label: `${search.fit} fit`,
        onRemove: () => patchSearch({ fit: '' }),
      })
    }
    if (typeof search.minPrice === 'number') {
      chips.push({
        key: 'minPrice',
        label: `Min ${formatMoney(search.minPrice, undefined)}`,
        onRemove: () => patchSearch({ minPrice: undefined }),
      })
    }
    if (typeof search.maxPrice === 'number') {
      chips.push({
        key: 'maxPrice',
        label: `Max ${formatMoney(search.maxPrice, undefined)}`,
        onRemove: () => patchSearch({ maxPrice: undefined }),
      })
    }
    return chips
  }, [search, facets.drops, patchSearch])

  return {
    draftQuery,
    setDraftQuery,
    patchSearch,
    resetSearch,
    activeChips,
    activeFilterCount: activeChips.length,
  }
}
