import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'

describe('supabasePublicEnv', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns null when url or publishable key is missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '')
    const { getSupabasePublicEnv } = await import('../supabasePublicEnv')
    expect(getSupabasePublicEnv()).toBeNull()
  })

  it('rejects placeholder publishable keys', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_...')
    const { getSupabasePublicEnv, getSupabaseEnvIssue } = await import(
      '../supabasePublicEnv'
    )
    expect(getSupabasePublicEnv()).toBeNull()
    expect(getSupabaseEnvIssue()).toMatch(/placeholder/i)
  })

  it('prefers VITE_SUPABASE_PUBLISHABLE_KEY over legacy anon key', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test_key_1234567890')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'legacy-anon')
    const { getSupabasePublicEnv } = await import('../supabasePublicEnv')
    expect(getSupabasePublicEnv()).toEqual({
      url: 'https://test.supabase.co',
      anonKey: 'sb_publishable_test_key_1234567890',
    })
  })

  it('falls back to VITE_SUPABASE_ANON_KEY when publishable is unset', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '')
    vi.stubEnv(
      'VITE_SUPABASE_ANON_KEY',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.legacy-anon-jwt-token',
    )
    const { getSupabasePublicEnv } = await import('../supabasePublicEnv')
    expect(getSupabasePublicEnv()?.anonKey).toContain('eyJ')
  })

  it('isSupabaseAuthTarget is true when only URL is set', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '')
    const { isSupabaseAuthTarget } = await import('../supabasePublicEnv')
    expect(isSupabaseAuthTarget()).toBe(true)
  })
})
