import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import {
  assertSupabaseAdminAccess,
  fetchCmsProfileRoleWhenReady,
  readBootstrapAdminSession,
  signInAdminWithPassword,
  waitForSupabaseClientSession,
} from '../adminSupabaseAuthFlow'

const mockFetchRole = vi.fn()
const mockClearStorage = vi.fn()

vi.mock('@/features/admin/auth/adminSupabaseBrowserClient', () => ({
  clearAdminSupabaseAuthStorage: () => mockClearStorage(),
  hasAdminSupabaseAuthStorage: () => mockHadStorage(),
}))

const mockHadStorage = vi.fn(() => false)

vi.mock('@/features/admin/auth/adminCmsProfileRole', () => ({
  fetchCmsProfileRole: (...args: unknown[]) => mockFetchRole(...args),
  fetchCmsProfileRoleWithAccessToken: (...args: unknown[]) =>
    mockFetchRoleWithToken(...args),
  formatCmsAdminAccessDeniedReason: (
    fetch: { role: string | null; selectError: string | null },
    userId?: string,
  ) => `denied:${fetch.role ?? 'none'}:${userId ?? 'unknown'}`,
}))

const mockFetchRoleWithToken = vi.fn()

vi.mock('@/features/admin/cmsRemote/adminCmsHydration', () => ({
  hydrateAdminCmsFromSupabase: vi.fn(),
}))

vi.mock('@/features/cms/api/supabasePublicEnv', () => ({
  getSupabasePublicEnv: () => ({
    url: 'https://test.supabase.co',
    anonKey: 'test-anon-key',
  }),
}))

function makeUser(id = 'user-1'): User {
  return {
    id,
    email: 'admin@test.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '',
  } as User
}

function makeAuthClient(
  getSession: () => Promise<{ data: { session: null | { user: User } } }>,
  signInWithPassword?: () => Promise<{
    data: { user: User | null; session: null }
    error: { message: string } | null
  }>,
  getUser?: () => Promise<{ data: { user: User | null }; error: null }>,
) {
  return {
    auth: {
      getSession,
      getUser:
        getUser ??
        (async () => ({
          data: { user: null },
          error: null,
        })),
      signInWithPassword:
        signInWithPassword ??
        (async () => ({
          data: { user: null, session: null },
          error: { message: 'not implemented' },
        })),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    }),
  } as unknown as SupabaseClient
}

function makeClient(
  getSession: () => Promise<{ data: { session: null | { user: User } } }>,
  getUser?: () => Promise<{ data: { user: User | null }; error: null }>,
) {
  return makeAuthClient(getSession, undefined, getUser)
}

describe('signInAdminWithPassword', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns user on success', async () => {
    const user = makeUser()
    const client = makeAuthClient(
      async () => ({ data: { session: null } }),
      async () => ({ data: { user, session: null }, error: null }),
    )
    await expect(
      signInAdminWithPassword(client, {
        email: 'admin@test.com',
        password: 'secret',
      }),
    ).resolves.toEqual({ ok: true, user, session: null })
  })

  it('times out when signInWithPassword hangs', async () => {
    const client = makeAuthClient(
      async () => ({ data: { session: null } }),
      () => new Promise(() => {}),
    )
    const promise = signInAdminWithPassword(client, {
      email: 'admin@test.com',
      password: 'secret',
    })
    await vi.advanceTimersByTimeAsync(20_000)
    await expect(promise).resolves.toMatchObject({
      ok: false,
      error: expect.stringMatching(/signInWithPassword timed out/i),
    })
  })
})

describe('readBootstrapAdminSession', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockClearStorage.mockClear()
    mockHadStorage.mockReturnValue(false)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns null quickly when there is no session', async () => {
    const client = makeClient(async () => ({ data: { session: null } }))
    await expect(readBootstrapAdminSession(client)).resolves.toEqual({
      session: null,
      staleStorageCleared: false,
      hadStoredSession: false,
    })
  })

  it('returns null when getSession hangs without clearing storage', async () => {
    mockHadStorage.mockReturnValue(true)
    const client = makeClient(() => new Promise(() => {}))
    const promise = readBootstrapAdminSession(client)
    await vi.advanceTimersByTimeAsync(20_000)
    await expect(promise).resolves.toEqual({
      session: null,
      staleStorageCleared: false,
      hadStoredSession: true,
      bootstrapTimedOut: true,
    })
    expect(mockClearStorage).not.toHaveBeenCalled()
  })

  it('falls back to getUser when getSession times out but storage has tokens', async () => {
    mockHadStorage.mockReturnValue(true)
    const user = makeUser()
    const client = makeClient(
      () => new Promise(() => {}),
      async () => ({ data: { user }, error: null }),
    )
    const promise = readBootstrapAdminSession(client)
    await vi.advanceTimersByTimeAsync(20_000)
    const result = await promise
    expect(result.hadStoredSession).toBe(true)
    expect(result.staleStorageCleared).toBe(false)
    expect(result.session?.user.id).toBe(user.id)
  })
})

describe('waitForSupabaseClientSession', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns session once getSession resolves with matching user', async () => {
    const user = makeUser()
    let calls = 0
    const client = makeClient(async () => {
      calls += 1
      if (calls === 1) return { data: { session: null } }
      return { data: { session: { user } } }
    })

    const promise = waitForSupabaseClientSession(client, user.id)
    await vi.runAllTimersAsync()
    await expect(promise).resolves.toMatchObject({ user: { id: user.id } })
  })
})

describe('fetchCmsProfileRoleWhenReady', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockFetchRole.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('retries until admin role is returned', async () => {
    mockFetchRole
      .mockResolvedValueOnce({ role: null, selectError: null })
      .mockResolvedValueOnce({ role: 'admin', selectError: null })

    const client = {} as SupabaseClient
    const promise = fetchCmsProfileRoleWhenReady(client, 'user-1')
    await vi.runAllTimersAsync()
    await expect(promise).resolves.toEqual({ role: 'admin', selectError: null })
    expect(mockFetchRole).toHaveBeenCalledTimes(2)
  })
})

describe('assertSupabaseAdminAccess', () => {
  beforeEach(() => {
    mockFetchRole.mockReset()
    mockFetchRoleWithToken.mockReset()
  })

  it('accepts admin after session attach and role read', async () => {
    const user = makeUser()
    const client = makeClient(async () => ({
      data: { session: { user } },
    }))
    mockFetchRole.mockResolvedValue({ role: 'admin', selectError: null })

    await expect(assertSupabaseAdminAccess(client, user)).resolves.toEqual({
      ok: true,
      user,
    })
  })

  it('skips session attach when caller already trusts the user', async () => {
    const user = makeUser()
    const getSession = vi.fn()
    const client = makeClient(getSession)
    mockFetchRole.mockResolvedValue({ role: 'admin', selectError: null })

    await expect(
      assertSupabaseAdminAccess(client, user, { skipSessionAttach: true }),
    ).resolves.toEqual({ ok: true, user })

    expect(getSession).not.toHaveBeenCalled()
  })

  it('uses a single role read on fastRoleCheck', async () => {
    const user = makeUser()
    const client = makeClient(async () => ({ data: { session: { user } } }))
    mockFetchRole.mockResolvedValue({ role: 'admin', selectError: null })

    await expect(
      assertSupabaseAdminAccess(client, user, {
        skipSessionAttach: true,
        fastRoleCheck: true,
      }),
    ).resolves.toEqual({ ok: true, user })

    expect(mockFetchRole).toHaveBeenCalledTimes(1)
    expect(mockFetchRoleWithToken).not.toHaveBeenCalled()
  })

  it('reads role via access token when session is provided on login', async () => {
    const user = makeUser('user-token')
    const client = makeClient(async () => ({ data: { session: null } }))
    mockFetchRoleWithToken.mockResolvedValue({ role: 'admin', selectError: null })

    await expect(
      assertSupabaseAdminAccess(client, user, {
        skipSessionAttach: true,
        fastRoleCheck: true,
        session: {
          access_token: 'jwt-access',
          refresh_token: 'jwt-refresh',
          user,
        } as never,
      }),
    ).resolves.toEqual({ ok: true, user })

    expect(mockFetchRoleWithToken).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      'jwt-access',
      'user-token',
    )
    expect(mockFetchRole).not.toHaveBeenCalled()
  })

  it('rejects non-admin with formatted reason', async () => {
    const user = makeUser('user-2')
    const client = makeClient(async () => ({
      data: { session: { user } },
    }))
    mockFetchRole.mockResolvedValue({ role: null, selectError: null })

    await expect(assertSupabaseAdminAccess(client, user)).resolves.toEqual({
      ok: false,
      error: 'denied:none:user-2',
    })
  })
})
