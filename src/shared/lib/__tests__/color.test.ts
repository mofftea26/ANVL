import { describe, expect, it } from 'vitest'
import {
  bestForeground,
  contrastRatio,
  fromHexWithOpacity,
  isValidColor,
  mix,
  parseColor,
  relativeLuminance,
  suggestAccessibleColor,
  toHexWithOpacity,
  withAlpha,
} from '../color'

describe('relativeLuminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0, a: 1 })).toBeCloseTo(0, 5)
    expect(relativeLuminance({ r: 255, g: 255, b: 255, a: 1 })).toBeCloseTo(1, 5)
  })
})

describe('contrastRatio', () => {
  it('black on white is 21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1)
  })

  it('is symmetric and accepts strings or RgbaColor', () => {
    const a = contrastRatio('#08090a', '#f4f1ea')
    const b = contrastRatio('#f4f1ea', '#08090a')
    expect(a).toBeCloseTo(b, 5)
    expect(a).toBeGreaterThan(15)
  })

  it('falls back safely on unparseable input', () => {
    expect(contrastRatio('not-a-color', '#ffffff')).toBeGreaterThan(0)
  })
})

describe('parseColor / isValidColor', () => {
  it('parses hex, short hex, and rgba', () => {
    expect(parseColor('#08090a')).toEqual({ r: 8, g: 9, b: 10, a: 1 })
    expect(parseColor('#abc')).toEqual({ r: 170, g: 187, b: 204, a: 1 })
    expect(parseColor('rgba(194, 112, 61, 0.2)')?.a).toBeCloseTo(0.2, 2)
  })

  it('rejects unparseable / non-color input', () => {
    expect(parseColor('not-a-color')).toBeNull()
    expect(parseColor('')).toBeNull()
    expect(parseColor(undefined)).toBeNull()
    expect(isValidColor('rgb(oops)')).toBe(false)
    expect(isValidColor('#08090a')).toBe(true)
  })
})

describe('bestForeground', () => {
  it('chooses dark text on the champagne accent', () => {
    expect(bestForeground('#C7B28E')).toBe('#111111')
  })

  it('chooses light text on a near-black surface', () => {
    expect(bestForeground('#08090A')).toBe('#ffffff')
  })
})

describe('suggestAccessibleColor', () => {
  it('returns a color that clears the target ratio', () => {
    const fixed = suggestAccessibleColor('#777777', '#ffffff', 4.5)
    expect(contrastRatio(fixed, '#ffffff')).toBeGreaterThanOrEqual(4.5)
  })

  it('keeps an already-passing color', () => {
    const fixed = suggestAccessibleColor('#000000', '#ffffff', 4.5)
    expect(contrastRatio(fixed, '#ffffff')).toBeGreaterThanOrEqual(4.5)
  })
})

describe('mix', () => {
  it('blends halfway between two colors', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080')
  })

  it('returns the endpoints at t=0 and t=1', () => {
    expect(mix('#112233', '#445566', 0)).toBe('#112233')
    expect(mix('#112233', '#445566', 1)).toBe('#445566')
  })
})

describe('withAlpha', () => {
  it('produces an rgba string at the requested alpha', () => {
    expect(withAlpha('#c2703d', 0.2)).toBe('rgba(194, 112, 61, 0.2)')
  })

  it('drops alpha to hex when fully opaque', () => {
    expect(withAlpha('#c2703d', 1)).toBe('#c2703d')
  })
})

describe('opacity split round-trip', () => {
  it('extracts hex + opacity from an rgba string', () => {
    const { hex, opacity } = toHexWithOpacity('rgba(231, 228, 223, 0.14)')
    expect(hex).toBe('#e7e4df')
    expect(opacity).toBeCloseTo(0.14, 2)
  })

  it('recombines hex + opacity back to the same rgba', () => {
    expect(fromHexWithOpacity('#e7e4df', 0.14)).toBe('rgba(231, 228, 223, 0.14)')
  })
})
