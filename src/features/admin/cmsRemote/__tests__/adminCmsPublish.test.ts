import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  flushAdminCmsRemoteSync,
  fetchCmsProfileRole,
  getAdminSupabaseBrowserClient,
  getSupabasePublicEnv,
} = vi.hoisted(() => ({
  flushAdminCmsRemoteSync: vi.fn(),
  fetchCmsProfileRole: vi.fn(),
  getAdminSupabaseBrowserClient: vi.fn(),
  getSupabasePublicEnv: vi.fn(),
}))

vi.mock('@/features/admin/cmsRemote/adminCmsRemoteSync', () => ({
  flushAdminCmsRemoteSync,
}))
vi.mock('@/features/admin/auth/adminCmsProfileRole', () => ({
  fetchCmsProfileRole,
}))
vi.mock('@/features/admin/auth/adminSupabaseBrowserClient', () => ({
  getAdminSupabaseBrowserClient,
}))
vi.mock('@/features/cms/api/supabasePublicEnv', () => ({
  getSupabasePublicEnv,
}))

import { publishStorefrontDropByClientId } from '@/features/admin/cmsRemote/adminCmsPublish'

describe('publishStorefrontDropByClientId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    flushAdminCmsRemoteSync.mockResolvedValue({ ok: true })
  })

  it('no-ops when Supabase env is unset', async () => {
    getSupabasePublicEnv.mockReturnValue(null)
    await expect(
      publishStorefrontDropByClientId('drop-1'),
    ).resolves.toEqual({ ok: true, revision: 0 })
    expect(flushAdminCmsRemoteSync).not.toHaveBeenCalled()
  })

  it('rejects non-admin roles', async () => {
    getSupabasePublicEnv.mockReturnValue({
      url: 'https://x.supabase.co',
      anonKey: 'anon',
    })
    getAdminSupabaseBrowserClient.mockReturnValue({})
    fetchCmsProfileRole.mockResolvedValue('editor')

    await expect(
      publishStorefrontDropByClientId('drop-1'),
    ).resolves.toEqual({
      ok: false,
      error: 'Only CMS admins can publish to the storefront.',
    })
  })

  it('calls cms_publish_drop with the server row id', async () => {
    getSupabasePublicEnv.mockReturnValue({
      url: 'https://x.supabase.co',
      anonKey: 'anon',
    })
    const rpc = vi.fn().mockResolvedValue({
      data: { revision: 3, publishedAt: '2026-05-19T00:00:00.000Z' },
      error: null,
    })
    const from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' },
            error: null,
          }),
        })),
      })),
    }))
    getAdminSupabaseBrowserClient.mockReturnValue({ from, rpc })
    fetchCmsProfileRole.mockResolvedValue('admin')

    await expect(
      publishStorefrontDropByClientId('client-drop-id'),
    ).resolves.toEqual({ ok: true, revision: 3 })

    expect(rpc).toHaveBeenCalledWith('cms_publish_drop', {
      p_drop_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    })
    expect(from).toHaveBeenCalledWith('anvl_drops')
  })
})
