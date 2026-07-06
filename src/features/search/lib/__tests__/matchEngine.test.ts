import { describe, expect, it } from 'vitest'
import { createSearchIndex, runSearch } from '@/features/search/lib/matchEngine'
import type { SearchDocument } from '@/features/search/types/search.types'

function doc(overrides: Partial<SearchDocument>): SearchDocument {
  return {
    id: 'doc-1',
    type: 'product',
    title: 'Untitled',
    body: '',
    url: '/',
    meta: {},
    ...overrides,
  }
}

describe('matchEngine', () => {
  const documents: SearchDocument[] = [
    doc({ id: 'p-1', title: 'Forge Cage Tee', subtitle: 'The Oath', body: 'heavy cotton compression' }),
    doc({ id: 'p-2', title: 'Anvil Stringer', subtitle: 'The Oath', body: 'honest stretch fabric' }),
    doc({ id: 'a-1', type: 'story-act', title: 'The First Strike', body: 'The hammer fell at dawn.' }),
  ]

  it('returns no results for an empty query', () => {
    const index = createSearchIndex(documents)
    expect(runSearch(index, '')).toEqual([])
    expect(runSearch(index, '   ')).toEqual([])
  })

  it('ranks an exact title match above a fuzzy/body-only match', () => {
    const index = createSearchIndex(documents)
    const results = runSearch(index, 'Forge Cage Tee')
    expect(results[0]?.document.id).toBe('p-1')
  })

  it('finds a document via body text even when the title differs', () => {
    const index = createSearchIndex(documents)
    const results = runSearch(index, 'hammer fell')
    expect(results.some((r) => r.document.id === 'a-1')).toBe(true)
  })

  it('includes character-range matches usable for highlighting', () => {
    const index = createSearchIndex(documents)
    const results = runSearch(index, 'Anvil')
    const hit = results.find((r) => r.document.id === 'p-2')
    expect(hit).toBeDefined()
    const titleMatch = hit?.matches.find((m) => m.key === 'title')
    expect(titleMatch?.indices.length).toBeGreaterThan(0)
  })

  it('filters out irrelevant documents past the threshold', () => {
    const index = createSearchIndex(documents)
    const results = runSearch(index, 'zzzznonexistentqueryzzzz')
    expect(results).toEqual([])
  })

  it('respects an explicit result limit', () => {
    const index = createSearchIndex(documents)
    const results = runSearch(index, 'The Oath', 1)
    expect(results.length).toBeLessThanOrEqual(1)
  })
})
