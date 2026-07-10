import { ArrowDownUp } from 'lucide-react'
import { SHOP_SORT_OPTIONS, type ShopSort } from '@/features/products/shop/shopUrlSearch'
import { ICON_SIZE } from '@/shared/lib/iconSize'

/**
 * Sort control — a labelled native `<select>` (familiar, fully accessible, no
 * obscure icon-only trigger). The option list is filtered to the CMS-enabled
 * sorts; `value` is the resolved active sort (URL override or CMS default).
 */
export function ShopSort({
  value,
  enabled,
  onChange,
}: {
  value: ShopSort
  enabled: ShopSort[]
  onChange: (next: ShopSort) => void
}) {
  const options = SHOP_SORT_OPTIONS.filter((o) => enabled.includes(o.value))
  const list = options.length > 0 ? options : SHOP_SORT_OPTIONS
  return (
    <div className="relative">
      <ArrowDownUp
        size={ICON_SIZE.sm}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--shop-text-muted)]"
      />
      <label htmlFor="shop-sort" className="sr-only">
        Sort pieces
      </label>
      <select
        id="shop-sort"
        value={value}
        onChange={(e) => onChange(e.target.value as ShopSort)}
        className="focus-ring h-11 shrink-0 appearance-none rounded-lg border border-[var(--shop-card-border)] bg-[var(--shop-surface)] pl-9 pr-8 text-sm text-[var(--shop-text)] md:h-10"
      >
        {list.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
