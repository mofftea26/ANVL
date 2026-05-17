import { describe, expect, it } from 'vitest'
import { stripAngleBracketTags } from '@/shared/lib/stripAngleBracketTags'

describe('stripAngleBracketTags (SEC-19)', () => {
  it('removes simple HTML-ish tag patterns', () => {
    expect(stripAngleBracketTags('hello <b>world</b>')).toBe('hello world')
    expect(stripAngleBracketTags('<script>alert(1)</script>')).toBe('alert(1)')
    expect(stripAngleBracketTags('<img src=x onerror=alert(1)>')).toBe('')
  })

  it('leaves plain text untouched', () => {
    expect(stripAngleBracketTags('Forged Under Pressure')).toBe(
      'Forged Under Pressure',
    )
    expect(stripAngleBracketTags('100% cotton — pre-washed')).toBe(
      '100% cotton — pre-washed',
    )
  })

  it('handles null / undefined / empty without throwing', () => {
    expect(stripAngleBracketTags(null)).toBe('')
    expect(stripAngleBracketTags(undefined)).toBe('')
    expect(stripAngleBracketTags('')).toBe('')
  })

  it('strips nested-looking tags greedily but safely', () => {
    expect(stripAngleBracketTags('a<b<c>d>e')).toBe('a<b<c>d>e'.replace(/<[^>]*>/g, ''))
    // The regex is intentionally simple — it doesn't try to handle CDATA or
    // malformed HTML, just removes the common "<...>" patterns operators
    // paste from word processors.
  })
})
