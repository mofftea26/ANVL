import { describe, expect, it, vi } from 'vitest'
import {
  fetchCmsProfileRole,
  fetchCmsProfileRoleWithAccessToken,
  formatCmsAdminAccessDeniedReason,
} from '@/features/admin/auth/adminCmsProfileRole'

describe('fetchCmsProfileRole', () => {
  it('returns null role when auth user is missing', async () => {
    const client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    }
    expect(await fetchCmsProfileRole(client as never)).toEqual({
      role: null,
      selectError: null,
    })
  })

  it('returns selectError when getUser fails', async () => {
    const client = {
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: null }, error: { message: 'jwt' } }),
      },
    }
    expect(await fetchCmsProfileRole(client as never)).toEqual({
      role: null,
      selectError: 'jwt',
    })
  })

  it('returns admin when cms_profiles row is admin', async () => {
    const client = {
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi
          .fn()
          .mockResolvedValue({ data: { role: 'admin' }, error: null }),
      }),
    }
    expect(await fetchCmsProfileRole(client as never)).toEqual({
      role: 'admin',
      selectError: null,
    })
  })

  it('normalizes role casing and whitespace', async () => {
    const client = {
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi
          .fn()
          .mockResolvedValue({ data: { role: ' Admin ' }, error: null }),
      }),
    }
    expect(await fetchCmsProfileRole(client as never)).toEqual({
      role: 'admin',
      selectError: null,
    })
  })

  it('returns editor when profile is editor', async () => {
    const client = {
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi
          .fn()
          .mockResolvedValue({ data: { role: 'editor' }, error: null }),
      }),
    }
    expect(await fetchCmsProfileRole(client as never)).toEqual({
      role: 'editor',
      selectError: null,
    })
  })

  it('returns selectError when cms_profiles select fails', async () => {
    const client = {
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi
          .fn()
          .mockResolvedValue({ data: null, error: { message: 'permission denied' } }),
      }),
    }
    expect(await fetchCmsProfileRole(client as never)).toEqual({
      role: null,
      selectError: 'permission denied',
    })
  })

  it('uses authenticatedUserId when passed and skips getUser', async () => {
    const getUser = vi.fn()
    const eq = vi.fn().mockReturnThis()
    const client = {
      auth: { getUser },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq,
        maybeSingle: vi
          .fn()
          .mockResolvedValue({ data: { role: 'admin' }, error: null }),
      }),
    }
    expect(await fetchCmsProfileRole(client as never, 'explicit-uid')).toEqual({
      role: 'admin',
      selectError: null,
    })
    expect(getUser).not.toHaveBeenCalled()
    expect(eq).toHaveBeenCalledWith('user_id', 'explicit-uid')
  })
})

describe('fetchCmsProfileRoleWithAccessToken', () => {
  it('returns admin when PostgREST returns a row', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ role: 'admin' }],
      }),
    )
    await expect(
      fetchCmsProfileRoleWithAccessToken(
        'https://test.supabase.co',
        'anon-key',
        'access-token',
        'user-1',
      ),
    ).resolves.toEqual({ role: 'admin', selectError: null })
    expect(fetch).toHaveBeenCalledWith(
      'https://test.supabase.co/rest/v1/cms_profiles?select=role&user_id=eq.user-1',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token',
          apikey: 'anon-key',
        }),
      }),
    )
    vi.unstubAllGlobals()
  })

  it('returns selectError when PostgREST rejects the request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'JWT expired' }),
      }),
    )
    await expect(
      fetchCmsProfileRoleWithAccessToken(
        'https://test.supabase.co',
        'anon-key',
        'bad-token',
        'user-1',
      ),
    ).resolves.toEqual({ role: null, selectError: 'JWT expired' })
    vi.unstubAllGlobals()
  })
})

describe('formatCmsAdminAccessDeniedReason', () => {
  it('mentions RLS when select failed', () => {
    const msg = formatCmsAdminAccessDeniedReason({
      role: null,
      selectError: 'permission denied for table cms_profiles',
    })
    expect(msg).toContain('permission denied')
    expect(msg).toContain('RLS')
  })

  it('mentions editor/viewer when role is non-admin', () => {
    expect(
      formatCmsAdminAccessDeniedReason({ role: 'editor', selectError: null }),
    ).toMatch(/editor\/viewer/i)
  })

  it('mentions cms_profiles when no row or unknown role string', () => {
    expect(
      formatCmsAdminAccessDeniedReason({ role: null, selectError: null }),
    ).toContain('cms_profiles')
  })
})
