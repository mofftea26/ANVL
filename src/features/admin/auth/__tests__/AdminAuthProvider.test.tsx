import { render, screen, act, waitFor } from '@testing-library/react'
import { useContext, type ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AdminAuthContext, AdminAuthProvider } from '../AdminAuthProvider'
import type { AdminAuthContextValue } from '../adminAuth.types'

const hoisted = vi.hoisted(() => ({
  getAdminSessionServerFn: vi.fn(),
  loginAdminServerFn: vi.fn(),
  logoutAdminServerFn: vi.fn(async () => ({ ok: true as const })),
  setSession: vi.fn(async () => ({})),
  signOut: vi.fn(async () => ({})),
  hydrateAdminCmsFromSupabase: vi.fn(async () => {}),
}))

vi.mock('@tanstack/react-start', () => ({
  useServerFn:
    <T,>(fn: T) =>
    fn,
}))

vi.mock('@/features/admin/auth/adminAuth', () => ({
  getAdminSessionServerFn: hoisted.getAdminSessionServerFn,
  loginAdminServerFn: hoisted.loginAdminServerFn,
  logoutAdminServerFn: hoisted.logoutAdminServerFn,
}))

vi.mock('@/features/admin/auth/adminSupabaseBrowserClient', () => ({
  getAdminSupabaseBrowserClient: () => ({
    auth: { setSession: hoisted.setSession, signOut: hoisted.signOut },
  }),
}))

vi.mock('@/features/admin/cmsRemote/adminCmsHydration', () => ({
  hydrateAdminCmsFromSupabase: hoisted.hydrateAdminCmsFromSupabase,
}))

function StateProbe() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) return null
  return (
    <>
      <span data-testid="bootstrapping">{String(ctx.isBootstrapping)}</span>
      <span data-testid="authenticated">{String(ctx.isAuthenticated)}</span>
      <span data-testid="ready">{String(ctx.isRemoteCmsReady)}</span>
      <span data-testid="email">{ctx.session?.email ?? ''}</span>
    </>
  )
}

function wrap(node: ReactNode) {
  return <AdminAuthProvider>{node}</AdminAuthProvider>
}

describe('AdminAuthProvider', () => {
  beforeEach(() => {
    hoisted.getAdminSessionServerFn.mockReset()
    hoisted.loginAdminServerFn.mockReset()
    hoisted.setSession.mockClear()
    hoisted.hydrateAdminCmsFromSupabase.mockClear()
  })

  it('bootstraps to logged out when the server has no session', async () => {
    hoisted.getAdminSessionServerFn.mockResolvedValue({ authenticated: false })

    render(wrap(<StateProbe />))

    await waitFor(() => {
      expect(screen.getByTestId('bootstrapping')).toHaveTextContent('false')
    })
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
  })

  it('bootstraps to authenticated and pulls remote CMS when the server has a session', async () => {
    hoisted.getAdminSessionServerFn.mockResolvedValue({
      authenticated: true,
      user: { userId: 'user-1', email: 'admin@anvl.test', displayName: 'Admin' },
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
    })

    render(wrap(<StateProbe />))

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
    })
    expect(screen.getByTestId('email')).toHaveTextContent('admin@anvl.test')
    expect(hoisted.setSession).toHaveBeenCalledWith({
      access_token: 'access-1',
      refresh_token: 'refresh-1',
    })
    await waitFor(() => {
      expect(screen.getByTestId('ready')).toHaveTextContent('true')
    })
    expect(hoisted.hydrateAdminCmsFromSupabase).toHaveBeenCalledTimes(1)
  })

  it('login() applies the returned session on success', async () => {
    hoisted.getAdminSessionServerFn.mockResolvedValue({ authenticated: false })
    hoisted.loginAdminServerFn.mockResolvedValue({
      ok: true,
      user: { userId: 'user-2', email: 'owner@anvl.test', displayName: 'Owner' },
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
    })

    let ctxRef: AdminAuthContextValue | null = null
    function Capture() {
      ctxRef = useContext(AdminAuthContext)
      return null
    }
    render(wrap(<Capture />))
    await waitFor(() => expect(ctxRef?.isBootstrapping).toBe(false))

    await act(async () => {
      const result = await ctxRef!.login({
        email: 'owner@anvl.test',
        password: 'secret',
        rememberMe: true,
      })
      expect(result.ok).toBe(true)
    })

    expect(ctxRef!.session?.email).toBe('owner@anvl.test')
    expect(hoisted.loginAdminServerFn).toHaveBeenCalledWith({
      data: { email: 'owner@anvl.test', password: 'secret', rememberMe: true },
    })
  })

  it('login() surfaces the server error without setting a session', async () => {
    hoisted.getAdminSessionServerFn.mockResolvedValue({ authenticated: false })
    hoisted.loginAdminServerFn.mockResolvedValue({
      ok: false,
      error: 'Incorrect email or password.',
    })

    let ctxRef: AdminAuthContextValue | null = null
    function Capture() {
      ctxRef = useContext(AdminAuthContext)
      return null
    }
    render(wrap(<Capture />))
    await waitFor(() => expect(ctxRef?.isBootstrapping).toBe(false))

    await act(async () => {
      const result = await ctxRef!.login({
        email: 'nope@anvl.test',
        password: 'wrong',
        rememberMe: false,
      })
      expect(result).toEqual({ ok: false, error: 'Incorrect email or password.' })
    })

    expect(ctxRef!.session).toBeNull()
  })
})
