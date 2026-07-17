import { Check, Flame, Minus } from '@/shared/icons'
import { useLogWearMutation } from '@/features/passport/hooks/useArmory'
import { cn } from '@/shared/lib/cn'

/** True when the piece was worn within the last 24h (cooldown active). */
function wornWithin24h(lastWornAt: string | null): boolean {
  if (!lastWornAt) return false
  const t = Date.parse(lastWornAt)
  return Number.isFinite(t) && Date.now() - t < 24 * 60 * 60 * 1000
}

/**
 * The wear ritual — one tap a day to log that you trained in the piece. Each
 * tap stokes the forge (flame + count); the count is optimistic so it feels
 * instant. Wear is limited to once per 24h (server-enforced): within the
 * cooldown the button reads "Worn today" and is disabled. A muted undo appears
 * once there's something to take back.
 */
export function WoreItButton({
  passportId,
  wearCount,
  lastWornAt,
  className,
}: {
  passportId: string
  wearCount: number
  lastWornAt: string | null
  className?: string
}) {
  const wear = useLogWearMutation()
  const onCooldown = wornWithin24h(lastWornAt)

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <button
        type="button"
        onClick={() => wear.mutate({ id: passportId, delta: 1 })}
        disabled={wear.isPending || onCooldown}
        aria-label={
          onCooldown
            ? `Worn today — worn ${wearCount} ${wearCount === 1 ? 'time' : 'times'} total`
            : `Log a wear — worn ${wearCount} ${wearCount === 1 ? 'time' : 'times'}`
        }
        className={cn(
          'focus-ring group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] motion-safe:transition-colors',
          onCooldown
            ? 'cursor-default border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-text-muted)]'
            : 'border-[color-mix(in_oklab,var(--color-highlight)_35%,var(--color-line))] bg-[color-mix(in_oklab,var(--color-highlight)_10%,var(--color-surface))] text-[var(--color-heading)] hover:border-[var(--color-highlight-bright)] hover:bg-[color-mix(in_oklab,var(--color-highlight)_18%,var(--color-surface))] disabled:opacity-60',
        )}
      >
        {onCooldown ? (
          <Check size={13} aria-hidden="true" className="text-[var(--color-success)]" />
        ) : (
          <Flame
            size={13}
            aria-hidden="true"
            className="text-[var(--color-highlight-bright)] motion-safe:transition-transform group-active:scale-125"
          />
        )}
        <span>{onCooldown ? 'Worn today' : 'Wore it'}</span>
        {wearCount > 0 ? (
          <span
            className={cn(
              'ml-0.5 rounded-full px-1.5 text-[10px]',
              onCooldown
                ? 'bg-[var(--color-surface-elevated)] text-[var(--color-text)]'
                : 'bg-[var(--color-highlight-bright)] text-[color:var(--color-on-highlight)]',
            )}
          >
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
          className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-muted)] motion-safe:transition-colors hover:text-[var(--color-text)] disabled:opacity-40"
        >
          <Minus size={12} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}
