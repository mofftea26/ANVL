import { Check } from 'lucide-react'
import type {
  ShopDropFilterOption,
  StorefrontProductStatus,
} from '@/features/products/types/product.types'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { Button } from '@/shared/components/ui'
import { cn } from '@/shared/lib/cn'
import type {
  ShopFilterKey,
} from '@/features/cms/shop/shopExperience.zod'
import {
  SHOP_STATUS_FILTERS,
  type ColorwaySwatch,
  type ShopFacetCounts,
  type ShopUrlSearch,
} from '@/features/products/shop/shopUrlSearch'
import { ShopFilterGroup } from '@/features/products/shop/ShopFilterGroup'

const STATUS_LABELS: Record<StorefrontProductStatus, string> = {
  available: 'Available',
  comingSoon: 'Coming soon',
  outOfStock: 'Out of stock',
  sale: 'Sale',
  limitedEdition: 'Limited',
}

export type ShopFilterFacets = {
  drops: ShopDropFilterOption[]
  categories: string[]
  colorways: ColorwaySwatch[]
  sizes: string[]
  priceBounds: { min: number; max: number }
}

export type ShopFilterPanelProps = {
  search: ShopUrlSearch
  onPatch: (patch: Partial<ShopUrlSearch>) => void
  onReset: () => void
  facets: ShopFilterFacets
  counts: ShopFacetCounts
  filterOrder: ShopFilterKey[]
  filterVisibility: Partial<Record<ShopFilterKey, boolean>>
  /** Hide the reset button (the toolbar/drawer may own it). */
  hideReset?: boolean
}

function parseCsvStatuses(raw: string): StorefrontProductStatus[] {
  if (!raw.trim()) return []
  const allowed = new Set<string>(SHOP_STATUS_FILTERS)
  return raw
    .split(',')
    .map((x) => x.trim())
    .filter((x): x is StorefrontProductStatus => allowed.has(x))
}

function toggleCsv(csv: string, value: string): string {
  const cur = new Set(csv.split(',').map((s) => s.trim()).filter(Boolean))
  if (cur.has(value)) cur.delete(value)
  else cur.add(value)
  return [...cur].join(',')
}

/** Pill toggle used for category / size single-select facets. */
function PillToggle({
  label,
  selected,
  disabled,
  count,
  onClick,
}: {
  label: string
  selected: boolean
  disabled?: boolean
  count?: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
        disabled && 'cursor-not-allowed opacity-45',
        selected
          ? 'border-[var(--shop-accent)] bg-[var(--shop-accent)] text-[var(--shop-on-accent)]'
          : 'border-[var(--shop-card-border)] bg-[var(--shop-surface)] text-[var(--shop-text)] hover:border-[var(--shop-accent)]',
      )}
    >
      <span>{label}</span>
      {typeof count === 'number' ? (
        <span className={cn('text-[0.7em] tabular-nums', selected ? 'opacity-80' : 'text-[var(--shop-text-muted)]')}>
          {count}
        </span>
      ) : null}
    </button>
  )
}

/**
 * Config-driven filter body shared by the desktop rail and the mobile drawer.
 * Renders only the CMS-enabled groups, in the CMS-defined order, with faceted
 * counts and disabled impossible combinations (count 0). Single source of truth
 * for the filter UI — no duplicated forms.
 */
export function ShopFilterPanel({
  search,
  onPatch,
  onReset,
  facets,
  counts,
  filterOrder,
  filterVisibility,
  hideReset,
}: ShopFilterPanelProps) {
  const selectedStatuses = new Set(parseCsvStatuses(search.status))

  const groups: Record<ShopFilterKey, () => React.ReactNode> = {
    status: () => (
      <ShopFilterGroup title="Status">
        <div className="flex flex-col gap-2">
          {SHOP_STATUS_FILTERS.map((s) => {
            const count = counts.status[s] ?? 0
            const checked = selectedStatuses.has(s)
            const disabled = count === 0 && !checked
            return (
              <label
                key={s}
                className={cn(
                  'flex cursor-pointer items-center gap-2.5 text-sm text-[var(--shop-text)]',
                  disabled && 'cursor-not-allowed opacity-45',
                )}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[var(--shop-card-border)] accent-[var(--shop-accent)]"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onPatch({ status: toggleCsv(search.status, s) })}
                />
                <span className="flex-1">{STATUS_LABELS[s]}</span>
                <span className="text-xs tabular-nums text-[var(--shop-text-muted)]">{count}</span>
              </label>
            )
          })}
        </div>
      </ShopFilterGroup>
    ),
    category: () =>
      facets.categories.length > 0 ? (
        <ShopFilterGroup title="Category">
          <div className="flex flex-wrap gap-2" role="listbox" aria-label="Category">
            {facets.categories.map((c) => {
              const selected = search.category === c
              const count = counts.category[c] ?? 0
              return (
                <PillToggle
                  key={c}
                  label={c}
                  selected={selected}
                  disabled={count === 0 && !selected}
                  count={count}
                  onClick={() => onPatch({ category: selected ? '' : c })}
                />
              )
            })}
          </div>
        </ShopFilterGroup>
      ) : null,
    drop: () =>
      facets.drops.length > 0 ? (
        <div>
          <label htmlFor="shop-filter-drop" className="anvl-micro mb-2 block text-[var(--shop-text-muted)]">
            Drop
          </label>
          <select
            id="shop-filter-drop"
            className="focus-ring h-11 w-full rounded-lg border border-[var(--shop-card-border)] bg-[var(--shop-surface)] px-3 text-sm text-[var(--shop-text)] md:h-10"
            value={search.drop}
            onChange={(e) => onPatch({ drop: e.target.value })}
          >
            <option value="">Any drop</option>
            {facets.drops.map((d) => (
              <option key={d.id} value={d.slug}>
                {d.dropNumber}: {d.name}
              </option>
            ))}
          </select>
        </div>
      ) : null,
    source: () => (
      <ShopFilterGroup title="Listing source">
        <div className="flex flex-col gap-2 text-sm">
          {(
            [
              ['all', 'All'],
              ['drop', 'Drop release'],
              ['individual', 'Individual'],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex cursor-pointer items-center gap-2.5 text-[var(--shop-text)]">
              <input
                type="radio"
                name="shop-source"
                className="h-4 w-4 border-[var(--shop-card-border)] accent-[var(--shop-accent)]"
                checked={search.source === value}
                onChange={() => onPatch({ source: value })}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </ShopFilterGroup>
    ),
    color: () =>
      facets.colorways.length > 0 ? (
        <ShopFilterGroup title="Colorway">
          <div className="flex flex-wrap gap-2" role="listbox" aria-label="Colorway">
            {facets.colorways.map((c) => {
              const selected = search.color === c.name
              const count = counts.color[c.name] ?? 0
              const disabled = count === 0 && !selected
              return (
                <button
                  key={c.name}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  aria-disabled={disabled}
                  disabled={disabled}
                  title={c.name}
                  onClick={() => onPatch({ color: selected ? '' : c.name })}
                  className={cn(
                    'focus-ring relative grid h-9 w-9 place-items-center rounded-full ring-1 transition-transform',
                    disabled && 'cursor-not-allowed opacity-40',
                    selected
                      ? 'ring-2 ring-[var(--shop-accent)] scale-105'
                      : 'ring-[var(--shop-card-border)] hover:scale-105',
                  )}
                  style={{ backgroundColor: c.base, boxShadow: `inset 0 0 0 2px ${c.accent}33` }}
                >
                  {selected ? (
                    <Check size={ICON_SIZE.sm} aria-hidden="true" className="drop-shadow" style={{ color: '#fff', mixBlendMode: 'difference' }} />
                  ) : null}
                  <span className="sr-only">
                    {c.name} ({count})
                  </span>
                </button>
              )
            })}
          </div>
        </ShopFilterGroup>
      ) : null,
    size: () =>
      facets.sizes.length > 0 ? (
        <ShopFilterGroup title="In-stock size">
          <div className="flex flex-wrap gap-2" role="listbox" aria-label="Size">
            {facets.sizes.map((s) => {
              const selected = search.size === s
              const count = counts.size[s] ?? 0
              return (
                <PillToggle
                  key={s}
                  label={s}
                  selected={selected}
                  disabled={count === 0 && !selected}
                  onClick={() => onPatch({ size: selected ? '' : s })}
                />
              )
            })}
          </div>
        </ShopFilterGroup>
      ) : null,
    price: () => (
      <ShopFilterGroup title="Price (USD)">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="shop-min-price" className="mb-1 block text-xs text-[var(--shop-text-muted)]">
              Min
            </label>
            <input
              id="shop-min-price"
              type="number"
              inputMode="decimal"
              min={0}
              step={1}
              placeholder={String(facets.priceBounds.min)}
              className="focus-ring h-11 w-full rounded-lg border border-[var(--shop-card-border)] bg-[var(--shop-surface)] px-3 text-sm text-[var(--shop-text)] md:h-10"
              value={search.minPrice ?? ''}
              onChange={(e) =>
                onPatch({ minPrice: e.target.value === '' ? undefined : Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label htmlFor="shop-max-price" className="mb-1 block text-xs text-[var(--shop-text-muted)]">
              Max
            </label>
            <input
              id="shop-max-price"
              type="number"
              inputMode="decimal"
              min={0}
              step={1}
              placeholder={String(facets.priceBounds.max)}
              className="focus-ring h-11 w-full rounded-lg border border-[var(--shop-card-border)] bg-[var(--shop-surface)] px-3 text-sm text-[var(--shop-text)] md:h-10"
              value={search.maxPrice ?? ''}
              onChange={(e) =>
                onPatch({ maxPrice: e.target.value === '' ? undefined : Number(e.target.value) })
              }
            />
          </div>
        </div>
      </ShopFilterGroup>
    ),
  }

  const visible = filterOrder.filter((key) => filterVisibility[key] !== false)

  return (
    <div className="space-y-7">
      {visible.map((key) => {
        const node = groups[key]?.()
        return node ? <div key={key}>{node}</div> : null
      })}
      {!hideReset ? (
        <Button type="button" variant="secondary" className="w-full" onClick={onReset}>
          Reset filters
        </Button>
      ) : null}
    </div>
  )
}
