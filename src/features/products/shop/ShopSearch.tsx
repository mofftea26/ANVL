import { Search, X } from '@/shared/icons'
import { cn } from '@/shared/lib/cn'
import { ICON_SIZE } from '@/shared/lib/iconSize'

/**
 * Debounced shop search box (the debounce lives in `useShopFilters`). Includes
 * a clear button and an accessible label. The `/` focus shortcut lives on the
 * global nav search (`useGlobalSearch`) now, which is the single canonical
 * `/` target site-wide — this box doesn't bind its own to avoid a conflict.
 */
export function ShopSearch({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (next: string) => void
  className?: string
}) {
  return (
    <div className={cn('relative min-w-0', className)}>
      <Search
        size={15}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--shop-text-muted)]"
      />
      <input
        id="shop-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search name, color, category…"
        autoComplete="off"
        aria-label="Search the armory"
        className="focus-ring h-11 w-full rounded-lg border border-[var(--shop-card-border)] bg-[var(--shop-surface)] pl-9 pr-9 text-base text-[var(--shop-text)] placeholder:text-[var(--shop-text-muted)] md:h-10 md:text-sm"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="focus-ring absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-[var(--shop-text-muted)] transition-colors hover:text-[var(--shop-text)]"
        >
          <X size={ICON_SIZE.sm} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}
