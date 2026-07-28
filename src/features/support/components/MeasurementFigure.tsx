import { useId, useRef, useState } from 'react'
import { cn } from '@/shared/lib/cn'
import type { SizeTableRowKey } from '@/features/cms/support/supportContent.zod'
import type { ResolvedMeasurePoint } from '@/features/cms/support/resolveSupportContent'
import { useSchematicDrawIn } from '../hooks/useSchematicDrawIn'
import { GarmentSchematicSvg } from './GarmentSchematicSvg'
import { getGarmentSchematic } from './garments'

/**
 * "Where we measure" — the schematic and its written companion, linked both
 * ways. Hovering or focusing a row lights its dimension line and badge;
 * hovering a line on the drawing lights the row.
 *
 * The drawing is `aria-hidden`: the list is the accessible source of truth, so
 * every row is a real focusable control and every description is wired through
 * `aria-describedby`. Highlight is never colour alone — the active row gains a
 * rule and a weight change alongside the tint.
 */

export interface MeasurementFigureProps {
  /** Which schematic to draw. Unknown keys fall back to the tee. */
  garmentTypeKey: string
  /** Caption label for the drawing, e.g. "Hoodie". */
  garmentTypeLabel: string
  /** Resolved measurement points, in list order. */
  points: readonly ResolvedMeasurePoint[]
  /** Optional note printed under the list. */
  footnote?: string
  className?: string
}

export function MeasurementFigure({
  garmentTypeKey,
  garmentTypeLabel,
  points,
  footnote,
  className,
}: MeasurementFigureProps) {
  const [activeKey, setActiveKey] = useState<SizeTableRowKey | null>(null)
  const [pinnedKey, setPinnedKey] = useState<SizeTableRowKey | null>(null)
  const figureRef = useRef<HTMLDivElement>(null)
  const baseId = useId()
  const schematic = getGarmentSchematic(garmentTypeKey)

  useSchematicDrawIn(figureRef, [schematic.key])

  const highlighted = activeKey ?? pinnedKey
  const letters = points.map((point) => point.letter).filter(Boolean)
  const range =
    letters.length > 1 ? `${letters[0]}–${letters[letters.length - 1]}` : (letters[0] ?? '')

  return (
    <div
      className={cn(
        'grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12',
        className,
      )}
    >
      <div ref={figureRef} className="relative">
        <div className="relative rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-5 sm:p-7">
          <RegistrationMarks />
          <GarmentSchematicSvg
            schematic={schematic}
            points={points}
            activeKey={highlighted}
            onHoverKey={setActiveKey}
            className="mx-auto max-h-[26rem]"
          />
        </div>
        <p className="mt-3 flex items-center justify-between gap-4 text-[0.6875rem] tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
          <span>{garmentTypeLabel} · flat lay</span>
          {range ? <span aria-hidden="true">{range}</span> : null}
        </p>
      </div>

      <div>
        <ol className="space-y-1">
          {points.map((point) => {
            const isActive = highlighted === point.key
            const descriptionId = `${baseId}-${point.key}`
            return (
              <li
                key={point.key}
                data-measure-key={point.key}
                data-active={isActive ? 'true' : undefined}
                onPointerEnter={() => setActiveKey(point.key)}
                onPointerLeave={() => setActiveKey(null)}
                className={cn(
                  'rounded-r-md border-l-2 py-1 pr-2 pl-3 transition-colors',
                  isActive
                    ? 'border-[var(--color-highlight-bright)] bg-[var(--color-highlight-soft)]'
                    : 'border-transparent',
                )}
              >
                <button
                  type="button"
                  aria-describedby={descriptionId}
                  aria-pressed={pinnedKey === point.key}
                  onFocus={() => setActiveKey(point.key)}
                  onBlur={() => setActiveKey(null)}
                  onClick={() =>
                    setPinnedKey((current) => (current === point.key ? null : point.key))
                  }
                  className="focus-ring flex min-h-11 w-full items-center gap-3 text-left"
                >
                  <LetterChip letter={point.letter} active={isActive} />
                  <span
                    className={cn(
                      'text-sm sm:text-base',
                      isActive
                        ? 'font-semibold text-[var(--color-text)]'
                        : 'font-medium text-[var(--color-text-muted)]',
                    )}
                  >
                    {point.label}
                  </span>
                </button>
                <p
                  id={descriptionId}
                  className="pb-2 pl-11 text-sm text-[var(--color-text-muted)]"
                >
                  {point.description}
                </p>
              </li>
            )
          })}
        </ol>
        {footnote?.trim() ? (
          <p className="mt-5 border-t border-[var(--color-line)] pt-4 text-xs text-[var(--color-text-muted)]">
            {footnote}
          </p>
        ) : null}
      </div>
    </div>
  )
}

/** The letter as a stamped die mark — square, not a pill. */
function LetterChip({ letter, active }: { letter: string; active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid h-8 w-8 shrink-0 place-items-center rounded-sm border text-sm font-bold transition-colors',
        active
          ? 'border-[var(--color-highlight-bright)] bg-[var(--color-highlight-bright)] text-[var(--color-on-highlight-bright)]'
          : 'border-[var(--color-line)] bg-[var(--color-surface-elevated)] text-[var(--color-text)]',
      )}
    >
      {letter}
    </span>
  )
}

/** Drafting registration marks at the sheet corners. */
function RegistrationMarks() {
  const corners = [
    'top-2 left-2 border-t border-l',
    'top-2 right-2 border-t border-r',
    'bottom-2 left-2 border-b border-l',
    'bottom-2 right-2 border-b border-r',
  ]
  return (
    <>
      {corners.map((corner) => (
        <span
          key={corner}
          aria-hidden="true"
          className={cn('pointer-events-none absolute h-3 w-3 border-[var(--color-line)]', corner)}
        />
      ))}
    </>
  )
}
