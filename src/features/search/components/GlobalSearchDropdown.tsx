import { SEARCH_CATEGORY_ORDER, SEARCH_DOCUMENT_TYPE_LABELS } from '@/features/search/types/search.types'
import type { GroupedResults, SearchResult } from '@/features/search/types/search.types'
import { SearchResultRow } from '@/features/search/components/SearchResultRow'

/** Compact categorized results panel anchored under the nav search input. */
export function GlobalSearchDropdown({
  results,
  query,
  isLoading,
  activeIndex,
  onSelect,
  onSeeAll,
  listboxId,
  resultId,
}: {
  results: GroupedResults
  query: string
  isLoading: boolean
  activeIndex: number
  onSelect: (result: SearchResult) => void
  onSeeAll: () => void
  listboxId: string
  resultId: (index: number) => string
}) {
  const hasQuery = query.trim().length > 0
  const totalCount = SEARCH_CATEGORY_ORDER.reduce(
    (sum, type) => sum + (results[type]?.length ?? 0),
    0,
  )

  // Seen categories in the same order `flatten()` produces, so a running
  // counter here lines up exactly with `activeIndex` from the hook.
  let cursor = -1

  return (
    <div
      id={listboxId}
      role="listbox"
      aria-label="Search results"
      data-native-cursor
      data-lenis-prevent
      className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[85] max-h-[70vh] overflow-y-auto overscroll-contain rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-2 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.9)]"
    >
      {!hasQuery ? (
        <p className="px-3 py-4 text-sm text-[var(--color-text-muted)]">
          Search products, the saga, About, and more…
        </p>
      ) : isLoading ? (
        <p className="px-3 py-4 text-sm text-[var(--color-text-muted)]">Searching…</p>
      ) : totalCount === 0 ? (
        <p className="px-3 py-4 text-sm text-[var(--color-text-muted)]">
          No results for &ldquo;{query}&rdquo;
        </p>
      ) : (
        <>
          <button
            type="button"
            onClick={onSeeAll}
            className="focus-ring sticky -top-2 z-10 mb-1 w-full rounded-lg bg-[var(--color-surface)] px-3 py-2 text-center text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-highlight)] hover:bg-[var(--color-surface-elevated)]"
          >
            See all results for &ldquo;{query}&rdquo;
          </button>
          {SEARCH_CATEGORY_ORDER.map((type) => {
            const inCategory = results[type]
            if (!inCategory || inCategory.length === 0) return null
            return (
              <div key={type} className="mb-1 last:mb-0">
                <p className="anvl-micro px-3 pb-1 pt-2 text-[var(--color-text-muted)]">
                  {SEARCH_DOCUMENT_TYPE_LABELS[type]}
                </p>
                {inCategory.map((result) => {
                  cursor += 1
                  const index = cursor
                  return (
                    <SearchResultRow
                      key={result.document.id}
                      id={resultId(index)}
                      result={result}
                      active={index === activeIndex}
                      onClick={() => onSelect(result)}
                    />
                  )
                })}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
