import { useRef } from 'react'

import { useContainedMediaRect } from '@/shared/hooks/useContainedMediaRect'
import { cn } from '@/shared/lib/cn'
import type { ResolvedPassportContent } from '../lib/resolvePassportContent'

/**
 * Design-detail markers pinned to the product render. Champagne dots pulse
 * over the piece; selecting one dims the rest and hands the detail to the
 * caller (the console reveals it beside the piece, the mobile passport in a
 * sheet under it).
 *
 * Positions are a percent of the IMAGE, and the render is `object-contain`, so
 * they are measured against the letterboxed sub-rect rather than the box.
 * A percent of the BOX only coincides with a percent of the image when the two
 * aspect ratios happen to match — every other product silently drifted, and a
 * marker that sits confidently on the wrong seam is worse than none at all.
 */
export function PassportHotspots({
  hotspots,
  activeIndex,
  onSelect,
}: {
  hotspots: ResolvedPassportContent['hotspots']
  activeIndex: number | null
  onSelect: (index: number | null) => void
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const mediaRect = useContainedMediaRect(boxRef, 'img')

  if (hotspots.length === 0) return null

  return (
    <div ref={boxRef} className="pointer-events-none absolute inset-0">
      {hotspots.map((hotspot, i) => {
        const isActive = activeIndex === i
        const dimmed = activeIndex !== null && !isActive
        // `h-11 w-11` on the button is the 44×44 TOUCH TARGET, not the mark:
        // it is invisible, and it is the one size here that must never move.
        // The painted ring and dot are sized independently for that reason —
        // trimming what you SEE is not the same as trimming what you can hit.
        return (
          <button
            key={`${hotspot.title}-${i}`}
            type="button"
            aria-label={hotspot.title}
            aria-pressed={isActive}
            onClick={() => onSelect(isActive ? null : i)}
            style={
              mediaRect
                ? {
                    left: mediaRect.left + (hotspot.x / 100) * mediaRect.width,
                    top: mediaRect.top + (hotspot.y / 100) * mediaRect.height,
                  }
                : // Before the first measure the image has no natural size yet;
                  // percent of the box is the best guess available and settles
                  // on the very next frame.
                  { left: `${hotspot.x}%`, top: `${hotspot.y}%` }
            }
            className={cn(
              'focus-ring pointer-events-auto absolute grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full',
              'motion-safe:transition-opacity motion-safe:duration-300',
              dimmed ? 'opacity-30' : 'opacity-100',
            )}
          >
            {/* Pulse ring — the invitation. Stops once a detail is open so the
                composition goes quiet while you read. 12px: a trim from 14, so
                the marks sit ON the seams they name instead of covering them. */}
            <span
              aria-hidden="true"
              className={cn(
                'absolute h-3 w-3 rounded-full border border-[var(--color-highlight-bright)]',
                activeIndex === null &&
                  'motion-safe:animate-ping motion-reduce:animate-none',
              )}
            />
            {/* 8px, trimmed from 10 — selected it scales to the ring's own 12. */}
            <span
              aria-hidden="true"
              className={cn(
                'relative h-2 w-2 rounded-full shadow-[0_0_10px_2px_color-mix(in_oklab,var(--color-highlight)_55%,transparent)] motion-safe:transition-transform motion-safe:duration-300',
                isActive
                  ? 'scale-150 bg-[var(--color-highlight-bright)]'
                  : 'bg-[var(--color-highlight-bright)]',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

/** The selected detail's copy — rendered wherever the surface has room. */
export function PassportHotspotDetail({
  hotspot,
  index,
  total,
  onDismiss,
  className,
}: {
  hotspot: ResolvedPassportContent['hotspots'][number]
  index: number
  total: number
  onDismiss: () => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[color-mix(in_oklab,var(--color-highlight)_35%,var(--color-line))] bg-[color-mix(in_oklab,var(--color-surface)_92%,transparent)] p-5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="anvl-micro text-[var(--color-highlight-bright)]">
            Detail {index + 1} of {total}
          </p>
          <h3 className="anvl-heading mt-1 text-lg text-[var(--color-heading)]">
            {hotspot.title}
          </h3>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="focus-ring anvl-micro shrink-0 text-[10px] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
        >
          Close
        </button>
      </div>
      {hotspot.body ? (
        <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
          {hotspot.body}
        </p>
      ) : null}
    </div>
  )
}
