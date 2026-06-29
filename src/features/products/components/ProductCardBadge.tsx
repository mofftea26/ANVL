import type { Product } from '@/features/products/types/product.types'
import { cn } from '@/shared/lib/cn'

type BadgeTone = 'accent' | 'muted' | 'warning' | 'success'

const TONE_CLASS: Record<BadgeTone, string> = {
  accent:
    'border-[var(--shop-accent)] bg-[var(--shop-chip-selected)] text-[var(--shop-accent)]',
  muted:
    'border-[var(--shop-card-border)] bg-[var(--shop-overlay)] text-[var(--shop-text-muted)]',
  warning:
    'border-[color-mix(in_srgb,var(--shop-warning)_55%,transparent)] bg-[color-mix(in_srgb,var(--shop-warning)_16%,transparent)] text-[var(--shop-warning)]',
  success:
    'border-[color-mix(in_srgb,var(--shop-success)_55%,transparent)] bg-[color-mix(in_srgb,var(--shop-success)_16%,transparent)] text-[var(--shop-success)]',
}

/** Resolve the single most relevant badge for a product, or null. */
export function resolveProductBadge(
  product: Product,
  showInventoryUrgency: boolean,
): { label: string; tone: BadgeTone } | null {
  const status = product.shop?.storefrontStatus
  switch (status) {
    case 'outOfStock':
      return { label: 'Sold out', tone: 'muted' }
    case 'comingSoon':
      return { label: 'Coming soon', tone: 'warning' }
    case 'sale':
      return { label: 'Sale', tone: 'accent' }
    case 'limitedEdition':
      return { label: 'Limited', tone: 'accent' }
    default:
      break
  }
  // Real low-stock urgency, only when the CMS opts in and data supports it.
  if (showInventoryUrgency && isLowStock(product)) {
    return { label: 'Low stock', tone: 'warning' }
  }
  return null
}

function isLowStock(product: Product): boolean {
  const map = product.shop?.availabilityByColorAndSize
  if (!map) return false
  let total = 0
  for (const row of Object.values(map)) {
    for (const n of Object.values(row)) total += Math.max(0, n)
  }
  return total > 0 && total <= 5
}

/**
 * Theme-aware product badge. Never communicates state by color alone — every
 * badge carries a text label. Returns null when there is nothing to flag.
 */
export function ProductCardBadge({
  product,
  showInventoryUrgency,
  className,
}: {
  product: Product
  showInventoryUrgency: boolean
  className?: string
}) {
  const badge = resolveProductBadge(product, showInventoryUrgency)
  if (!badge) return null
  return (
    <span
      className={cn(
        'anvl-micro pointer-events-none inline-flex items-center rounded-full border px-2.5 py-1 text-[0.6rem] tracking-[0.18em] backdrop-blur-sm',
        TONE_CLASS[badge.tone],
        className,
      )}
    >
      {badge.label}
    </span>
  )
}
