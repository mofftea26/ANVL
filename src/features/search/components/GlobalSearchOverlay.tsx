import { createPortal } from 'react-dom'
import { Search, X } from 'lucide-react'
import { useEffect, useRef, type KeyboardEvent } from 'react'
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap'
import { SEARCH_CATEGORY_ORDER, SEARCH_DOCUMENT_TYPE_LABELS } from '@/features/search/types/search.types'
import { SearchResultRow } from '@/features/search/components/SearchResultRow'
import type { UseGlobalSearchReturn } from '@/features/search/hooks/useGlobalSearch'

/**
 * Full-screen cinematic search overlay — same `useGlobalSearch` instance as
 * the dropdown/nav input, so escalating here never resets query or results.
 * Portal to `<body>`, `z-[95]` (above `Modal`'s `z-[90]`, below the story
 * book's `z-[200]`), focus-trapped like every other dialog in the app.
 */
export function GlobalSearchOverlay({ search }: { search: UseGlobalSearchReturn }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const { query, setQuery, allResults, activeIndex, setActiveIndex, navigateToResult, isLoading, closeOverlay } =
    search

  useDialogFocusTrap({ open: true, panelRef, onClose: closeOverlay })

  // Lock the page behind the overlay — this is a full-screen dialog, the
  // storefront underneath must not scroll while it's open (same pattern as
  // ChapterBook's html+body lock).
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtml = html.style.overflow
    const prevBody = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtml
      body.style.overflow = prevBody
    }
  }, [])

  const flat = SEARCH_CATEGORY_ORDER.flatMap((type) => allResults[type] ?? [])
  const totalCount = flat.length

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(Math.min(totalCount - 1, activeIndex + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(Math.max(0, activeIndex - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const target = activeIndex >= 0 ? flat[activeIndex] : flat[0]
      if (target) navigateToResult(target)
    }
  }

  let cursor = -1

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Search ANVL"
      data-native-cursor
      data-lenis-prevent
      className="fixed inset-0 z-[95] flex flex-col items-center overflow-y-auto overscroll-contain bg-[color-mix(in_oklab,var(--color-bg)_90%,#000)]/95 px-4 pb-16 pt-20 backdrop-blur-xl sm:pt-28"
    >
      <button
        type="button"
        onClick={closeOverlay}
        aria-label="Close search"
        className="focus-ring absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)]/80 text-[var(--color-text)] sm:right-6 sm:top-6"
      >
        <X size={18} aria-hidden={true} />
      </button>

      <div className="w-full max-w-2xl">
        <div className="relative">
          <Search
            size={18}
            aria-hidden={true}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search ANVL — products, the saga, About…"
            autoComplete="off"
            aria-label="Search ANVL"
            className="focus-ring h-14 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] pl-12 pr-4 text-lg text-[var(--color-heading)] placeholder:text-[var(--color-text-muted)]"
          />
        </div>

        <div className="mt-8">
          {query.trim().length === 0 ? (
            <p className="text-center text-sm text-[var(--color-text-muted)]">
              Start typing to search everything on ANVL.
            </p>
          ) : isLoading ? (
            <p className="text-center text-sm text-[var(--color-text-muted)]">Searching…</p>
          ) : totalCount === 0 ? (
            <p className="text-center text-sm text-[var(--color-text-muted)]">
              No results for &ldquo;{query}&rdquo;
            </p>
          ) : (
            SEARCH_CATEGORY_ORDER.map((type) => {
              const inCategory = allResults[type]
              if (!inCategory || inCategory.length === 0) return null
              return (
                <div key={type} className="mb-6 last:mb-0">
                  <p className="anvl-display mb-2 text-xs tracking-[0.2em] text-[var(--color-highlight)]">
                    {SEARCH_DOCUMENT_TYPE_LABELS[type]}
                  </p>
                  <div className="space-y-1">
                    {inCategory.map((result) => {
                      cursor += 1
                      const index = cursor
                      return (
                        <SearchResultRow
                          key={result.document.id}
                          result={result}
                          active={index === activeIndex}
                          onClick={() => navigateToResult(result)}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
