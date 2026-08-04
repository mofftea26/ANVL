import { useRef } from 'react'
import { Image as ImageIcon } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import { isLikelySafeMediaSrc } from '@/shared/lib/url'

/** A point pinned to the render, as PERCENT of the image box (0–100). */
export interface PlacedPoint {
  x: number
  y: number
}

/** What the canvas needs to draw one dot. */
export interface CanvasMarker extends PlacedPoint {
  /** Appended to the dot's accessible name, e.g. the marker's label. */
  name?: string
}

function toPercent(raw: number): number {
  return Math.min(100, Math.max(0, Number(raw.toFixed(2))))
}

/**
 * Interpret one click on the canvas.
 *
 * Two gestures share a single click target on purpose. Nothing armed, the
 * click APPENDS a point — dropping five markers in a row then costs five
 * clicks, not five clicks plus five "add" presses. A row armed via its Move
 * button, the click MOVES that point instead and the caller disarms. Kept out
 * of the component (and generic over the item shape) because the design-detail
 * hotspots and the per-section readouts store different fields around the same
 * two coordinates, and this rule is the thing worth testing.
 */
export function applyPlacement<T extends PlacedPoint>(
  items: readonly T[],
  movingIndex: number | null,
  x: number,
  y: number,
  createAt: (x: number, y: number) => T,
): { next: T[]; selected: number } {
  if (movingIndex !== null && items[movingIndex]) {
    return {
      next: items.map((item, i) => (i === movingIndex ? { ...item, x, y } : item)),
      selected: movingIndex,
    }
  }
  const next = [...items, createAt(x, y)]
  return { next, selected: next.length - 1 }
}

/**
 * Click-to-place canvas: the product render with numbered percent-positioned
 * dots over it. Percent of the image box (not pixels) is what lets a marker
 * hold its spot at every size the storefront draws the piece at.
 *
 * Fully controlled — the caller owns the list and decides what a click means
 * (see {@link applyPlacement}).
 */
export function MarkerPlacerCanvas({
  imageUrl,
  markers,
  selectedIndex,
  movingIndex,
  onSelectMarker,
  onPlace,
  dimFrom,
  emptyBody,
  onGoToPiece,
}: {
  /** Resolved hero-render URL, or null when none is assigned yet. */
  imageUrl: string | null
  markers: CanvasMarker[]
  selectedIndex: number | null
  /** Index armed for repositioning — the next click moves it. */
  movingIndex: number | null
  onSelectMarker: (index: number) => void
  /** Fired with the clicked position as percents (0–100, 2 decimals). */
  onPlace: (x: number, y: number) => void
  /** Markers from this index on are drawn faded — the effect will not show them. */
  dimFrom?: number
  /** Sentence explaining what this particular canvas is for, in the empty state. */
  emptyBody: string
  /** Jumps to the tab that assigns the hero render. Omitted → no button. */
  onGoToPiece?: () => void
}) {
  const boxRef = useRef<HTMLDivElement>(null)

  // A CMS-supplied src goes straight into the DOM here, so it passes the same
  // guard the media slot fields use before it is ever rendered.
  if (!imageUrl || !isLikelySafeMediaSrc(imageUrl)) {
    return <NoRenderNotice body={emptyBody} onGoToPiece={onGoToPiece} />
  }

  const place = (event: React.MouseEvent<HTMLDivElement>) => {
    const box = boxRef.current?.getBoundingClientRect()
    if (!box || box.width < 4 || box.height < 4) return
    onPlace(
      toPercent(((event.clientX - box.left) / box.width) * 100),
      toPercent(((event.clientY - box.top) / box.height) * 100),
    )
  }

  return (
    <div className="space-y-2">
      <div
        ref={boxRef}
        onClick={place}
        className="relative mx-auto w-full max-w-xs cursor-crosshair overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]"
      >
        <img
          src={imageUrl}
          alt=""
          draggable={false}
          className="h-auto w-full select-none object-contain"
        />
        {markers.map((marker, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Marker ${i + 1}${marker.name ? `: ${marker.name}` : ''}`}
            aria-pressed={selectedIndex === i}
            onClick={(event) => {
              event.stopPropagation()
              onSelectMarker(i)
            }}
            style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
            className={cn(
              // The dot stays 24px: growing it to the 44px minimum would hide
              // the very pixels the editor is aiming at. The touch target is
              // an invisible 44px pseudo-element centred on the same point.
              'focus-ring absolute grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 text-[9px] font-bold transition-transform',
              "before:absolute before:left-1/2 before:top-1/2 before:h-11 before:w-11 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:content-['']",
              selectedIndex === i
                ? 'scale-125 border-[var(--color-highlight-bright)] bg-[var(--color-highlight)] text-[color:var(--color-on-highlight)]'
                : 'border-[var(--color-highlight-bright)] bg-[var(--color-bg)]/80 text-[var(--color-highlight-bright)]',
              dimFrom !== undefined && i >= dimFrom && 'opacity-40',
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <p
        role="status"
        className="text-center text-xs text-[var(--color-text-muted)]"
      >
        {movingIndex === null
          ? 'Click the render to drop a marker.'
          : `Click the render to move marker ${movingIndex + 1}.`}
      </p>
    </div>
  )
}

/**
 * Shown instead of the canvas when no hero render is assigned.
 *
 * This used to be one grey sentence, which read as "this editor is broken"
 * rather than "one asset is missing" — the single most common reason an editor
 * concluded there was no marker editor at all. It now names the blocker and
 * carries the jump to the tab that fixes it.
 */
function NoRenderNotice({
  body,
  onGoToPiece,
}: {
  body: string
  onGoToPiece?: () => void
}) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-bg)]/30 p-6 text-center">
      <ImageIcon
        size={ICON_SIZE.xl}
        aria-hidden="true"
        className="mx-auto text-[var(--color-text-muted)]"
      />
      <p className="anvl-micro mt-2 text-[var(--color-text)]">
        No hero render to place markers on
      </p>
      <p className="mx-auto mt-1 max-w-sm text-xs text-[var(--color-text-muted)]">
        {body} Assign the transparent product PNG under{' '}
        <strong className="font-semibold text-[var(--color-text)]">The piece</strong>, then
        come back — markers are pinned to that exact image.
      </p>
      {onGoToPiece ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          density="compact"
          className="mt-3"
          onClick={onGoToPiece}
        >
          Open “The piece”
        </Button>
      ) : null}
    </div>
  )
}
