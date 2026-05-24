import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  canWriteCmsDraftsToSupabase,
  isSupabaseStorefrontConfigured,
  shouldStorefrontUseLocalCmsFallback,
} from '@/features/cms/api/cmsPersistenceMode'

describe('cmsPersistenceMode', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns false for Supabase helpers when env unset', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '')
    expect(isSupabaseStorefrontConfigured()).toBe(false)
    expect(shouldStorefrontUseLocalCmsFallback()).toBe(true)
  })

  it('returns true for Supabase helpers when env is usable', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv(
      'VITE_SUPABASE_PUBLISHABLE_KEY',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
    )
    expect(isSupabaseStorefrontConfigured()).toBe(true)
    expect(shouldStorefrontUseLocalCmsFallback()).toBe(false)
  })

  it('allows editor and admin to write CMS drafts to Supabase', () => {
    expect(canWriteCmsDraftsToSupabase('admin')).toBe(true)
    expect(canWriteCmsDraftsToSupabase('editor')).toBe(true)
    expect(canWriteCmsDraftsToSupabase('viewer')).toBe(false)
    expect(canWriteCmsDraftsToSupabase(null)).toBe(false)
  })
})
