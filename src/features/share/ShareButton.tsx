import { Share2 } from '@/shared/icons'
import { cn } from '@/shared/lib/cn'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { ShareModal } from './ShareModal'
import { useShareLauncher } from './useShareLauncher'

/**
 * The share entry point — one icon, everywhere. First tap also enables public
 * sharing and mints the armory handle; the sheet opens straight away and shows
 * its own preparing state while that lands.
 */
export function ShareButton({
  pieceSlug = null,
  pieceImageUrl = null,
  allowPiecePicker = false,
  label = 'Share',
  className,
}: {
  pieceSlug?: string | null
  pieceImageUrl?: string | null
  allowPiecePicker?: boolean
  label?: string
  className?: string
}) {
  const launcher = useShareLauncher({ pieceSlug })

  return (
    <>
      <button
        type="button"
        onClick={() => launcher.open()}
        aria-label={label}
        title={label}
        className={cn(
          'focus-ring grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[color-mix(in_oklab,var(--color-highlight)_35%,var(--color-line))] bg-[color-mix(in_oklab,var(--color-highlight)_10%,var(--color-surface))] text-[var(--color-heading)] motion-safe:transition-colors hover:border-[var(--color-highlight-bright)] hover:bg-[color-mix(in_oklab,var(--color-highlight)_18%,var(--color-surface))]',
          className,
        )}
      >
        <Share2 size={ICON_SIZE.md} aria-hidden="true" className="block" />
      </button>
      {/* Mounted only while open — the sheet pulls the catalog and profile. */}
      {launcher.isOpen ? (
        <ShareModal
          open
          onClose={launcher.close}
          initialPieceSlug={launcher.initialPieceSlug}
          initialFeatId={launcher.initialFeatId}
          pieceImageUrl={pieceImageUrl}
          allowPiecePicker={allowPiecePicker}
        />
      ) : null}
    </>
  )
}
