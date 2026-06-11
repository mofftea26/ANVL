import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockGetEnv = vi.hoisted(() => vi.fn<() => { url: string; anonKey: string } | null>(() => null))

vi.mock('@/features/cms/api/supabasePublicEnv', () => ({
  getSupabasePublicEnv: () => mockGetEnv(),
}))

import {
  formatCmsDropMediaObjectPath,
  publicCmsMediaUrl,
} from '../uploadCmsMedia'

describe('formatCmsDropMediaObjectPath', () => {
  it('builds a slug-safe drops path with role and extension', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-19T12:00:00.000Z'))

    const file = new File(['x'], 'Hero Lockup.PNG', { type: 'image/png' })
    const path = formatCmsDropMediaObjectPath('The Oath!', 'hero', file)

    expect(path).toMatch(/^drops\/the-oath\/hero-\d+\.png$/)
    vi.useRealTimers()
  })

  it('falls back to bin when type and filename lack extension', () => {
    const file = new File(['x'], '', { type: 'application/octet-stream' })
    const path = formatCmsDropMediaObjectPath('drop-01', 'emblem', file)
    expect(path).toMatch(/^drops\/drop-01\/emblem-\d+\.bin$/)
  })
})

describe('publicCmsMediaUrl', () => {
  beforeEach(() => {
    mockGetEnv.mockReturnValue(null)
  })

  it('returns null when Supabase env is unset', () => {
    expect(publicCmsMediaUrl('drops/test/hero.png')).toBeNull()
  })

  it('returns null for empty or missing object paths', () => {
    expect(publicCmsMediaUrl(undefined)).toBeNull()
    expect(publicCmsMediaUrl(null)).toBeNull()
    expect(publicCmsMediaUrl('')).toBeNull()
    expect(publicCmsMediaUrl('   ')).toBeNull()
  })

  it('builds a public storage URL when env is set', () => {
    mockGetEnv.mockReturnValue({
      url: 'https://project.supabase.co',
      anonKey: 'key',
    })
    expect(publicCmsMediaUrl('drops/test/hero.png')).toBe(
      'https://project.supabase.co/storage/v1/object/public/cms-media/drops/test/hero.png',
    )
  })
})
