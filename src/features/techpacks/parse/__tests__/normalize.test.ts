import { describe, expect, it } from 'vitest'

import {
  formatMeasurement,
  inchesToCm,
  parseComposition,
  parseGsm,
  parseNumber,
  parsePantoneCode,
  parseSpi,
  parseSrgbHex,
  parseStitchCode,
  slugifyRole,
  splitSupplierRef,
  titleCasePhrase,
} from '../normalize'

describe('parseNumber', () => {
  it('reads plain and inch-marked measurements', () => {
    expect(parseNumber('26.25')).toBe(26.25)
    expect(parseNumber('18.50"')).toBe(18.5)
    expect(parseNumber(' 7 ')).toBe(7)
    expect(parseNumber('.875')).toBe(0.875)
  })

  it('returns null rather than a guess', () => {
    expect(parseNumber('')).toBeNull()
    expect(parseNumber('N/A')).toBeNull()
    expect(parseNumber('27.25 28.25')).toBeNull()
    expect(parseNumber('1/2')).toBeNull()
    expect(parseNumber('MEDIUM')).toBeNull()
  })
})

describe('inchesToCm', () => {
  it('converts using real values from the supplied packs', () => {
    // Oversized tee, chest 1/2 width: S 22.75in, M 24.00in, L 25.25in, XL 26.50in
    expect(inchesToCm(22.75)).toBe(57.8)
    expect(inchesToCm(24)).toBe(61)
    expect(inchesToCm(25.25)).toBe(64.1)
    expect(inchesToCm(26.5)).toBe(67.3)
  })

  it('converts the compression tee body lengths', () => {
    expect(inchesToCm(26.25)).toBe(66.7)
    expect(inchesToCm(29.25)).toBe(74.3)
  })

  it('rounds to one decimal', () => {
    expect(inchesToCm(10.875)).toBe(27.6)
  })
})

describe('formatMeasurement', () => {
  it('never emits a trailing zero decimal', () => {
    expect(formatMeasurement(61)).toBe('61')
    expect(formatMeasurement(57.8)).toBe('57.8')
    expect(formatMeasurement(57.75)).toBe('57.8')
  })
})

describe('parseSrgbHex', () => {
  it('converts printed sRGB triplets', () => {
    expect(parseSrgbHex('sRGB (94/96/100)')).toBe('#5e6064')
    expect(parseSrgbHex('sRGB (232/228/218)')).toBe('#e8e4da')
    expect(parseSrgbHex('sRGB (48/46/44)')).toBe('#302e2c')
  })

  it('returns blank when the pack printed N/A', () => {
    expect(parseSrgbHex('sRGB (N/A)')).toBe('')
    expect(parseSrgbHex('')).toBe('')
  })

  it('rejects out-of-range channels', () => {
    expect(parseSrgbHex('sRGB (300/0/0)')).toBe('')
  })
})

describe('parsePantoneCode', () => {
  it('reads a TCX code', () => {
    expect(parsePantoneCode('18-0202 TCX')).toBe('18-0202 TCX')
    expect(parsePantoneCode('PANTONE COLOR CODE: 11-4801 TCX')).toBe('11-4801 TCX')
  })

  it('returns blank when unavailable', () => {
    expect(parsePantoneCode('TCX NOT AVAILABLE')).toBe('')
    expect(parsePantoneCode('PROCESS BLACK C')).toBe('')
  })
})

describe('parseComposition', () => {
  it('reads a single-fibre fabric line', () => {
    expect(parseComposition('FABRIC: 100% COTTON | 260 GSM | SINGLE JERSEY')).toEqual([
      { material: 'COTTON', percentage: 100 },
    ])
  })

  it('reads a multi-fibre fabric line', () => {
    expect(
      parseComposition('73% NYLON | 21% POLYESTER | 6% SPANDEX | 330 GSM | SINGLE JERSEY'),
    ).toEqual([
      { material: 'NYLON', percentage: 73 },
      { material: 'POLYESTER', percentage: 21 },
      { material: 'SPANDEX', percentage: 6 },
    ])
  })

  it('returns nothing when no percentages are present', () => {
    expect(parseComposition('SINGLE JERSEY WEFT KNIT TEXTILE CONSTRUCTION')).toEqual([])
  })
})

describe('parseGsm', () => {
  it('reads the fabric weight', () => {
    expect(parseGsm('100% COTTON | 260 GSM | SINGLE JERSEY')).toBe(260)
    expect(parseGsm('6% SPANDEX | 330 GSM | SINGLE')).toBe(330)
  })

  it('returns null when absent', () => {
    expect(parseGsm('100% COTTON')).toBeNull()
  })
})

describe('parseSpi / parseStitchCode', () => {
  const seam =
    'PLAIN SEAM W/ 15SPI S/N 301 LOCKSTITCH - 1/4" STITCH LINE OFFSET W/ 512 3 THREAD OVERLOCK INNER FINISH (SSa [1.01.01])'

  it('reads stitches per inch', () => {
    expect(parseSpi(seam)).toBe(15)
    expect(parseSpi('5 SPI 314 LOCKSTITCH BLINDSTITCH')).toBe(5)
    expect(parseSpi('no stitches here')).toBeNull()
  })

  it('reads the ISO seam class', () => {
    expect(parseStitchCode(seam)).toBe('SSa [1.01.01]')
    expect(parseStitchCode('(FSa [4.01.01])')).toBe('FSa [4.01.01]')
    expect(parseStitchCode('(LSr [2.06.02])')).toBe('LSr [2.06.02]')
    expect(parseStitchCode('no code')).toBe('')
  })
})

describe('slugifyRole', () => {
  it('slugifies the role vocabularies both packs use', () => {
    expect(slugifyRole('MAIN')).toBe('main')
    expect(slugifyRole('MAIN 1')).toBe('main-1')
    expect(slugifyRole('GRAPHIC PRINT')).toBe('graphic-print')
    expect(slugifyRole('TRIM BRANDING APPLICATION')).toBe('trim-branding-application')
  })
})

describe('titleCasePhrase', () => {
  it('title-cases prose', () => {
    expect(titleCasePhrase('HIGH NECK FRONT NECKLINE STYLE')).toBe(
      'High Neck Front Neckline Style',
    )
  })

  it('leaves codes and measurements alone', () => {
    // Lower-casing "301" or "15SPI" would be harmless; lower-casing them
    // inconsistently would not. Non-alphabetic tokens pass through untouched.
    expect(titleCasePhrase('15SPI 301 LOCKSTITCH')).toBe('15spi 301 Lockstitch')
    expect(titleCasePhrase('SINGLE JERSEY 260 GSM')).toBe('Single Jersey 260 Gsm')
  })
})

describe('splitSupplierRef', () => {
  it('splits a trailing cross-reference off a label', () => {
    expect(
      splitSupplierRef('HEM WRAPPED JACQUARD BRAND LABEL (SEE TRIM A)'),
    ).toEqual({
      text: 'HEM WRAPPED JACQUARD BRAND LABEL',
      supplierRef: 'SEE TRIM A',
    })
  })

  it('handles detail references', () => {
    expect(splitSupplierRef('PLAIN SEAM W/ OVERLOCK (SEE DETAIL K)')).toEqual({
      text: 'PLAIN SEAM W/ OVERLOCK',
      supplierRef: 'SEE DETAIL K',
    })
  })

  it('leaves a label without a reference untouched', () => {
    expect(splitSupplierRef('STRAIGHT BOTTOM HEMLINE')).toEqual({
      text: 'STRAIGHT BOTTOM HEMLINE',
      supplierRef: '',
    })
  })
})
