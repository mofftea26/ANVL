import { Search } from '@/shared/icons'
import { Suspense, lazy, useEffect, useId, useRef, type KeyboardEvent } from 'react'
import { cn } from '@/shared/lib/cn'
import { useGlobalSearch } from '@/features/search/hooks/useGlobalSearch'
import { GlobalSearchDropdown } from '@/features/search/components/GlobalSearchDropdown'
import type { SearchResult } from '@/features/search/types/search.types'
import { ICON_SIZE } from '@/shared/lib/iconSize'

const GlobalSearchOverlay = lazy(() =>
  import('@/features/search/components/GlobalSearchOverlay').then((m) => ({
    default: m.GlobalSearchOverlay,
  })),
)

type GlobalSearchBarVariant = 'topbar' | 'drawer'

/**
 * The nav-owned global search entry point. Self-contained (owns its own
 * `useGlobalSearch()` call) — same integration pattern as `AccountMenu`/cart
 * in `PremiumNavTopbar`.
 *
 * `topbar` (one mount in `PremiumNavTopbar`, owns the `/` shortcut): renders
 * BOTH an icon-only trigger (visible <1024px, opens the full overlay
 * directly — no room for an inline dropdown at that width) and a real inline
 * input with a categorized dropdown (≥1024px), toggled by Tailwind
 * breakpoints on a SINGLE hook instance so there's exactly one `/`-listener
 * and one shared query/open state.
 *
 * `drawer` (mounted in `PremiumNavMobile`'s drawer): a full-width input only,
 * no dropdown (the drawer's own scroll context), `/` shortcut disabled since
 * the topbar instance already owns it and this input can sit offscreen while
 * the drawer is closed.
 */
export function GlobalSearchBar({
  variant = 'topbar',
  triggerClassName,
  onNavigate,
}: {
  variant?: GlobalSearchBarVariant
  triggerClassName?: string
  onNavigate?: () => void
}) {
  const isDrawer = variant === 'drawer'
  const search = useGlobalSearch({ enableSlashShortcut: !isDrawer })
  const {
    query,
    setQuery,
    isOpen,
    isOverlayOpen,
    open,
    close,
    openOverlay,
    flatResults,
    activeIndex,
    setActiveIndex,
    navigateToResult,
    inputRef,
  } = search
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const listboxId = useId()
  const resultId = (index: number) => `${listboxId}-option-${index}`

  useEffect(() => {
    if (!isOpen) return
    function onDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [isOpen, close])

  function handleSelect(result: SearchResult) {
    navigateToResult(result)
    onNavigate?.()
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      close()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isOpen) open()
      setActiveIndex(Math.min(flatResults.length - 1, activeIndex + 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(Math.max(0, activeIndex - 1))
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const active = activeIndex >= 0 ? flatResults[activeIndex] : undefined
      if (active) {
        handleSelect(active)
      } else if (!isDrawer) {
        openOverlay()
      }
    }
  }

  const overlay = isOverlayOpen ? (
    <Suspense fallback={null}>
      <GlobalSearchOverlay search={search} />
    </Suspense>
  ) : null

  const input = (
    <div ref={wrapperRef} data-native-cursor className="relative min-w-0">
      <Search
        size={ICON_SIZE.sm}
        aria-hidden={true}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
      />
      <input
        ref={isDrawer ? undefined : inputRef}
        type="search"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? resultId(activeIndex) : undefined}
        aria-autocomplete="list"
        aria-label="Search ANVL"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={open}
        onKeyDown={onKeyDown}
        placeholder="Search ANVL…"
        autoComplete="off"
        className={cn(
          'focus-ring h-10 w-full rounded-full border border-[var(--color-line)] bg-[var(--color-surface)]/80 pl-9 pr-4 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-text-muted)]',
          isDrawer && 'h-11 text-base',
        )}
      />
      {isOpen && !isDrawer ? (
        <GlobalSearchDropdown
          results={search.results}
          query={query}
          isLoading={search.isLoading}
          activeIndex={activeIndex}
          onSelect={handleSelect}
          onSeeAll={openOverlay}
          listboxId={listboxId}
          resultId={resultId}
        />
      ) : null}
    </div>
  )

  if (isDrawer) {
    return (
      <>
        {input}
        {overlay}
      </>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={openOverlay}
        data-native-cursor
        className={cn(triggerClassName, 'lg:hidden')}
        aria-label="Search ANVL"
      >
        <Search size={ICON_SIZE.md} aria-hidden={true} />
      </button>
      <div className="hidden lg:block lg:w-56 xl:w-72">{input}</div>
      {overlay}
    </>
  )
}
