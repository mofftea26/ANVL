import { SlidersHorizontal } from '@/shared/icons'
import { cn } from '@/shared/lib/cn'
import { ShopSearch } from '@/features/products/shop/ShopSearch'
import { ShopSort } from '@/features/products/shop/ShopSort'
import type { ShopSort as ShopSortValue } from '@/features/products/shop/shopUrlSearch'

/**
 * Shop command bar: live result count, search, sort, and a mobile Filters
 * trigger badged with the active-filter count. Renders inside the hero shell
 * (`ShopPage`), which owns the separator line under it — so the toolbar itself
 * draws no border and the hero backdrop runs continuously behind it.
 */
export function ShopToolbar({
  count,
  query,
  onQueryChange,
  sort,
  enabledSorts,
  onSortChange,
  activeFilterCount,
  onOpenFilters,
  className,
}: {
  count: number
  query: string
  onQueryChange: (next: string) => void
  sort: ShopSortValue
  enabledSorts: ShopSortValue[]
  onSortChange: (next: ShopSortValue) => void
  activeFilterCount: number
  onOpenFilters: () => void
  className?: string
}) {
  return (
    <div className={cn('py-3', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="anvl-display shrink-0 text-sm tracking-[0.18em] text-[var(--shop-text)]">
          <span className="text-[var(--shop-accent)]">{String(count).padStart(2, '0')}</span>{' '}
          {count === 1 ? 'piece' : 'pieces'}
        </p>
        <div className="flex w-full items-center gap-2.5 sm:w-auto">
          <ShopSearch value={query} onChange={onQueryChange} className="flex-1 sm:w-64 sm:flex-none" />
          <ShopSort value={sort} enabled={enabledSorts} onChange={onSortChange} />
          <button
            type="button"
            onClick={onOpenFilters}
            className="focus-ring relative inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border border-[var(--shop-card-border)] bg-[var(--shop-surface)] px-3.5 text-sm text-[var(--shop-text)] transition-colors hover:border-[var(--shop-accent)] md:h-10 lg:hidden"
            aria-label={`Open filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ''}`}
          >
            <SlidersHorizontal size={17} aria-hidden="true" />
            <span>Filters</span>
            {activeFilterCount > 0 ? (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--shop-accent)] px-1 text-[11px] font-semibold tabular-nums text-[var(--shop-on-accent)]">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </div>
  )
}
