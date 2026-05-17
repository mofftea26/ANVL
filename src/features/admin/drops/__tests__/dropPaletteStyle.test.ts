import { describe, expect, it } from 'vitest'
import {
  dropPaletteToCssVarsRecord,
  sanitizeCssValue,
  serializeDropPaletteForRootStyle,
} from '@/features/admin/drops/dropPaletteStyle'
import { DROP_THEME_PRESETS } from '@/features/admin/drops/drops.presets'

const safePalette = DROP_THEME_PRESETS[0]!

describe('sanitizeCssValue (SEC defense for active-drop theme injection)', () => {
  it('returns the trimmed value when input is a normal color', () => {
    expect(sanitizeCssValue('  #E7E4DF  ', '#000')).toBe('#E7E4DF')
  })

  it('falls back when the value contains braces (CSS rule break-out)', () => {
    expect(sanitizeCssValue('red; } body { background: pink', '#000')).toBe(
      '#000',
    )
  })

  it.each([
    ['expression(alert(1))'],
    ['EXPRESSION ( alert(1) )'],
    ['javascript:alert(1)'],
    ['JaVaScRiPt:alert(1)'],
    ['@import url(http://evil)'],
    ['<script>'],
  ])('falls back for hostile token %s', (hostile) => {
    expect(sanitizeCssValue(hostile, '#FALLBACK')).toBe('#FALLBACK')
  })

  it('falls back for empty / whitespace-only / oversized input', () => {
    expect(sanitizeCssValue('', '#000')).toBe('#000')
    expect(sanitizeCssValue('     ', '#000')).toBe('#000')
    expect(sanitizeCssValue('a'.repeat(241), '#000')).toBe('#000')
  })
})

describe('serializeDropPaletteForRootStyle', () => {
  it('produces a single :root rule with the expected color variables', () => {
    const css = serializeDropPaletteForRootStyle(safePalette)
    expect(css.startsWith(':root {')).toBe(true)
    expect(css.endsWith('}')).toBe(true)
    expect(css).toContain('--color-bg:')
    expect(css).toContain('--color-text:')
    expect(css).toContain('--color-accent:')
    // never contains the strings sanitizeCssValue blocks
    expect(css).not.toMatch(/<|>|expression\(|javascript:|@import/i)
  })

  it('round-trips through dropPaletteToCssVarsRecord deterministically', () => {
    const rec = dropPaletteToCssVarsRecord(safePalette)
    for (const value of Object.values(rec)) {
      expect(typeof value).toBe('string')
      expect(value.length).toBeGreaterThan(0)
    }
  })
})
