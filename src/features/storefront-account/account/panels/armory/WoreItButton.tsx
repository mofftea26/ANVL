import { Flame, Minus } from 'lucide-react'
import { useLogWearMutation } from '@/features/passport/hooks/useArmory'
import { cn } from '@/shared/lib/cn'

/**
 * The wear ritual — one tap to log that you trained in the piece. Each tap
 * stokes the forge (flame + count); the count is optimistic so it feels
 * instant. A muted undo appears once there's something to take back.
 *
 * Self-contained: it owns its mutation and writes to the shared owned-list
 * cache, so many buttons on a grid stay in sync without prop threading.
 */
export function WoreItButton({
  passportId,
  wearCount,
  className,
}: {
  passportId: string
  wearCount: number
  className?: string
}) {
  const wear = useLogWearMutation()

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <button
        type="button"
        onClick={() => wear.mutate({ id: passportId, delta: 1 })}
        disabled={wear.isPending}
        aria-label={`Log a wear — worn ${wearCount} ${wearCount === 1 ? 'time' : 'times'}`}
        className="focus-ring group inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklab,var(--color-highlight)_35%,var(--color-line))] bg-[color-mix(in_oklab,var(--color-highlight)_10%,var(--color-surface))] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-heading)] motion-safe:transition-colors hover:border-[var(--color-highlight-bright)] hover:bg-[color-mix(in_oklab,var(--color-highlight)_18%,var(--color-surface))] disabled:opacity-60"
      >
        <Flame
          size={13}
          aria-hidden="true"
          className="text-[var(--color-highlight-bright)] motion-safe:transition-transform group-active:scale-125"
        />
        <span>Wore it</span>
        {wearCount > 0 ? (
          <span className="ml-0.5 rounded-full bg-[var(--color-highlight-bright)] px-1.5 text-[10px] text-[color:var(--color-on-highlight)]">
            {wearCount}
          </span>
        ) : null}
      </button>
      {wearCount > 0 ? (
        <button
          type="button"
          onClick={() => wear.mutate({ id: passportId, delta: -1 })}
          disabled={wear.isPending}
          aria-label="Undo last wear"
          className="focus-ring inline-flex h-6 w-6 items-center justify-center rounded-full text-[var(--color-text-muted)] motion-safe:transition-colors hover:text-[var(--color-text)] disabled:opacity-40"
        >
          <Minus size={12} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}
