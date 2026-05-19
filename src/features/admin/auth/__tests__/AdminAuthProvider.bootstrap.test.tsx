import { render, screen, act, waitFor } from '@testing-library/react'
import { useContext, type ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AdminAuthContext, AdminAuthProvider } from '../AdminAuthProvider'

const hoisted = vi.hoisted(() => {
  const signOut = vi.fn(async () => {})
  const unsubscribe = vi.fn()
  const mockGetSession = vi.fn()
  const mockClient = {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe } },
      })),
      signOut,
    },
  }
  const resetAdminSupabaseBrowserClient = vi.fn()
  const disposeAdminSupabaseBrowserClient = vi.fn()
  return {
    mockClient,
    mockGetSession,
    unsubscribe,
    signOut,
    resetAdminSupabaseBrowserClient,
    disposeAdminSupabaseBrowserClient,
  }
})

vi.mock('@/features/cms/api/supabasePublicEnv', () => ({
  getSupabasePublicEnv: vi.fn(() => ({
    url: 'https://test.supabase.co',
    anonKey: 'sb_publishable_test',
  })),
  isSupabaseAuthTarget: vi.fn(() => true),
  getSupabaseEnvIssue: vi.fn(() => null),
}))

vi.mock('@/features/admin/auth/adminSupabaseBrowserClient', () => ({
  getAdminSupabaseBrowserClient: () => hoisted.mockClient,
  resetAdminSupabaseBrowserClient: hoisted.resetAdminSupabaseBrowserClient,
  disposeAdminSupabaseBrowserClient: hoisted.disposeAdminSupabaseBrowserClient,
  clearAdminSupabaseAuthStorage: vi.fn(),
  hasAdminSupabaseAuthStorage: vi.fn(() => false),
  getAdminAuthBootstrapEpoch: vi.fn(() => 0),
  invalidateAdminAuthBootstrap: vi.fn(),
}))

function HydrationProbe() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) return null
  return (
    <>
      <span data-testid="hydrated">{String(ctx.isHydrated)}</span>
      <span data-testid="ready">{String(ctx.isRemoteCmsReady)}</span>
      <span data-testid="error">{ctx.remoteHydrateError ?? ''}</span>
    </>
  )
}

function wrap(node: ReactNode) {
  return <AdminAuthProvider>{node}</AdminAuthProvider>
}

describe('AdminAuthProvider (Supabase bootstrap)', () => {
  beforeEach(() => {
    hoisted.mockGetSession.mockImplementation(() => new Promise(() => {}))
    hoisted.resetAdminSupabaseBrowserClient.mockClear()
  })

  describe('bootstrap timeout', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('finishes hydration when getSession times out and recreates client', async () => {
      vi.useFakeTimers()

      render(wrap(<HydrationProbe />))

      expect(screen.getByTestId('hydrated')).toHaveTextContent('false')

      await act(async () => {
        await vi.advanceTimersByTimeAsync(20_000)
      })

      expect(screen.getByTestId('hydrated')).toHaveTextContent('true')
      expect(screen.getByTestId('ready')).toHaveTextContent('true')
      expect(hoisted.disposeAdminSupabaseBrowserClient).toHaveBeenCalled()
      expect(hoisted.resetAdminSupabaseBrowserClient).not.toHaveBeenCalled()
    })
  })

  it('hydrates when there is no Supabase session', async () => {
    hoisted.mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    render(wrap(<HydrationProbe />))

    await waitFor(() => {
      expect(screen.getByTestId('hydrated')).toHaveTextContent('true')
    })
    expect(screen.getByTestId('ready')).toHaveTextContent('true')
    expect(screen.getByTestId('error')).toHaveTextContent('')
  })
})
