import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockFlush = vi.fn()
const mockGetEnv = vi.fn()

vi.mock('@/features/cms/api/supabasePublicEnv', () => ({
  getSupabasePublicEnv: () => mockGetEnv(),
}))

vi.mock('@/features/admin/cmsRemote/adminCmsRemoteSync', () => ({
  flushAdminCmsRemoteSync: (...args: unknown[]) => mockFlush(...args),
}))

vi.mock('@/features/admin/drops/drops.service', () => ({
  deleteDrop: vi.fn(),
  duplicateDrop: vi.fn(() => ({
    id: 'drop-copy',
    slug: 'copy',
    title: 'Copy',
    name: 'Copy',
    dropNumber: '02',
    status: 'inactive',
    isActive: false,
    productIds: [],
    updatedAt: '2026-05-19T00:00:00.000Z',
    createdAt: '2026-05-19T00:00:00.000Z',
    visuals: { emblemImageUrl: '' },
    theme: { accent: '#E7E4DF' },
  })),
  readDropsArray: vi.fn(() => []),
  scheduleDropActivation: vi.fn(),
  setActiveDrop: vi.fn(),
  deactivateDrop: vi.fn(),
}))

const mockClearStorefront = vi.fn()
const mockRehydrate = vi.fn()

vi.mock('@/features/admin/cmsRemote/adminCmsPublish', () => ({
  publishStorefrontDropByClientId: vi.fn(),
  clearStorefrontActiveDrop: (...args: unknown[]) => mockClearStorefront(...args),
}))

vi.mock('@/features/admin/cmsRemote/rehydrateAdminCmsFromRemote', () => ({
  rehydrateAdminCmsFromRemote: (...args: unknown[]) => mockRehydrate(...args),
}))

import { localStorageCmsClient } from '@/features/cms/api/cmsClient.localStorage'

describe('localStorageCmsClient drop mutations', () => {
  beforeEach(() => {
    mockFlush.mockReset()
    mockGetEnv.mockReset()
    mockClearStorefront.mockReset()
    mockRehydrate.mockReset()
    mockFlush.mockResolvedValue({ ok: true })
    mockClearStorefront.mockResolvedValue({ ok: true })
    mockRehydrate.mockResolvedValue(undefined)
  })

  it('flushes to Supabase after duplicate when env is set', async () => {
    mockGetEnv.mockReturnValue({ url: 'https://x.supabase.co', anonKey: 'k' })
    await localStorageCmsClient.duplicateAdminDrop('drop-src')
    expect(mockFlush).toHaveBeenCalledTimes(1)
  })

  it('flushes to Supabase after schedule when env is set', async () => {
    mockGetEnv.mockReturnValue({ url: 'https://x.supabase.co', anonKey: 'k' })
    await localStorageCmsClient.scheduleAdminDrop(
      'drop-1',
      '2026-06-01T00:00:00.000Z',
    )
    expect(mockRehydrate).toHaveBeenCalledTimes(2)
    expect(mockFlush).toHaveBeenCalledTimes(1)
  })


  it('flushes to Supabase after delete when env is set', async () => {
    mockGetEnv.mockReturnValue({ url: 'https://x.supabase.co', anonKey: 'k' })
    await localStorageCmsClient.deleteAdminDrop('drop-1')
    expect(mockFlush).toHaveBeenCalledTimes(1)
  })

  it('clears storefront active drop and rehydrates on deactivate', async () => {
    const { deactivateDrop } = await import('@/features/admin/drops/drops.service')
    await localStorageCmsClient.deactivateAdminDrop('drop-1')
    expect(deactivateDrop).toHaveBeenCalledWith('drop-1')
    expect(mockClearStorefront).toHaveBeenCalledTimes(1)
    expect(mockRehydrate).toHaveBeenCalledTimes(1)
  })

  it('skips flush when Supabase env is unset', async () => {
    mockGetEnv.mockReturnValue(null)
    await localStorageCmsClient.deleteAdminDrop('drop-1')
    expect(mockFlush).not.toHaveBeenCalled()
  })

  it('throws when flush fails so the UI can toast', async () => {
    mockGetEnv.mockReturnValue({ url: 'https://x.supabase.co', anonKey: 'k' })
    mockFlush.mockResolvedValue({ ok: false, error: 'RLS denied' })
    await expect(
      localStorageCmsClient.deleteAdminDrop('drop-1'),
    ).rejects.toThrow('RLS denied')
  })
})
