import { cn } from '@/shared/lib/cn'
import type { ResolvedPassportContent } from '../lib/resolvePassportContent'

/**
 * Design-detail markers pinned to the product render. Champagne dots pulse
 * over the piece; selecting one dims the rest and hands the detail to the
 * caller (the console reveals it beside the piece, the mobile passport in a
 * sheet under it). Positions are % of the image box, so they hold at any size.
 *
 * Pointer-transparent except the markers themselves — the render underneath
 * keeps its sheen and never intercepts clicks it doesn't own.
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
  if (hotspots.length === 0) return null

  return (
    <div className="pointer-events-none absolute inset-0">
      {hotspots.map((hotspot, i) => {
        const isActive = activeIndex === i
        const dimmed = activeIndex !== null && !isActive
        return (
          <button
            key={`${hotspot.title}-${i}`}
            type="button"
            aria-label={hotspot.title}
            aria-pressed={isActive}
            onClick={() => onSelect(isActive ? null : i)}
            style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
            className={cn(
              'focus-ring pointer-events-auto absolute grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full',
              'motion-safe:transition-opacity motion-safe:duration-300',
              dimmed ? 'opacity-30' : 'opacity-100',
            )}
          >
            {/* Pulse ring — the invitation. Stops once a detail is open so the
                composition goes quiet while you read. */}
            <span
              aria-hidden="true"
              className={cn(
                'absolute h-3.5 w-3.5 rounded-full border border-[var(--color-highlight-bright)]',
                activeIndex === null &&
                  'motion-safe:animate-ping motion-reduce:animate-none',
              )}
            />
            <span
              aria-hidden="true"
              className={cn(
                'relative h-2.5 w-2.5 rounded-full shadow-[0_0_10px_2px_color-mix(in_oklab,var(--color-highlight)_55%,transparent)] motion-safe:transition-transform motion-safe:duration-300',
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
