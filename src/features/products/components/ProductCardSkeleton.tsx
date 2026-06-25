import { Skeleton } from '@/shared/components/ui/Skeleton'
import { cn } from '@/shared/lib/cn'
import {
  PRODUCT_CARD_VARIANTS,
  type ProductCardVariant,
} from './productCardVariants'

/**
 * Stable-dimension skeleton for the Theoath Modern card — matches the card frame
 * aspect per variant so the grid never shifts when products load in.
 */
export function ProductCardSkeleton({
  variant = 'default',
}: {
  variant?: ProductCardVariant
}) {
  const cfg = PRODUCT_CARD_VARIANTS[variant]
  return (
    <div className="relative" aria-hidden="true" data-testid="product-card-skeleton">
      <div
        className={cn(
          'relative overflow-hidden rounded-md border border-[var(--color-line)] bg-[var(--color-surface-elevated)]',
          cfg.frame,
        )}
      >
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
      </div>
      <div className="mt-2.5 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-10" />
        </div>
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

/**
 * Inline error/empty state for a product card slot (image failure, missing
 * product). Keeps the same footprint so the grid stays stable.
 */
export function ProductCardError({
  variant = 'default',
  message = 'This piece is unavailable right now.',
}: {
  variant?: ProductCardVariant
  message?: string
}) {
  const cfg = PRODUCT_CARD_VARIANTS[variant]
  return (
    <div className="relative" role="note">
      <div
        className={cn(
          'grid place-items-center rounded-md border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] p-6 text-center',
          cfg.frame,
        )}
      >
        <p className="text-sm text-[color:var(--color-text-muted)]">{message}</p>
      </div>
    </div>
  )
}
