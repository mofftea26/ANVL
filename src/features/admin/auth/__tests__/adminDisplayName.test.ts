import { describe, expect, it } from 'vitest'
import { supabaseUserDisplayLabel } from '@/features/admin/auth/adminDisplayName'

describe('supabaseUserDisplayLabel', () => {
  it('prefers full_name from user_metadata', () => {
    expect(
      supabaseUserDisplayLabel({
        email: 'a@b.com',
        user_metadata: { full_name: '  George M  ' },
      }),
    ).toBe('George M')
  })

  it('falls back to email local-part', () => {
    expect(
      supabaseUserDisplayLabel({
        email: 'george@gmail.com',
        user_metadata: {},
      }),
    ).toBe('george')
  })

  it('uses display_name when full_name absent', () => {
    expect(
      supabaseUserDisplayLabel({
        email: 'x@y.com',
        user_metadata: { display_name: 'GM' },
      }),
    ).toBe('GM')
  })
})
