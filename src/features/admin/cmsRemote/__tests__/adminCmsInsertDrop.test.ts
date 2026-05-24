import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { Drop } from '@/features/admin/drops/drops.types'
import { buildAnvlDropRemoteRow } from '@/features/admin/cmsRemote/adminCmsDropRemoteRow'
import { insertAnvlDropToSupabase } from '@/features/admin/cmsRemote/adminCmsInsertDrop'

const mockGetEnv = vi.fn()
const mockGetClient = vi.fn()
const mockFetchRole = vi.fn()

vi.mock('@/features/cms/api/supabasePublicEnv', () => ({
  getSupabasePublicEnv: () => mockGetEnv(),
}))

vi.mock('@/features/admin/auth/adminSupabaseBrowserClient', () => ({
  getAdminSupabaseBrowserClient: () => mockGetClient(),
}))

vi.mock('@/features/admin/auth/adminCmsProfileRole', () => ({
  fetchCmsProfileRole: (...args: unknown[]) => mockFetchRole(...args),
}))

function sampleDrop(): Drop {
  return {
    id: 'drop-test-1',
    slug: 'test-1',
    name: 'Untitled drop',
    dropNumber: '02',
    title: 'NEW DROP',
    subtitle: 'Subtitle',
    description: '',
    status: 'draft',
    isActive: false,
    createdAt: '2026-05-19T00:00:00.000Z',
    updatedAt: '2026-05-19T00:00:00.000Z',
    releaseDate: undefined,
    scheduledActivationAt: undefined,
    theme: {} as Drop['theme'],
    visuals: {} as Drop['visuals'],
    landingContent: {} as Drop['landingContent'],
    landingActSequence: [],
    acts: [],
    productIds: [],
    seo: { title: 'ANVL Athletics', description: '' },
  }
}

describe('buildAnvlDropRemoteRow', () => {
  it('maps drop fields to anvl_drops columns', () => {
    const drop = sampleDrop()
    expect(buildAnvlDropRemoteRow(drop)).toEqual({
      slug: 'test-1',
      status: 'draft',
      draft_body: drop,
      client_drop_id: 'drop-test-1',
      release_date: null,
      scheduled_activation_at: null,
    })
  })
})

describe('insertAnvlDropToSupabase', () => {
  beforeEach(() => {
    mockGetEnv.mockReset()
    mockGetClient.mockReset()
    mockFetchRole.mockReset()
  })

  it('no-ops when Supabase env is unset', async () => {
    mockGetEnv.mockReturnValue(null)
    await expect(insertAnvlDropToSupabase(sampleDrop())).resolves.toEqual({
      ok: true,
    })
    expect(mockGetClient).not.toHaveBeenCalled()
  })

  it('inserts a row when none exists for client_drop_id', async () => {
    mockGetEnv.mockReturnValue({ url: 'https://x.supabase.co', anonKey: 'k' })
    const insert = vi.fn().mockResolvedValue({ error: null })
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn((table: string) => {
      expect(table).toBe('anvl_drops')
      return { select, insert }
    })
    mockGetClient.mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { access_token: 't' } },
        }),
      },
      from,
    })
    mockFetchRole.mockResolvedValue({ role: 'admin', selectError: null })

    await expect(insertAnvlDropToSupabase(sampleDrop())).resolves.toEqual({
      ok: true,
    })
    expect(insert).toHaveBeenCalledWith(buildAnvlDropRemoteRow(sampleDrop()))
  })

  it('skips insert when row already exists', async () => {
    mockGetEnv.mockReturnValue({ url: 'https://x.supabase.co', anonKey: 'k' })
    const insert = vi.fn()
    const maybeSingle = vi
      .fn()
      .mockResolvedValue({ data: { id: 'uuid-1' }, error: null })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    mockGetClient.mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { access_token: 't' } },
        }),
      },
      from: vi.fn(() => ({ select, insert })),
    })
    mockFetchRole.mockResolvedValue({ role: 'admin', selectError: null })

    await expect(insertAnvlDropToSupabase(sampleDrop())).resolves.toEqual({
      ok: true,
    })
    expect(insert).not.toHaveBeenCalled()
  })

  it('returns error when insert fails', async () => {
    mockGetEnv.mockReturnValue({ url: 'https://x.supabase.co', anonKey: 'k' })
    const insert = vi
      .fn()
      .mockResolvedValue({ error: { message: 'duplicate slug' } })
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    mockGetClient.mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { access_token: 't' } },
        }),
      },
      from: vi.fn(() => ({ select, insert })),
    })
    mockFetchRole.mockResolvedValue({ role: 'admin', selectError: null })

    await expect(insertAnvlDropToSupabase(sampleDrop())).resolves.toEqual({
      ok: false,
      error: 'duplicate slug',
    })
  })
})
