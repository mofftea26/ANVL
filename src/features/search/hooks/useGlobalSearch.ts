import { useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createSearchIndex, runSearch } from '@/features/search/lib/matchEngine'
import { useSearchCorpusQuery } from '@/features/search/hooks/useSearchCorpusQuery'
import {
  SEARCH_CATEGORY_ORDER,
  type GroupedResults,
  type SearchDocumentType,
  type SearchResult,
} from '@/features/search/types/search.types'

const DEBOUNCE_MS = 350
const DROPDOWN_CATEGORY_CAP = 4

function groupResults(results: SearchResult[], cap?: number): GroupedResults {
  const grouped: GroupedResults = {}
  for (const type of SEARCH_CATEGORY_ORDER) {
    const inCategory = results.filter((r) => r.document.type === type)
    if (inCategory.length === 0) continue
    grouped[type] = cap != null ? inCategory.slice(0, cap) : inCategory
  }
  return grouped
}

function flatten(grouped: GroupedResults): SearchResult[] {
  return SEARCH_CATEGORY_ORDER.flatMap((type) => grouped[type] ?? [])
}

/**
 * Core global-search hook: owns query state (debounced), the lazily-fetched
 * corpus + Fuse index, grouped results for the dropdown vs. the full overlay,
 * keyboard-nav state, and per-type navigation. A single instance is shared by
 * `GlobalSearchBar` and rendered into both `GlobalSearchDropdown` and
 * `GlobalSearchOverlay` so escalating never resets query/results.
 */
export function useGlobalSearch(options: { enableSlashShortcut?: boolean } = {}) {
  const { enableSlashShortcut = true } = options
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [draftQuery, setDraftQuery] = useState('')
  const [committedQuery, setCommittedQuery] = useState('')
  const [hasInteracted, setHasInteracted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isOverlayOpen, setIsOverlayOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    const handle = window.setTimeout(() => setCommittedQuery(draftQuery), DEBOUNCE_MS)
    return () => window.clearTimeout(handle)
  }, [draftQuery])

  const corpusQuery = useSearchCorpusQuery({ enabled: hasInteracted })
  const corpus = corpusQuery.data

  const index = useMemo(() => (corpus ? createSearchIndex(corpus) : null), [corpus])

  const rawResults = useMemo(
    () => (index ? runSearch(index, committedQuery) : []),
    [index, committedQuery],
  )

  const results = useMemo(() => groupResults(rawResults, DROPDOWN_CATEGORY_CAP), [rawResults])
  const allResults = useMemo(() => groupResults(rawResults), [rawResults])
  const flatResults = useMemo(() => flatten(isOverlayOpen ? allResults : results), [
    isOverlayOpen,
    allResults,
    results,
  ])

  useEffect(() => {
    setActiveIndex(-1)
  }, [committedQuery])

  function setQuery(next: string) {
    setDraftQuery(next)
  }

  function open() {
    setHasInteracted(true)
    setIsOpen(true)
  }

  function close() {
    setIsOpen(false)
    setActiveIndex(-1)
  }

  function openOverlay() {
    setHasInteracted(true)
    setIsOverlayOpen(true)
    setIsOpen(false)
  }

  function closeOverlay() {
    setIsOverlayOpen(false)
    setActiveIndex(-1)
  }

  function navigateToResult(result: SearchResult) {
    const { document } = result
    const { type, meta } = document
    switch (type) {
      case 'product': {
        if (meta.slug) void navigate({ to: '/shop/$slug', params: { slug: meta.slug } })
        break
      }
      case 'pdp-tile': {
        if (meta.slug) {
          void navigate({
            to: '/shop/$slug',
            params: { slug: meta.slug },
            hash: meta.hash,
          })
        }
        break
      }
      case 'story-chapter':
      case 'story-cast': {
        if (meta.chapterSlug) {
          void navigate({ to: '/story', search: { chapter: meta.chapterSlug } })
        }
        break
      }
      case 'story-act': {
        if (meta.chapterSlug) {
          void navigate({
            to: '/story',
            search: { chapter: meta.chapterSlug, act: meta.actId },
          })
        }
        break
      }
      case 'about-orb': {
        void navigate({ to: '/about', hash: meta.hash })
        break
      }
      case 'static-page': {
        if (meta.path) void navigate({ to: meta.path })
        break
      }
    }
    close()
    closeOverlay()
  }

  // Global `/` shortcut — the single canonical target site-wide (ShopSearch's
  // own binding was removed to avoid a double-focus conflict). Only one
  // `GlobalSearchBar` mount (the nav topbar's) enables this; the mobile
  // drawer's instance opts out so a hidden offscreen input never steals focus.
  useEffect(() => {
    if (!enableSlashShortcut) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== '/' || e.defaultPrevented) return
      const el = document.activeElement
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable)
      if (typing) return
      e.preventDefault()
      setHasInteracted(true)
      inputRef.current?.focus()
    }
    window.document.addEventListener('keydown', onKeyDown)
    return () => window.document.removeEventListener('keydown', onKeyDown)
  }, [enableSlashShortcut])

  return {
    query: draftQuery,
    setQuery,
    isOpen,
    isOverlayOpen,
    open,
    close,
    openOverlay,
    closeOverlay,
    results,
    allResults,
    flatResults,
    isLoading: corpusQuery.isLoading,
    activeIndex,
    setActiveIndex,
    navigateToResult,
    inputRef,
  }
}

export type UseGlobalSearchReturn = ReturnType<typeof useGlobalSearch>
export type { SearchDocumentType }
