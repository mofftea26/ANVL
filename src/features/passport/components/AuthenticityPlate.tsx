import { AnvlCrest } from '@/shared/assets/brand'
import { cn } from '@/shared/lib/cn'

/**
 * The passport's signature visual — a brushed-metal authenticity plate:
 * ANVL crest + "AUTHENTIC ANVL" + the drop / edition context. Deliberately
 * carries NO unit serial number (final product decision): edition size may be
 * shown ("Limited to N pieces"), never a per-unit number.
 */
export function AuthenticityPlate({
  dropLabel,
  editionTotal,
  size = 'md',
  className,
}: {
  dropLabel?: string | null
  editionTotal?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const subline =
    dropLabel?.trim() ||
    (editionTotal && editionTotal > 1 ? `Limited to ${editionTotal} pieces` : 'Product passport')
  const showEdition =
    Boolean(dropLabel?.trim()) && Boolean(editionTotal && editionTotal > 1) && size !== 'sm'

  return (
    <span
      className={cn(
        'inline-flex select-none items-center gap-3 rounded-md border border-[color-mix(in_oklab,var(--color-highlight)_35%,var(--color-line))]',
        'bg-[linear-gradient(160deg,color-mix(in_oklab,var(--color-surface-elevated)_88%,var(--color-highlight))_0%,var(--color-surface)_55%,color-mix(in_oklab,var(--color-surface)_82%,black)_100%)]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-2px_6px_rgba(0,0,0,0.45),0_10px_30px_-14px_rgba(0,0,0,0.8)]',
        size === 'sm' && 'px-3 py-1.5',
        size === 'md' && 'px-5 py-2.5',
        size === 'lg' && 'px-7 py-3.5',
        className,
      )}
    >
      <AnvlCrest
        aria-label="ANVL crest"
        className={cn(
          'shrink-0 text-[var(--color-highlight-bright)]',
          size === 'sm' && 'h-5 w-auto',
          size === 'md' && 'h-8 w-auto',
          size === 'lg' && 'h-11 w-auto',
        )}
      />
      <span className="flex flex-col text-left">
        <span
          className={cn(
            'anvl-heading tracking-[0.2em] text-[var(--color-heading)]',
            '[text-shadow:0_1px_0_rgba(255,255,255,0.08),0_-1px_1px_rgba(0,0,0,0.65)]',
            size === 'sm' && 'text-[11px]',
            size === 'md' && 'text-base',
            size === 'lg' && 'text-2xl',
          )}
        >
          Authentic ANVL
        </span>
        <span
          className={cn(
            'anvl-micro text-[var(--color-text-muted)]',
            size === 'sm' && 'text-[9px]',
          )}
        >
          {subline}
          {showEdition ? ` · Limited to ${editionTotal} pieces` : ''}
        </span>
      </span>
    </span>
  )
}
