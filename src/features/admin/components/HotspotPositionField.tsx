import { useRef } from 'react'
import { cn } from '@/shared/lib/cn'

export interface HotspotMarkerPoint {
  /** Percent of the image box, 0–100. */
  x: number
  /** Percent of the image box, 0–100. */
  y: number
  /** Optional accessible label suffix (e.g. the hotspot's title). */
  label?: string
}

function toPercent(raw: number): number {
  return Math.min(100, Math.max(0, Number(raw.toFixed(2))))
}

/**
 * Click-to-place position picker (adapted from the passports HotspotPlacer):
 * renders an image with numbered percent-positioned markers; clicking the
 * image reports a clamped 2-decimal percent position for the SELECTED marker,
 * clicking a marker selects it. Purely controlled — the caller owns the data
 * (e.g. RHF numeric inputs) and markers follow it live.
 */
export function HotspotPositionField({
  imageUrl,
  markers,
  selectedIndex,
  onSelectMarker,
  onPlace,
  emptyHint,
  className,
}: {
  imageUrl: string | null
  markers: HotspotMarkerPoint[]
  selectedIndex: number | null
  onSelectMarker: (index: number) => void
  /** Fired with the clicked position as percents (0–100, 2 decimals). */
  onPlace: (x: number, y: number) => void
  emptyHint?: string
  className?: string
}) {
  const imageRef = useRef<HTMLDivElement>(null)

  if (!imageUrl) {
    return (
      <p
        className={cn(
          'rounded-xl border border-dashed border-[var(--color-line)] p-6 text-center text-xs text-[var(--color-text-muted)]',
          className,
        )}
      >
        {emptyHint ?? 'Assign an image first — markers are placed on it.'}
      </p>
    )
  }

  const place = (e: React.MouseEvent<HTMLDivElement>) => {
    const box = imageRef.current?.getBoundingClientRect()
    if (!box || box.width < 4) return
    const x = ((e.clientX - box.left) / box.width) * 100
    const y = ((e.clientY - box.top) / box.height) * 100
    onPlace(toPercent(x), toPercent(y))
  }

  return (
    <div
      ref={imageRef}
      onClick={place}
      className={cn(
        'relative mx-auto w-full max-w-xs cursor-crosshair overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]',
        className,
      )}
    >
      <img src={imageUrl} alt="" className="h-auto w-full select-none object-contain" />
      {markers.map((m, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Marker ${i + 1}${m.label ? `: ${m.label}` : ''}`}
          aria-pressed={selectedIndex === i}
          onClick={(e) => {
            e.stopPropagation()
            onSelectMarker(i)
          }}
          style={{ left: `${m.x}%`, top: `${m.y}%` }}
          className={cn(
            'focus-ring absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 text-[9px] font-bold transition-transform',
            selectedIndex === i
              ? 'scale-125 border-[var(--color-highlight-bright)] bg-[var(--color-highlight)] text-[color:var(--color-on-highlight)]'
              : 'border-[var(--color-highlight-bright)] bg-[var(--color-bg)]/80 text-[var(--color-highlight-bright)]',
          )}
        >
          {i + 1}
        </button>
      ))}
    </div>
  )
}
