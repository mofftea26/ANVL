import { describe, expect, it } from 'vitest'
import { sanitizeInternalRedirect } from '@/features/storefront-account/publicAccount.core'

/**
 * `sanitizeInternalRedirect` guards the `?redirect=` param on sign-in, sign-up
 * and the OAuth callback. An escape here is an open redirect: the phishing link
 * lands on the real ANVL domain, authenticates, then bounces the user out.
 */
describe('sanitizeInternalRedirect — off-origin escapes', () => {
  it.each([
    ['protocol-relative', '//evil.example'],
    ['protocol-relative with path', '//evil.example/pwn'],
    // The bug this test was written for: the WHATWG URL spec treats a
    // backslash as a forward slash in the relative-slash state for special
    // schemes, so browsers resolve `/\host` to `https://host/`.
    ['backslash pair', '/\\evil.example'],
    ['backslash then path', '/\\evil.example/pwn'],
    ['mixed separators', '/\\/evil.example'],
    ['absolute http', 'http://evil.example'],
    ['absolute https', 'https://evil.example'],
    ['javascript scheme', 'javascript:alert(1)'],
    ['data scheme', 'data:text/html,<script>alert(1)</script>'],
    ['no leading slash', 'evil.example'],
    ['empty', ''],
  ])('rejects %s', (_label, raw) => {
    expect(sanitizeInternalRedirect(raw)).toBe('/account')
  })

  it('rejects undefined', () => {
    expect(sanitizeInternalRedirect(undefined)).toBe('/account')
  })
})

describe('sanitizeInternalRedirect — legitimate internal paths survive', () => {
  it.each([
    ['/account'],
    ['/account/orders'],
    ['/shop/anvl-oversized-tee'],
    ['/cart'],
  ])('keeps %s', (raw) => {
    expect(sanitizeInternalRedirect(raw)).toBe(raw)
  })

  it('preserves query and hash', () => {
    expect(sanitizeInternalRedirect('/shop?color=black&size=L')).toBe(
      '/shop?color=black&size=L',
    )
    expect(sanitizeInternalRedirect('/account/orders#latest')).toBe(
      '/account/orders#latest',
    )
  })

  it('normalizes traversal rather than leaking it', () => {
    // `..` cannot climb past the origin root, so this stays internal.
    expect(sanitizeInternalRedirect('/a/../account')).toBe('/account')
  })
})
