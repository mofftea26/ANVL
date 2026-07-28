import { useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { cn } from '@/shared/lib/cn'
import type { GarmentTypeKey } from '@/features/cms/support/supportContent.zod'
import { getGarmentOutlineViewBox, getGarmentSchematic } from './garments'

/**
 * Pick the pattern piece, not the word: each tab is the garment's own
 * silhouette, filled, above its name and the number of points that silhouette
 * carries. The count is real information — a hoodie is measured in seven
 * places, a pair of shorts in three — so the strip tells you what changes
 * before you switch.
 *
 * A proper ARIA tablist with roving tabindex and automatic activation: arrow
 * keys move focus and select in one step, which is the recommended pattern when
 * switching panels is cheap. The caller renders ONLY the selected panel, so
 * `aria-controls` is set on the selected tab alone.
 */

export interface GarmentTypeTabItem {
  key: GarmentTypeKey
  label: string
  /** How many lettered measurement points this garment carries. */
  pointCount: number
}

export interface GarmentTypeTabsProps {
  items: readonly GarmentTypeTabItem[]
  activeKey: GarmentTypeKey
  onSelect: (key: GarmentTypeKey) => void
  /** Namespace for the generated tab / panel ids. */
  idPrefix: string
  /** Accessible name for the strip, e.g. the section heading's id. */
  labelledBy?: string
  className?: string
}

export function garmentTabId(idPrefix: string, key: GarmentTypeKey): string {
  return `${idPrefix}-tab-${key}`
}

export function garmentPanelId(idPrefix: string): string {
  return `${idPrefix}-panel`
}

export function GarmentTypeTabs({
  items,
  activeKey,
  onSelect,
  idPrefix,
  labelledBy,
  className,
}: GarmentTypeTabsProps) {
  const tabRefs = useRef(new Map<GarmentTypeKey, HTMLButtonElement>())

  const move = (delta: number) => {
    const index = items.findIndex((item) => item.key === activeKey)
    if (index < 0) return
    const next = items[(index + delta + items.length) % items.length]
    if (!next) return
    onSelect(next.key)
    tabRefs.current.get(next.key)?.focus()
  }

  const jump = (item: GarmentTypeTabItem | undefined) => {
    if (!item) return
    onSelect(item.key)
    tabRefs.current.get(item.key)?.focus()
  }

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      // Horizontal tablist: left/right only, per the APG pattern.
      case 'ArrowRight':
        event.preventDefault()
        move(1)
        break
      case 'ArrowLeft':
        event.preventDefault()
        move(-1)
        break
      case 'Home':
        event.preventDefault()
        jump(items[0])
        break
      case 'End':
        event.preventDefault()
        jump(items[items.length - 1])
        break
      default:
        break
    }
  }

  return (
    <div
      role="tablist"
      aria-labelledby={labelledBy}
      aria-orientation="horizontal"
      onKeyDown={onKeyDown}
      className={cn(
        'flex snap-x gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible',
        className,
      )}
    >
      {items.map((item) => {
        const isActive = item.key === activeKey
        return (
          <button
            key={item.key}
            ref={(node) => {
              if (node) tabRefs.current.set(item.key, node)
              else tabRefs.current.delete(item.key)
            }}
            type="button"
            role="tab"
            id={garmentTabId(idPrefix, item.key)}
            aria-selected={isActive}
            aria-controls={isActive ? garmentPanelId(idPrefix) : undefined}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSelect(item.key)}
            className={cn(
              'focus-ring relative flex w-[5.5rem] shrink-0 snap-start flex-col items-center gap-1.5 rounded-md border px-2 pt-3 pb-2.5 transition-colors',
              isActive
                ? 'border-[var(--color-highlight-bright)] bg-[var(--color-highlight-soft)]'
                : 'border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--color-text-muted)]',
            )}
          >
            <GarmentSilhouette garmentTypeKey={item.key} active={isActive} />
            <span
              className={cn(
                'anvl-heading text-[0.6875rem] leading-none',
                isActive ? 'text-[var(--color-heading)]' : 'text-[var(--color-text-muted)]',
              )}
            >
              {item.label}
            </span>
            <span className="text-[0.625rem] tracking-[0.12em] text-[var(--color-text-muted)] tabular-nums uppercase">
              {item.pointCount} pts
            </span>
            {/* Selection is carried by the fill, the weight AND this bar — never
                by colour alone. */}
            <span
              aria-hidden="true"
              className={cn(
                'absolute inset-x-3 bottom-0 h-0.5 rounded-full',
                isActive ? 'bg-[var(--color-highlight-bright)]' : 'bg-transparent',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

/**
 * The garment's outline path, filled — a pattern piece laid on the table.
 *
 * Framed by the OUTLINE's own bounds, never `schematic.viewBox`: that box is
 * sized to hold dimension lines, witness leaders and badges the tab never
 * draws, so reusing it renders each garment at a different scale and off its
 * own centre, and the row reads ragged.
 */
function GarmentSilhouette({
  garmentTypeKey,
  active,
}: {
  garmentTypeKey: GarmentTypeKey
  active: boolean
}) {
  const { outline } = getGarmentSchematic(garmentTypeKey)
  const viewBox = getGarmentOutlineViewBox(garmentTypeKey)
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
      className={cn(
        'h-9 w-9 transition-colors',
        active ? 'text-[var(--color-highlight-bright)]' : 'text-[var(--color-text-muted)]',
      )}
    >
      <path d={outline} fill="currentColor" fillOpacity={active ? 0.9 : 0.45} />
    </svg>
  )
}
