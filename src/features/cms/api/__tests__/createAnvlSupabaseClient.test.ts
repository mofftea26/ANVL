import { describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  createClient: vi.fn(() => ({ auth: {} })),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: hoisted.createClient,
}))

import { createAnvlSupabaseClient } from '../createAnvlSupabaseClient'

describe('createAnvlSupabaseClient', () => {
  it('passes apikey in global headers', () => {
    const env = {
      url: 'https://project.supabase.co',
      anonKey: 'sb_publishable_test_key_1234567890',
    }
    createAnvlSupabaseClient(env, {
      auth: { persistSession: false },
    })
    expect(hoisted.createClient).toHaveBeenCalledWith(
      env.url,
      env.anonKey,
      expect.objectContaining({
        global: {
          headers: {
            apikey: env.anonKey,
          },
        },
      }),
    )
  })
})
