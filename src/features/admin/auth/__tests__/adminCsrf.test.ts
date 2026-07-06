import { describe, expect, it } from 'vitest'
import {
  CSRF_COOKIE_NAME,
  readCsrfCookieFromHeader,
  verifyCsrfTokens,
} from '../adminCsrf'

describe('readCsrfCookieFromHeader', () => {
  it('returns null when there is no cookie header', () => {
    expect(readCsrfCookieFromHeader(null)).toBeNull()
  })

  it('returns null when the CSRF cookie is absent', () => {
    expect(readCsrfCookieFromHeader('other=value; another=thing')).toBeNull()
  })

  it('extracts the token when it is the only cookie', () => {
    expect(readCsrfCookieFromHeader(`${CSRF_COOKIE_NAME}=abc123`)).toBe('abc123')
  })

  it('extracts the token among other cookies, regardless of position', () => {
    expect(
      readCsrfCookieFromHeader(`foo=bar; ${CSRF_COOKIE_NAME}=abc123; baz=qux`),
    ).toBe('abc123')
  })

  it('decodes a URI-encoded value', () => {
    expect(readCsrfCookieFromHeader(`${CSRF_COOKIE_NAME}=abc%2F123`)).toBe('abc/123')
  })
})

describe('verifyCsrfTokens', () => {
  it('rejects when the cookie header is missing', () => {
    expect(verifyCsrfTokens(null, 'abc123')).toBe(false)
  })

  it('rejects when the header token is missing', () => {
    expect(verifyCsrfTokens(`${CSRF_COOKIE_NAME}=abc123`, null)).toBe(false)
  })

  it('rejects when the cookie and header tokens differ (forged request)', () => {
    expect(verifyCsrfTokens(`${CSRF_COOKIE_NAME}=abc123`, 'different-token')).toBe(false)
  })

  it('accepts when the cookie and header tokens match (legitimate same-origin request)', () => {
    expect(verifyCsrfTokens(`${CSRF_COOKIE_NAME}=abc123`, 'abc123')).toBe(true)
  })

  it('rejects an empty-string header token even if a cookie exists', () => {
    expect(verifyCsrfTokens(`${CSRF_COOKIE_NAME}=abc123`, '')).toBe(false)
  })
})
