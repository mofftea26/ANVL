import { useMemo } from 'react'
import { Check } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { cn } from '@/shared/lib/cn'
import type { SharePresetKey } from '../types'
import type { SharePresetOption } from './presetMeta'
import { useRovingRadio } from '../useRovingRadio'

/**
 * The layout picker.
 *
 * You are choosing a LAYOUT, so the control shows layouts: live 9:16 covers
 * drawn by the real preset code. It replaces seven near-identical 20px colour
 * dots that were, on top of being unreadable, painted in hardcoded hex that no
 * longer matched what the renderer drew.
 *
 * Covers stay 9:16 whatever the export format is: their job is to show WHERE
 * the rail or frame sits, and the stage above shows the true crop. That also
 * means changing format never re-renders the strip or changes its height.
 *
 * TWO SHAPES. On a phone it is a horizontally snapping strip bleeding to the
 * sheet edge under a fade — the filter strip everyone already knows, and the
 * right control for a thumb. From `lg` the sheet has a 472px controls column
 * and a mouse, where a horizontal scroller is the WORST control in the room (a
 * wheel does not drive it), so it becomes a four-across grid: all seven visible
 * at once, nothing hidden, cards 110×196 against the phone's 88×156 — a
 * quarter larger on each edge.
 *
 * Seven into four leaves a gap at the end of the second row, which is what a
 * left-aligned grid of any odd count looks like — a product grid, a media
 * library, this one. Three across would close it at the cost of a 3×3 stack
 * ~820px tall inside a ~720px scroller, i.e. a picker taller than the region
 * that holds it. Four stays.
 *
 * There is no longer a photo-gated second family, so the option set never
 * changes underneath the user and the strip needs no scroll-the-selection-back
 * -into-view effect — arrow keys move focus, and focus scrolls itself.
 */
export function SharePresetFilmstrip({
  options,
  value,
  onChange,
  thumbs,
}: {
  options: ReadonlyArray<SharePresetOption>
  value: SharePresetKey
  onChange: (next: SharePresetKey) => void
  thumbs: Partial<Record<SharePresetKey, string>>
}) {
  const keys = useMemo(() => options.map((option) => option.key), [options])
  const { register, onKeyDown } = useRovingRadio(keys, value, onChange)

  return (
    <div className="mt-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="anvl-micro text-[10px] text-[var(--color-text-muted)]">The layout</p>
        {/* The old line here taught a coupling — "3 without a photo" — that the
            renderer no longer enforces. What replaces it states the invariant:
            the set is fixed, and a photo swaps the hero, not the choice. */}
        <p className="text-[10px] text-[var(--color-text-muted)]">
          {options.length} layouts · photo optional
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="Layout"
        onKeyDown={onKeyDown}
        className={cn(
          'mt-2 -mx-5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-5 pb-1',
          // Bleeding to the sheet edge under a fade is what says "there is more".
          '[mask-image:linear-gradient(90deg,transparent_0,black_20px,black_calc(100%-24px),transparent)]',
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          // Nothing is off-screen in the grid, so the edge fade and the bleed
          // both come off with it.
          'lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-x-visible lg:px-0 lg:[mask-image:none]',
        )}
      >
        {options.map((option) => {
          const selected = option.key === value
          const thumb = thumbs[option.key]
          return (
            <button
              key={option.key}
              ref={register(option.key)}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${option.label} — ${option.hint}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(option.key)}
              className={cn(
                'focus-ring relative h-[156px] w-[88px] shrink-0 snap-start overflow-hidden rounded-lg',
                'motion-safe:transition-transform',
                // In the grid the cell decides the width and 9:16 decides the
                // rest — the cards must not stay 88px in a 472px column.
                'lg:h-auto lg:w-full lg:aspect-[9/16]',
                selected
                  ? 'ring-2 ring-[var(--color-highlight-bright)] shadow-[0_10px_26px_-10px_color-mix(in_oklab,var(--color-highlight)_75%,transparent)] motion-safe:scale-[1.04]'
                  : 'ring-1 ring-inset ring-[var(--color-line)]',
              )}
            >
              {thumb ? (
                <img
                  src={thumb}
                  alt=""
                  aria-hidden="true"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="anvl-grid-overlay absolute inset-0 bg-[var(--color-surface-elevated)]"
                />
              )}

              {selected ? (
                <span
                  aria-hidden="true"
                  className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-[var(--color-highlight-bright)] text-[color:var(--color-on-highlight)]"
                >
                  <Check size={ICON_SIZE.xs} />
                </span>
              ) : null}

              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,color-mix(in_oklab,var(--color-bg)_92%,transparent),transparent)] px-1.5 pb-1.5 pt-4"
              >
                <span
                  className={cn(
                    'anvl-micro block truncate text-[9px] tracking-[0.1em]',
                    selected ? 'text-[var(--color-heading)]' : 'text-[var(--color-text-muted)]',
                  )}
                >
                  {option.label}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
