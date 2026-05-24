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
  archiveDrop: vi.fn(),
  deleteDrop: vi.fn(),
  duplicateDrop: vi.fn(() => ({
    id: 'drop-copy',
    slug: 'copy',
    title: 'Copy',
    name: 'Copy',
    dropNumber: '02',
    status: 'draft',
    isActive: false,
    productIds: [],
    updatedAt: '2026-05-19T00:00:00.000Z',
    createdAt: '2026-05-19T00:00:00.000Z',
  })),
  readDropsArray: vi.fn(() => []),
  scheduleDropActivation: vi.fn(),
  setActiveDrop: vi.fn(),
}))

import { localStorageCmsClient } from '@/features/cms/api/cmsClient.localStorage'

describe('localStorageCmsClient drop mutations', () => {
  beforeEach(() => {
    mockFlush.mockReset()
    mockGetEnv.mockReset()
    mockFlush.mockResolvedValue({ ok: true })
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
    expect(mockFlush).toHaveBeenCalledTimes(1)
  })

  it('flushes to Supabase after archive when env is set', async () => {
    mockGetEnv.mockReturnValue({ url: 'https://x.supabase.co', anonKey: 'k' })
    await localStorageCmsClient.archiveAdminDrop('drop-1')
    expect(mockFlush).toHaveBeenCalledTimes(1)
  })

  it('flushes to Supabase after delete when env is set', async () => {
    mockGetEnv.mockReturnValue({ url: 'https://x.supabase.co', anonKey: 'k' })
    await localStorageCmsClient.deleteAdminDrop('drop-1')
    expect(mockFlush).toHaveBeenCalledTimes(1)
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
      localStorageCmsClient.archiveAdminDrop('drop-1'),
    ).rejects.toThrow('RLS denied')
  })
})
