import { cn } from '@/shared/lib/cn'
import { formatForgeSerial } from '../schemas/passport.schema'

/**
 * The engraved forge-number plate — the passport's signature visual. A brushed
 * metal chip with the unit serial stamped into it; reused by the teaser,
 * ceremony, passport page, and the Armory cards.
 */
export function ForgeSerialPlate({
  serialNumber,
  editionTotal,
  size = 'md',
  className,
}: {
  serialNumber: number
  editionTotal: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex select-none items-center rounded-md border border-[color-mix(in_oklab,var(--color-highlight)_35%,var(--color-line))]',
        'bg-[linear-gradient(160deg,color-mix(in_oklab,var(--color-surface-elevated)_88%,var(--color-highlight))_0%,var(--color-surface)_55%,color-mix(in_oklab,var(--color-surface)_82%,black)_100%)]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-2px_6px_rgba(0,0,0,0.45),0_10px_30px_-14px_rgba(0,0,0,0.8)]',
        size === 'sm' && 'px-3 py-1.5',
        size === 'md' && 'px-5 py-2.5',
        size === 'lg' && 'px-7 py-3.5',
        className,
      )}
    >
      <span
        className={cn(
          'anvl-heading tracking-[0.18em] text-[var(--color-heading)]',
          '[text-shadow:0_1px_0_rgba(255,255,255,0.08),0_-1px_1px_rgba(0,0,0,0.65)]',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-xl',
          size === 'lg' && 'text-3xl sm:text-4xl',
        )}
      >
        {formatForgeSerial(serialNumber, editionTotal)}
      </span>
    </span>
  )
}
