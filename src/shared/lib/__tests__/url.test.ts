import { describe, expect, it } from 'vitest'
import {
  isExternalHref,
  sanitizeHref,
  upgradeHttpToHttps,
} from '@/shared/lib/url'

describe('sanitizeHref (SEC-04)', () => {
  it.each([
    ['https://anvl.lb/about', 'https://anvl.lb/about'],
    ['http://example.com', 'http://example.com'],
    ['mailto:hi@anvl.lb', 'mailto:hi@anvl.lb'],
    ['tel:+9611234567', 'tel:+9611234567'],
    ['/shop', '/shop'],
    ['/drop/the-oath?utm=email', '/drop/the-oath?utm=email'],
    ['#anchor', '#anchor'],
    ['?q=forge', '?q=forge'],
    ['  https://anvl.lb  ', 'https://anvl.lb'],
  ])('accepts %s', (input, expected) => {
    expect(sanitizeHref(input)).toBe(expected)
  })

  it.each([
    ['javascript:alert(1)'],
    ['JaVaScRiPt:alert(1)'],
    ['data:text/html,<script>alert(1)</script>'],
    ['vbscript:msgbox()'],
    ['file:///etc/passwd'],
    ['ssh://malicious'],
    ['ftp://files.example.com'],
    ['  '],
    [''],
    // scheme-less ambiguous strings
    ['anvl.lb/shop'],
    ['shop'],
    ['mailto'],
  ])('rejects %s', (input) => {
    expect(sanitizeHref(input)).toBeNull()
  })

  it('rejects non-string input', () => {
    expect(sanitizeHref(null)).toBeNull()
    expect(sanitizeHref(undefined)).toBeNull()
    expect(sanitizeHref(42)).toBeNull()
    expect(sanitizeHref({})).toBeNull()
  })

  it('rejects strings with embedded control characters / smuggled newlines', () => {
    // Embedded inside the URL — not trimmable by .trim()
    expect(sanitizeHref('javascript\n:alert(1)')).toBeNull()
    expect(sanitizeHref('https://anvl.lb\u0000/path')).toBeNull()
    expect(sanitizeHref('https://an\tvl.lb')).toBeNull()
  })

  it('respects the schemes option (https-only)', () => {
    expect(sanitizeHref('http://anvl.lb', { schemes: ['https'] })).toBeNull()
    expect(
      sanitizeHref('mailto:hi@anvl.lb', { schemes: ['https'] }),
    ).toBeNull()
    expect(
      sanitizeHref('https://anvl.lb', { schemes: ['https'] }),
    ).toBe('https://anvl.lb')
  })

  it('rejects relative URLs when allowRelative is false', () => {
    expect(sanitizeHref('/shop', { allowRelative: false })).toBeNull()
    expect(sanitizeHref('#hash', { allowRelative: false })).toBeNull()
    expect(
      sanitizeHref('https://anvl.lb', { allowRelative: false }),
    ).toBe('https://anvl.lb')
  })
})

describe('isExternalHref', () => {
  it.each([
    ['https://anvl.lb', true],
    ['http://anvl.lb', true],
    ['mailto:hi@anvl.lb', true],
    ['tel:+9611234567', true],
    ['/shop', false],
    ['#hash', false],
    ['?q=x', false],
  ])('classifies %s as external=%s', (input, expected) => {
    expect(isExternalHref(input)).toBe(expected)
  })
})

describe('upgradeHttpToHttps (SEC-15)', () => {
  it('upgrades http:// to https://', () => {
    expect(upgradeHttpToHttps('http://example.com/img.png')).toBe(
      'https://example.com/img.png',
    )
  })

  it('leaves https:// alone', () => {
    expect(upgradeHttpToHttps('https://example.com')).toBe('https://example.com')
  })

  it('leaves relative paths alone', () => {
    expect(upgradeHttpToHttps('/img.png')).toBe('/img.png')
  })

  it('does not touch mailto: / tel:', () => {
    expect(upgradeHttpToHttps('mailto:hi@anvl.lb')).toBe('mailto:hi@anvl.lb')
    expect(upgradeHttpToHttps('tel:+9611234567')).toBe('tel:+9611234567')
  })
})
