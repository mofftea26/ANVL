import { describe, expect, it } from 'vitest'
import {
  isExternalHref,
  isLikelySafeMediaSrc,
  normalizeLinkHref,
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

describe('normalizeLinkHref', () => {
  it('prepends https:// to a scheme-less host so sanitizeHref accepts it', () => {
    expect(normalizeLinkHref('shop.com/sale')).toBe('https://shop.com/sale')
    // Regression: this bare value silently produced no banner link before.
    expect(sanitizeHref(normalizeLinkHref('shop.com/sale'))).toBe('https://shop.com/sale')
  })

  it('leaves relative paths, hashes, and queries untouched', () => {
    expect(normalizeLinkHref('/shop')).toBe('/shop')
    expect(normalizeLinkHref('#section')).toBe('#section')
    expect(normalizeLinkHref('?q=1')).toBe('?q=1')
  })

  it('leaves already-schemed URLs untouched', () => {
    expect(normalizeLinkHref('https://x.com')).toBe('https://x.com')
    expect(normalizeLinkHref('mailto:hi@anvl.lb')).toBe('mailto:hi@anvl.lb')
    expect(normalizeLinkHref('tel:+9611234567')).toBe('tel:+9611234567')
  })

  it('trims and maps empty to empty', () => {
    expect(normalizeLinkHref('   ')).toBe('')
    expect(normalizeLinkHref('  example.com  ')).toBe('https://example.com')
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

describe('isLikelySafeMediaSrc (SEC-20)', () => {
  it.each([
    ['/brand/stacked.svg'],
    ['/media/hero.mp4'],
    ['https://cdn.example.com/img.png'],
    ['http://insecure.example.com/img.png'],
    ['data:image/png;base64,AAAA'],
    ['data:image/svg+xml,<svg/>'],
    ['data:video/mp4;base64,AAAA'],
    ['#frag'],
  ])('accepts %s', (input) => {
    expect(isLikelySafeMediaSrc(input)).toBe(true)
  })

  it.each([
    ['javascript:alert(1)'],
    ['data:text/html,<script>alert(1)</script>'],
    ['data:application/x-shockwave-flash,...'],
    ['vbscript:msgbox()'],
    ['file:///etc/passwd'],
    ['ssh://malicious'],
    ['brand/stacked.svg'], // scheme-less, ambiguous
    [''],
    ['  '],
    ['javascript\n:alert(1)'],
  ])('rejects %s', (input) => {
    expect(isLikelySafeMediaSrc(input)).toBe(false)
  })

  it('rejects non-string input', () => {
    expect(isLikelySafeMediaSrc(null)).toBe(false)
    expect(isLikelySafeMediaSrc(undefined)).toBe(false)
    expect(isLikelySafeMediaSrc(42)).toBe(false)
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
