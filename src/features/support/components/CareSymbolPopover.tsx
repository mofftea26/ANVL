import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'

/**
 * The forged label card that opens off a care-symbol tile. Portalled to the
 * body and positioned `fixed`, so no ancestor's `overflow` or `transform` can
 * clip or displace it.
 *
 * Placement is collision-aware: above the tile by default, flipped below when
 * there is no room, and clamped inside the viewport horizontally.
 *
 * It is `aria-hidden` on purpose — the tile itself already carries the label
 * as its accessible name and the meaning via `aria-describedby`, so exposing
 * this would only duplicate both.
 */

const GAP = 10
const EDGE = 12

export interface CareSymbolPopoverProps {
  /** The tile the card points at. Nothing renders while this is null. */
  anchorEl: HTMLElement | null
  label: string
  meaning: string
  /** Called when the page scrolls or resizes underneath an open card. */
  onDismiss: () => void
}

export function CareSymbolPopover({
  anchorEl,
  label,
  meaning,
  onDismiss,
}: CareSymbolPopoverProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<CSSProperties>({ top: 0, left: 0, opacity: 0 })

  useLayoutEffect(() => {
    const card = cardRef.current
    if (!card || !anchorEl) return
    const anchor = anchorEl.getBoundingClientRect()
    const rect = card.getBoundingClientRect()

    const above = anchor.top - rect.height - GAP
    const top = above < EDGE ? anchor.bottom + GAP : above

    const centred = anchor.left + anchor.width / 2 - rect.width / 2
    const rightLimit = Math.max(EDGE, window.innerWidth - rect.width - EDGE)
    const left = Math.min(Math.max(EDGE, centred), rightLimit)

    setStyle({ top, left, opacity: 1 })
  }, [anchorEl, label, meaning])

  // Recomputing on scroll would mean a forced layout read per frame; dismiss instead.
  useEffect(() => {
    if (!anchorEl) return
    window.addEventListener('scroll', onDismiss, { passive: true })
    window.addEventListener('resize', onDismiss, { passive: true })
    return () => {
      window.removeEventListener('scroll', onDismiss)
      window.removeEventListener('resize', onDismiss)
    }
  }, [anchorEl, onDismiss])

  if (!anchorEl || typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={cardRef}
      data-care-popover={label}
      aria-hidden="true"
      style={style}
      className="pointer-events-none fixed z-50 max-w-[17rem] min-w-[11rem] rounded-md border border-[var(--color-line)] bg-[var(--color-surface-elevated)] px-4 py-3 shadow-lg"
    >
      <p className="text-xs font-semibold tracking-[0.14em] text-[var(--color-text)] uppercase">
        {label}
      </p>
      <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">{meaning}</p>
    </div>,
    document.body,
  )
}
