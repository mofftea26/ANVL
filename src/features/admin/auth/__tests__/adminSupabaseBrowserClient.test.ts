import { afterEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  createAnvlSupabaseClient: vi.fn(() => ({ auth: {} })),
}))

vi.mock('@/features/cms/api/supabasePublicEnv', () => ({
  getSupabasePublicEnv: vi.fn(() => ({
    url: 'https://test.supabase.co',
    anonKey: 'sb_publishable_test_key_1234567890',
  })),
}))

vi.mock('@/features/cms/api/createAnvlSupabaseClient', () => ({
  createAnvlSupabaseClient: hoisted.createAnvlSupabaseClient,
}))

import {
  disposeAdminSupabaseBrowserClient,
  getAdminSupabaseBrowserClient,
  hasAdminSupabaseAuthStorage,
  ADMIN_SUPABASE_AUTH_STORAGE_KEY,
} from '../adminSupabaseBrowserClient'

describe('adminSupabaseBrowserClient', () => {
  afterEach(() => {
    disposeAdminSupabaseBrowserClient()
    hoisted.createAnvlSupabaseClient.mockClear()
  })

  it('reuses one client per browser context (globalThis singleton)', () => {
    const a = getAdminSupabaseBrowserClient()
    const b = getAdminSupabaseBrowserClient()
    expect(a).toBe(b)
    expect(hoisted.createAnvlSupabaseClient).toHaveBeenCalledTimes(1)
    expect(hoisted.createAnvlSupabaseClient).toHaveBeenCalledWith(
      {
        url: 'https://test.supabase.co',
        anonKey: 'sb_publishable_test_key_1234567890',
      },
      expect.objectContaining({
        auth: expect.objectContaining({
          storageKey: ADMIN_SUPABASE_AUTH_STORAGE_KEY,
        }),
      }),
    )
  })

  it('dispose clears the singleton so the next call creates a fresh client', () => {
    getAdminSupabaseBrowserClient()
    disposeAdminSupabaseBrowserClient()
    getAdminSupabaseBrowserClient()
    expect(hoisted.createAnvlSupabaseClient).toHaveBeenCalledTimes(2)
  })

  it('hasAdminSupabaseAuthStorage reflects localStorage bucket', () => {
    window.localStorage.setItem(ADMIN_SUPABASE_AUTH_STORAGE_KEY, '{"access_token":"x"}')
    expect(hasAdminSupabaseAuthStorage()).toBe(true)
    window.localStorage.removeItem(ADMIN_SUPABASE_AUTH_STORAGE_KEY)
    expect(hasAdminSupabaseAuthStorage()).toBe(false)
  })
})
