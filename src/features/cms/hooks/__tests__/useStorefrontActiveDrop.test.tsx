import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import type { Drop } from '@/features/drops/drop.types'
import { useStorefrontActiveDrop } from '@/features/cms/hooks/useStorefrontActiveDrop'

const mockFetch = vi.fn()

vi.mock('@/features/cms/api/supabasePublicEnv', () => ({
  getSupabasePublicEnv: vi.fn(() => ({
    url: 'https://test.supabase.co',
    anonKey: 'test-key',
  })),
}))

vi.mock('@/features/cms/hooks/storefrontPublicationQuery', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@/features/cms/hooks/storefrontPublicationQuery')
  >()
  return {
    ...actual,
    fetchStorefrontPublicationView: (...args: unknown[]) => mockFetch(...args),
  }
})

const seedDrop = { id: 'seed-drop', slug: 'seed', title: 'Seed' } as Drop
const publishedDrop = { id: 'published-drop', slug: 'live', title: 'Live' } as Drop

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useStorefrontActiveDrop', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('returns SSR initial until publication resolves', () => {
    mockFetch.mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(
      () => useStorefrontActiveDrop(seedDrop),
      { wrapper },
    )
    expect(result.current).toBe(seedDrop)
  })

  it('returns published drop from Supabase when available', async () => {
    mockFetch.mockResolvedValue({
      projection: { drop: publishedDrop },
      landing: {},
    })

    const { result } = renderHook(
      () => useStorefrontActiveDrop(seedDrop),
      { wrapper },
    )

    await waitFor(() => {
      expect(result.current).toBe(publishedDrop)
    })
  })
})
