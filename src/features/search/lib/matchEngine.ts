import Fuse from 'fuse.js'
import type { SearchDocument, SearchResult } from '@/features/search/types/search.types'

/**
 * Thin, storefront-agnostic wrapper around Fuse.js. Operates only on
 * `SearchDocument[]` — no knowledge of `runtimeClients`, CMS shapes, or
 * routing — so a future admin search variant can reuse it with its own
 * document set.
 */
export function createSearchIndex(documents: SearchDocument[]): Fuse<SearchDocument> {
  return new Fuse(documents, {
    keys: [
      { name: 'title', weight: 0.6 },
      { name: 'subtitle', weight: 0.25 },
      { name: 'body', weight: 0.15 },
    ],
    includeMatches: true,
    includeScore: true,
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 2,
  })
}

/** Empty query returns no results — an idle search shouldn't dump the whole corpus. */
export function runSearch(
  index: Fuse<SearchDocument>,
  query: string,
  limit?: number,
): SearchResult[] {
  const q = query.trim()
  if (!q) return []
  const raw = index.search(q, limit != null ? { limit } : undefined)
  return raw.map((r) => ({
    document: r.item,
    score: r.score ?? 1,
    matches: r.matches ?? [],
  }))
}
