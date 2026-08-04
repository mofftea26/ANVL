import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import type { ArmorySearchHit } from '@/features/passport/schemas/passport.schema'

const searchPublicArmoriesMock = vi.fn<(query: string) => Promise<ArmorySearchHit[]>>()
vi.mock('@/features/passport/api/armoryClient', () => ({
  searchPublicArmories: (query: string) => searchPublicArmoriesMock(query),
}))

// Mutable env so each test chooses configured vs. unconfigured Supabase.
const envRef: { current: { url: string; anonKey: string } | null } = {
  current: { url: 'https://example.supabase.co', anonKey: 'a'.repeat(32) },
}
vi.mock('@/features/cms/api/supabasePublicEnv', () => ({
  getSupabasePublicEnv: () => envRef.current,
}))

import { useArmorySearch } from '@/features/search/hooks/useArmorySearch'

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('useArmorySearch', () => {
  beforeEach(() => {
    searchPublicArmoriesMock.mockReset()
    envRef.current = { url: 'https://example.supabase.co', anonKey: 'a'.repeat(32) }
  })

  it('fetches public armory hits for a ≥2-char query', async () => {
    searchPublicArmoriesMock.mockResolvedValue([
      { handle: 'iron-warrior', displayName: 'George M.' },
    ])
    const { result } = renderHook(() => useArmorySearch('geo'), { wrapper })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(searchPublicArmoriesMock).toHaveBeenCalledWith('geo')
    expect(result.current.data).toEqual([{ handle: 'iron-warrior', displayName: 'George M.' }])
  })

  it('never fetches for sub-2-char queries', () => {
    const { result } = renderHook(() => useArmorySearch('g'), { wrapper })
    expect(searchPublicArmoriesMock).not.toHaveBeenCalled()
    expect(result.current.data).toBeUndefined()
  })

  it('trims before measuring the floor (whitespace is not a query)', () => {
    renderHook(() => useArmorySearch('  g  '), { wrapper })
    expect(searchPublicArmoriesMock).not.toHaveBeenCalled()
  })

  it('degrades silently when Supabase env is not configured', () => {
    envRef.current = null
    const { result } = renderHook(() => useArmorySearch('george'), { wrapper })
    expect(searchPublicArmoriesMock).not.toHaveBeenCalled()
    expect(result.current.data).toBeUndefined()
  })

  it('respects the caller-driven enabled gate', () => {
    renderHook(() => useArmorySearch('george', { enabled: false }), { wrapper })
    expect(searchPublicArmoriesMock).not.toHaveBeenCalled()
  })
})
