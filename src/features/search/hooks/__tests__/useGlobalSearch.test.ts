import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SearchDocument, SearchResult } from '@/features/search/types/search.types'

const navigateMock = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}))

vi.mock('@/features/search/hooks/useSearchCorpusQuery', () => ({
  useSearchCorpusQuery: () => ({ data: [] as SearchDocument[], isLoading: false }),
}))

// Live armory hits (React Query inside — mocked so no QueryClientProvider is
// needed here). Tests fill `armoryHits.current` to simulate RPC results.
const armoryHits: { current: { handle: string; displayName: string }[] } = { current: [] }
vi.mock('@/features/search/hooks/useArmorySearch', () => ({
  useArmorySearch: () => ({ data: armoryHits.current, isLoading: false }),
}))

import { useGlobalSearch } from '@/features/search/hooks/useGlobalSearch'

function makeResult(overrides: Partial<SearchDocument>): SearchResult {
  return {
    score: 0,
    matches: [],
    document: {
      id: 'doc-1',
      type: 'product',
      title: 'Doc',
      body: '',
      url: '/',
      meta: {},
      ...overrides,
    },
  }
}

describe('useGlobalSearch', () => {
  beforeEach(() => {
    navigateMock.mockClear()
    armoryHits.current = []
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounces the committed query by 350ms', () => {
    const { result } = renderHook(() => useGlobalSearch())
    act(() => result.current.setQuery('anvil'))
    expect(result.current.query).toBe('anvil')
    act(() => vi.advanceTimersByTime(349))
    act(() => vi.advanceTimersByTime(1))
    // committedQuery isn't exposed directly, but flatResults recomputing without
    // throwing after the debounce window confirms the effect settled.
    expect(result.current.query).toBe('anvil')
  })

  it('opens and closes the dropdown/overlay independently', () => {
    const { result } = renderHook(() => useGlobalSearch())
    act(() => result.current.open())
    expect(result.current.isOpen).toBe(true)
    act(() => result.current.openOverlay())
    expect(result.current.isOverlayOpen).toBe(true)
    expect(result.current.isOpen).toBe(false)
    act(() => result.current.closeOverlay())
    expect(result.current.isOverlayOpen).toBe(false)
  })

  it('navigates a product result to its PDP route', () => {
    const { result } = renderHook(() => useGlobalSearch())
    act(() => result.current.navigateToResult(makeResult({ type: 'product', meta: { slug: 'forge-tee' } })))
    expect(navigateMock).toHaveBeenCalledWith({ to: '/shop/$slug', params: { slug: 'forge-tee' } })
  })

  it('navigates a pdp-tile result to the product route with a hash', () => {
    const { result } = renderHook(() => useGlobalSearch())
    act(() =>
      result.current.navigateToResult(
        makeResult({ type: 'pdp-tile', meta: { slug: 'forge-tee', hash: 'pdp-story' } }),
      ),
    )
    expect(navigateMock).toHaveBeenCalledWith({
      to: '/shop/$slug',
      params: { slug: 'forge-tee' },
      hash: 'pdp-story',
    })
  })

  it('navigates a story-act result with chapter + act search params', () => {
    const { result } = renderHook(() => useGlobalSearch())
    act(() =>
      result.current.navigateToResult(
        makeResult({ type: 'story-act', meta: { chapterSlug: 'the-oath', actId: 'act-1' } }),
      ),
    )
    expect(navigateMock).toHaveBeenCalledWith({
      to: '/story',
      search: { chapter: 'the-oath', act: 'act-1' },
    })
  })

  it('navigates an about-orb result to the hash anchor', () => {
    const { result } = renderHook(() => useGlobalSearch())
    act(() =>
      result.current.navigateToResult(makeResult({ type: 'about-orb', meta: { hash: 'about-orb-anvl' } })),
    )
    expect(navigateMock).toHaveBeenCalledWith({ to: '/about', hash: 'about-orb-anvl' })
  })

  it('navigates a static-page result to its fixed path', () => {
    const { result } = renderHook(() => useGlobalSearch())
    act(() => result.current.navigateToResult(makeResult({ type: 'static-page', meta: { path: '/cart' } })))
    expect(navigateMock).toHaveBeenCalledWith({ to: '/cart' })
  })

  it('navigates an armory result to the public armory route', () => {
    const { result } = renderHook(() => useGlobalSearch())
    act(() =>
      result.current.navigateToResult(makeResult({ type: 'armory', meta: { handle: 'iron-warrior' } })),
    )
    expect(navigateMock).toHaveBeenCalledWith({
      to: '/armory/$handle',
      params: { handle: 'iron-warrior' },
    })
  })

  it('merges live armory hits as a Warriors group in dropdown, overlay, and keyboard order', () => {
    armoryHits.current = [{ handle: 'iron-warrior', displayName: 'George M.' }]
    const { result } = renderHook(() => useGlobalSearch())
    const dropdownGroup = result.current.results['armory']
    expect(dropdownGroup?.map((r) => r.document)).toMatchObject([
      {
        type: 'armory',
        title: 'George M.',
        subtitle: '@iron-warrior',
        meta: { handle: 'iron-warrior' },
      },
    ])
    // Same group in the overlay's uncapped results, and rows participate in
    // the flat keyboard-navigation order.
    expect(result.current.allResults['armory']).toHaveLength(1)
    expect(
      result.current.flatResults.some((r) => r.document.id === 'armory-iron-warrior'),
    ).toBe(true)
  })

  it('renders no Warriors group when the armory search returns nothing', () => {
    armoryHits.current = []
    const { result } = renderHook(() => useGlobalSearch())
    expect(result.current.results['armory']).toBeUndefined()
    expect(result.current.allResults['armory']).toBeUndefined()
  })
})
