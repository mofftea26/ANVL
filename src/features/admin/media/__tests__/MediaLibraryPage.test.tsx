/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MediaLibraryPage } from '../MediaLibraryPage'

const mockGetEnv = vi.hoisted(() =>
  vi.fn<() => { url: string; anonKey: string } | null>(() => null),
)

vi.mock('@/features/cms/api/supabasePublicEnv', () => ({
  getSupabasePublicEnv: () => mockGetEnv(),
}))

vi.mock('../useMediaAssetsQuery', () => ({
  useMediaAssetsQuery: () => ({
    isLoading: false,
    isError: false,
    data: [],
  }),
  useMediaAssetsMutations: () => ({
    uploadMutation: { mutateAsync: vi.fn(), isPending: false },
    updateAltMutation: { mutateAsync: vi.fn() },
    renameMutation: { mutateAsync: vi.fn() },
    deleteMutation: { mutateAsync: vi.fn(), isPending: false },
    bulkDeleteMutation: { mutateAsync: vi.fn(), isPending: false },
    invalidate: vi.fn(),
  }),
}))

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MediaLibraryPage />
    </QueryClientProvider>,
  )
}

describe('MediaLibraryPage', () => {
  beforeEach(() => {
    mockGetEnv.mockReturnValue(null)
  })

  it('prompts to configure Supabase when env is unset', () => {
    renderPage()
    expect(screen.getByText(/VITE_SUPABASE/i)).toBeTruthy()
  })

  it('renders upload zone when Supabase is configured', () => {
    mockGetEnv.mockReturnValue({
      url: 'https://x.supabase.co',
      anonKey: 'key',
    })
    renderPage()
    expect(screen.getByRole('button', { name: /upload files/i })).toBeTruthy()
    expect(screen.getByLabelText(/search media/i)).toBeTruthy()
  })
})
