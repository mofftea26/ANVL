import { useId } from 'react'
import { cn } from '@/shared/lib/cn'
import { Search } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import type { ResolvedCareLegend } from '@/features/cms/support/resolveSupportContent'
import { useCareSymbolSearch } from '../hooks/useCareSymbolSearch'
import { CareSymbolGrid } from './CareSymbolGrid'
import { CareSymbolTable } from './CareSymbolTable'

/**
 * Anchor for the legend section on `/care-guide`. Lives here rather than in the
 * route so the PDP can deep-link to it without importing a route module.
 */
export const CARE_SYMBOLS_SECTION_ID = 'care-symbols'

/**
 * The care-symbol legend, filtered.
 *
 * The controls sit in one rail — search on the left, the live tally on the
 * right — because the tally is the readout for the controls beside it. That
 * tally is also the `aria-live` announcement, so what a screen reader hears and
 * what everyone else sees are the same sentence.
 *
 * Below `md` the wall of tiles becomes `CareSymbolTable`, which needs no hover
 * to give up a meaning. The switch is pure CSS, so it survives SSR with no
 * `matchMedia` and no hydration gap.
 */
export function CareSymbolLegend({
  legend,
  className,
}: {
  legend: ResolvedCareLegend
  className?: string
}) {
  const search = useCareSymbolSearch(legend)
  const inputId = useId()
  const totalCount = Object.keys(legend.entries).length
  // Category counts ignore the category filter, so their sum is "everything the
  // current query matches" — the right number for the All chip.
  const matchedCount = search.categories.reduce((total, category) => total + category.count, 0)

  return (
    <div className={cn('space-y-6', className)}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <label htmlFor={inputId} className="sr-only">
              Search care symbols
            </label>
            <Search
              size={ICON_SIZE.sm}
              aria-hidden={true}
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--color-text-muted)]"
            />
            <input
              id={inputId}
              type="search"
              value={search.query}
              onChange={(event) => search.setQuery(event.target.value)}
              placeholder="Search — tumble, bleach, 30"
              autoComplete="off"
              className="focus-ring h-11 w-full rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] pr-4 pl-9 text-base text-[var(--color-heading)] placeholder:text-[var(--color-text-muted)] md:text-sm"
            />
          </div>
          <p
            aria-live="polite"
            className="text-[0.6875rem] tracking-[0.18em] text-[var(--color-text-muted)] tabular-nums uppercase"
          >
            {search.resultCount} of {totalCount} marks
          </p>
        </div>

        <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
          <FilterChip
            label="All"
            count={matchedCount}
            selected={search.categoryId === null}
            onSelect={() => search.setCategoryId(null)}
          />
          {search.categories.map((category) => (
            <FilterChip
              key={category.id}
              label={category.label}
              count={category.count}
              selected={search.categoryId === category.id}
              onSelect={() =>
                search.setCategoryId(search.categoryId === category.id ? null : category.id)
              }
            />
          ))}
        </div>
      </div>

      {search.resultCount === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--color-line)] p-8 text-center">
          <p className="anvl-heading text-lg text-[var(--color-heading)]">No marks match</p>
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">
            Nothing in the legend matches the current search and category. Try a fabric action —
            wash, bleach, dry, iron — or clear the filters to see all {totalCount}.
          </p>
          <button
            type="button"
            onClick={search.reset}
            className="focus-ring mt-5 inline-flex min-h-11 items-center rounded-full border border-[var(--color-line)] px-5 text-sm text-[var(--color-text)] transition-colors hover:border-[var(--color-highlight-bright)] hover:text-[var(--color-highlight-bright)]"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <CareSymbolGrid groups={search.groups} headingLevel={3} className="hidden md:block" />
          <CareSymbolTable groups={search.groups} className="md:hidden" />
        </>
      )}
    </div>
  )
}

/** A category filter as a stamped tab, with the live match count it carries. */
function FilterChip({
  label,
  count,
  selected,
  onSelect,
}: {
  label: string
  count: number
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        'focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-xs tracking-[0.12em] uppercase transition-colors',
        selected
          ? 'border-[var(--color-highlight-bright)] bg-[var(--color-highlight-soft)] font-semibold text-[var(--color-heading)]'
          : 'border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]',
      )}
    >
      {label}
      <span className="text-[var(--color-text-muted)] tabular-nums">{count}</span>
    </button>
  )
}
