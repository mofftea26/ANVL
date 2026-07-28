import { useEffect, useMemo, useState } from 'react'
import type { CareIconKey } from '@/features/cms/support/supportContent.zod'
import type { ResolvedCareLegend } from '@/features/cms/support/resolveSupportContent'
import { CARE_SYMBOL_CATEGORIES } from '../components/careSymbols'

/**
 * Client-side search and category filtering over the resolved care-symbol
 * legend. Matching runs on both the label and the plain-language meaning, so
 * "tumble" and "dryer" both find the same glyph.
 *
 * The typed query is debounced before it drives the filter (the per-keystroke
 * value stays available for the controlled input), and the hook hands back a
 * result count so the caller can announce it politely.
 */

/** Debounce floor for the search field, per the performance rules. */
export const CARE_SEARCH_DEBOUNCE_MS = 250

export interface CareSymbolEntry {
  key: CareIconKey
  label: string
  meaning: string
}

export interface CareSymbolGroup {
  id: string
  label: string
  entries: CareSymbolEntry[]
}

export interface CareSymbolCategoryChip {
  id: string
  label: string
  /** Matches for the current query within this category, ignoring the filter. */
  count: number
}

export interface UseCareSymbolSearchResult {
  /** Live input value — bind this to the search field. */
  query: string
  setQuery: (value: string) => void
  /** Active category id, or `null` for all categories. */
  categoryId: string | null
  setCategoryId: (value: string | null) => void
  /** Category chips with live counts for the current query. */
  categories: CareSymbolCategoryChip[]
  /** Matching symbols, grouped by category. Empty groups are dropped. */
  groups: CareSymbolGroup[]
  /** Total symbols across `groups` — announce this in an `aria-live` region. */
  resultCount: number
  /** True when a query or category filter is narrowing the list. */
  isFiltered: boolean
  /** Clears both the query and the category filter. */
  reset: () => void
}

export function useCareSymbolSearch(legend: ResolvedCareLegend): UseCareSymbolSearchResult {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), CARE_SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  const allGroups = useMemo<CareSymbolGroup[]>(
    () =>
      CARE_SYMBOL_CATEGORIES.map((category) => ({
        id: category.id,
        label: category.label,
        entries: category.keys.flatMap((key) => {
          const entry = legend.entries[key]
          return entry ? [{ key, label: entry.label, meaning: entry.meaning }] : []
        }),
      })),
    [legend],
  )

  const needle = debouncedQuery.trim().toLowerCase()

  const textMatched = useMemo<CareSymbolGroup[]>(() => {
    if (!needle) return allGroups
    return allGroups.map((group) => ({
      ...group,
      entries: group.entries.filter(
        (entry) =>
          entry.label.toLowerCase().includes(needle) ||
          entry.meaning.toLowerCase().includes(needle),
      ),
    }))
  }, [allGroups, needle])

  const categories = useMemo<CareSymbolCategoryChip[]>(
    () =>
      textMatched.map((group) => ({
        id: group.id,
        label: group.label,
        count: group.entries.length,
      })),
    [textMatched],
  )

  const groups = useMemo<CareSymbolGroup[]>(
    () =>
      textMatched.filter(
        (group) => group.entries.length > 0 && (categoryId === null || group.id === categoryId),
      ),
    [textMatched, categoryId],
  )

  const resultCount = groups.reduce((total, group) => total + group.entries.length, 0)

  return {
    query,
    setQuery,
    categoryId,
    setCategoryId,
    categories,
    groups,
    resultCount,
    isFiltered: needle.length > 0 || categoryId !== null,
    reset: () => {
      setQuery('')
      setDebouncedQuery('')
      setCategoryId(null)
    },
  }
}
