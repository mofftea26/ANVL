import { Star } from '@/shared/icons'
import { useSetFeaturedMutation } from '@/features/passport/hooks/useArmory'
import type { OwnedPassport } from '@/features/passport/schemas/passport.schema'
import { cn } from '@/shared/lib/cn'
import { nextFreeHonorSlot } from './honorSlots'

/**
 * The Hall-of-Honor pin — a star toggle on each piece. Pin a piece into the
 * next free shrine slot, or unpin it. When the shrine is full and this piece
 * isn't in it, the star is disabled (unpin one first) rather than silently
 * evicting a favourite.
 */
export function FeaturedPin({
  passport,
  owned,
  className,
}: {
  passport: OwnedPassport
  owned: readonly OwnedPassport[]
  className?: string
}) {
  const setFeatured = useSetFeaturedMutation()
  const isFeatured = passport.featuredSlot !== null
  const freeSlot = nextFreeHonorSlot(owned)
  const canPin = isFeatured || freeSlot !== null

  const label = isFeatured
    ? 'Remove from Hall of Honor'
    : freeSlot !== null
      ? 'Add to Hall of Honor'
      : 'Hall of Honor is full — unpin a piece first'

  return (
    <button
      type="button"
      disabled={!canPin || setFeatured.isPending}
      aria-pressed={isFeatured}
      aria-label={label}
      title={label}
      onClick={() =>
        setFeatured.mutate({
          id: passport.id,
          slot: isFeatured ? null : freeSlot,
        })
      }
      className={cn(
        'focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full motion-safe:transition-colors disabled:opacity-30',
        isFeatured
          ? 'text-[var(--color-highlight-bright)]'
          : 'text-[var(--color-text-muted)] hover:text-[var(--color-highlight-bright)]',
        className,
      )}
    >
      <Star
        size={16}
        aria-hidden="true"
        className={isFeatured ? 'fill-[var(--color-highlight-bright)]' : undefined}
      />
    </button>
  )
}
