import type { ShopDropFilterOption, StorefrontProductStatus } from '@/features/products/types/product.types'
import { Button } from '@/shared/components/ui'
import type { ShopUrlSearch } from './shopUrlSearch'
import { SHOP_STATUS_FILTERS } from './shopUrlSearch'

type ShopFiltersFormProps = {
  drops: ShopDropFilterOption[]
  colors: string[]
  sizes: string[]
  priceBounds: { min: number; max: number }
  search: ShopUrlSearch
  onPatch: (patch: Partial<ShopUrlSearch>) => void
  onReset: () => void
}

function statusLabel(s: StorefrontProductStatus): string {
  switch (s) {
    case 'available':
      return 'Available'
    case 'comingSoon':
      return 'Coming soon'
    case 'outOfStock':
      return 'Out of stock'
    case 'sale':
      return 'Sale'
    case 'limitedEdition':
      return 'Limited'
    default:
      return s
  }
}

function parseCsvStatuses(raw: string): StorefrontProductStatus[] {
  if (!raw.trim()) return []
  const allowed = new Set<string>(SHOP_STATUS_FILTERS)
  return raw
    .split(',')
    .map((x) => x.trim())
    .filter((x): x is StorefrontProductStatus => allowed.has(x))
}

function toggleStatus(csv: string, s: StorefrontProductStatus): string {
  const cur = new Set(parseCsvStatuses(csv))
  if (cur.has(s)) cur.delete(s)
  else cur.add(s)
  return [...cur].join(',')
}

export function ShopFiltersForm({
  drops,
  colors,
  sizes,
  priceBounds,
  search,
  onPatch,
  onReset,
}: ShopFiltersFormProps) {
  const selectedStatuses = new Set(parseCsvStatuses(search.status))

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="anvl-micro mb-3">Status</legend>
        <div className="flex flex-col gap-2">
          {SHOP_STATUS_FILTERS.map((s) => (
            <label key={s} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[var(--color-line)]"
                checked={selectedStatuses.has(s)}
                onChange={() => onPatch({ status: toggleStatus(search.status, s) })}
              />
              <span>{statusLabel(s)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="shop-filter-drop" className="anvl-micro mb-2 block">
          Drop
        </label>
        <select
          id="shop-filter-drop"
          className="focus-ring w-full rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm"
          value={search.drop}
          onChange={(e) => onPatch({ drop: e.target.value })}
        >
          <option value="">Any drop</option>
          {drops.map((d) => (
            <option key={d.id} value={d.slug}>
              {d.dropNumber}: {d.name}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="anvl-micro mb-3">Listing source</legend>
        <div className="flex flex-col gap-2 text-sm">
          {(
            [
              ['all', 'All'],
              ['drop', 'Drop release'],
              ['individual', 'Individual'],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="shop-source"
                className="h-4 w-4 border-[var(--color-line)]"
                checked={search.source === value}
                onChange={() => onPatch({ source: value })}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="shop-filter-color" className="anvl-micro mb-2 block">
          Colorway
        </label>
        <select
          id="shop-filter-color"
          className="focus-ring w-full rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm"
          value={search.color}
          onChange={(e) => onPatch({ color: e.target.value })}
        >
          <option value="">Any color</option>
          {colors.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="shop-filter-size" className="anvl-micro mb-2 block">
          In-stock size
        </label>
        <select
          id="shop-filter-size"
          className="focus-ring w-full rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm"
          value={search.size}
          onChange={(e) => onPatch({ size: e.target.value })}
        >
          <option value="">Any size</option>
          {sizes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="anvl-micro mb-3">Price (USD)</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="shop-min-price" className="mb-1 block text-xs text-[var(--color-text-muted)]">
              Min
            </label>
            <input
              id="shop-min-price"
              type="number"
              inputMode="decimal"
              min={0}
              step={1}
              placeholder={String(priceBounds.min)}
              className="focus-ring w-full rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm"
              value={search.minPrice ?? ''}
              onChange={(e) => {
                const v = e.target.value
                onPatch({ minPrice: v === '' ? undefined : Number(v) })
              }}
            />
          </div>
          <div>
            <label htmlFor="shop-max-price" className="mb-1 block text-xs text-[var(--color-text-muted)]">
              Max
            </label>
            <input
              id="shop-max-price"
              type="number"
              inputMode="decimal"
              min={0}
              step={1}
              placeholder={String(priceBounds.max)}
              className="focus-ring w-full rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm"
              value={search.maxPrice ?? ''}
              onChange={(e) => {
                const v = e.target.value
                onPatch({ maxPrice: v === '' ? undefined : Number(v) })
              }}
            />
          </div>
        </div>
      </div>

      <Button type="button" variant="secondary" className="w-full" onClick={onReset}>
        Reset filters
      </Button>
    </div>
  )
}
