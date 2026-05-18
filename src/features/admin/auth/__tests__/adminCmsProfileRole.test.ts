import { describe, expect, it, vi } from 'vitest'
import { fetchCmsProfileRole } from '@/features/admin/auth/adminCmsProfileRole'

describe('fetchCmsProfileRole', () => {
  it('returns null when auth user is missing', async () => {
    const client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    }
    expect(await fetchCmsProfileRole(client as never)).toBeNull()
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
    expect(await fetchCmsProfileRole(client as never)).toBe('admin')
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
    expect(await fetchCmsProfileRole(client as never)).toBe('editor')
  })
})
