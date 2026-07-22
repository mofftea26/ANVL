import { describe, expect, it } from 'vitest'
import { buildOAuthCallbackPath } from '../storefrontAuth'

describe('buildOAuthCallbackPath', () => {
  it('returns the bare callback path when no redirect is requested', () => {
    expect(buildOAuthCallbackPath()).toBe('/auth/callback')
    expect(buildOAuthCallbackPath(undefined)).toBe('/auth/callback')
  })

  it('appends the encoded redirect so it survives the OAuth round trip', () => {
    expect(buildOAuthCallbackPath('/p/tok_abc123')).toBe(
      '/auth/callback?redirect=%2Fp%2Ftok_abc123',
    )
  })

  it('encodes query strings inside the redirect (transfer codes ride along)', () => {
    expect(buildOAuthCallbackPath('/p/tok_abc?transfer=xyz')).toBe(
      '/auth/callback?redirect=%2Fp%2Ftok_abc%3Ftransfer%3Dxyz',
    )
  })
})
