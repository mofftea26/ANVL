import { X } from '@/shared/icons'
import type { ShopActiveChip } from '@/features/products/shop/hooks/useShopFilters'

/**
 * Removable active-filter chips + a clear-all control. Each chip is a real
 * `<button>` (keyboard + SR accessible) that removes exactly its own filter;
 * clear-all resets every filter at once.
 */
export function ActiveFilterList({
  chips,
  onClearAll,
}: {
  chips: ShopActiveChip[]
  onClearAll: () => void
}) {
  if (chips.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="anvl-micro mr-1 text-[var(--shop-text-muted)]">Filtering</span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          aria-label={`Remove filter ${chip.label}`}
          className="focus-ring group inline-flex items-center gap-1.5 rounded-full border border-[var(--shop-card-border)] bg-[var(--shop-chip-selected)] py-1.5 pl-3 pr-2 text-xs text-[var(--shop-text)] transition-colors hover:border-[var(--shop-accent)] hover:text-[var(--shop-accent)]"
        >
          <span className="max-w-[14rem] truncate">{chip.label}</span>
          <X size={15} aria-hidden="true" className="opacity-70 group-hover:opacity-100" />
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="focus-ring anvl-micro ml-1 rounded-full px-2 py-1.5 text-[var(--shop-text-muted)] underline-offset-4 transition-colors hover:text-[var(--shop-accent)] hover:underline"
      >
        Clear all
      </button>
    </div>
  )
}
