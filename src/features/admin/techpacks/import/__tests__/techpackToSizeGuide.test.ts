import { describe, expect, it } from 'vitest'

import { SIZE_TABLE_SIZES } from '@/features/cms/support/supportContent.zod'
import type { TechpackHeader, TechpackSizing } from '@/features/techpacks/schema/techpack.zod'

import {
  resolveGarmentType,
  techpackToFitMeasurements,
  techpackToSizeEquivalence,
  techpackToSizeTable,
} from '../techpackToSizeGuide'

/** The real oversized-tee sizing page, in inches exactly as printed. */
const OVERSIZED_TEE_SIZING: TechpackSizing = {
  unit: 'in',
  sizes: ['SMALL', 'MEDIUM', 'LARGE', 'X-LARGE'],
  rows: [
    { letter: 'A', label: 'CB LENGTH', rowKey: 'length', isHalf: false, values: [26, 27, 28, 29] },
    {
      letter: 'B',
      label: 'CHEST 1/2 WIDTH',
      rowKey: 'chest',
      isHalf: true,
      values: [22.75, 24, 25.25, 26.5],
    },
    {
      letter: 'C',
      label: 'WAIST 1/2 WIDTH',
      rowKey: 'waist',
      isHalf: true,
      values: [22, 23.25, 24.5, 25.75],
    },
    {
      letter: 'D',
      label: 'BOTTOM 1/2 WIDTH',
      rowKey: 'bottom',
      isHalf: true,
      values: [21.25, 22.5, 23.75, 25],
    },
    {
      letter: 'E',
      label: 'COLLAR 1/2 WIDTH',
      rowKey: 'collar',
      isHalf: true,
      values: [8.25, 8.5, 8.75, 9],
    },
    {
      letter: 'F',
      label: 'SLEEVE LENGTH',
      rowKey: 'sleeve',
      isHalf: false,
      values: [14.5, 15.25, 16, 16.75],
    },
    {
      letter: 'G',
      label: 'CUFF 1/2 WIDTH',
      rowKey: 'cuff',
      isHalf: true,
      values: [7, 7.25, 7.5, 7.75],
    },
  ],
  diagramImageId: 'p4-i0',
  markers: [],
}

const header = (product: string): TechpackHeader => ({
  product,
  contrast: '',
  style: '',
  colorwayCount: 1,
  fabric: { raw: '', composition: [], gsm: null, construction: '' },
  client: 'ANVL ATHLETICS',
})

const rowValues = (table: ReturnType<typeof techpackToSizeTable>['table'], key: string) =>
  table.rows.find((r) => r.key === key)?.values ?? []

describe('techpackToSizeTable — the inches to centimetres conversion', () => {
  const { table, warnings, unmapped } = techpackToSizeTable(OVERSIZED_TEE_SIZING)

  it('converts every value, because the site renders centimetres', () => {
    // The single highest-risk fact in the feature: packs print inches, the
    // storefront header literally says "Measurement (cm)". Importing 24 as 24
    // would size every customer wrong with nothing appearing broken.
    expect(rowValues(table, 'chest')).toEqual(['', '57.8', '61', '64.1', '67.3', ''])
    expect(rowValues(table, 'length')).toEqual(['', '66', '68.6', '71.1', '73.7', ''])
    expect(rowValues(table, 'cuff')).toEqual(['', '17.8', '18.4', '19.1', '19.7', ''])
  })

  it('never leaves a raw inch value in the table', () => {
    for (const row of table.rows) {
      for (const value of row.values) {
        if (!value) continue
        // Every real garment measurement in cm clears 15; every inch figure on
        // this pack is below it. A survivor here means a missed conversion.
        expect(Number(value)).toBeGreaterThan(15)
      }
    }
  })

  it('fills exactly one slot per site size, leaving unoffered sizes blank', () => {
    // The pack grades S-XL; the site grid is XS-XXL, so the ends stay empty.
    for (const row of table.rows) {
      expect(row.values).toHaveLength(SIZE_TABLE_SIZES.length)
      expect(row.values[0]).toBe('')
      expect(row.values[5]).toBe('')
    }
  })

  it('maps all seven printed rows onto site rows', () => {
    expect(table.rows.map((r) => r.key)).toEqual([
      'length',
      'chest',
      'waist',
      'bottom',
      'collar',
      'sleeve',
      'cuff',
    ])
    expect(unmapped).toEqual([])
    expect(warnings).toEqual([])
  })

  it('flags the half-measurement convention the packs use', () => {
    expect(table.halfMeasurement).toBe(true)
  })

  it('passes centimetre sources through untouched', () => {
    const metric = techpackToSizeTable({
      ...OVERSIZED_TEE_SIZING,
      unit: 'cm',
      rows: [
        { letter: 'B', label: 'CHEST', rowKey: 'chest', isHalf: true, values: [58, 61, 64, 67] },
      ],
    })
    expect(rowValues(metric.table, 'chest')).toEqual(['', '58', '61', '64', '67', ''])
  })
})

describe('techpackToSizeTable — guarding against a missed conversion', () => {
  it('refuses an implausible value rather than publishing it', () => {
    const broken = techpackToSizeTable({
      ...OVERSIZED_TEE_SIZING,
      rows: [
        { letter: 'B', label: 'CHEST', rowKey: 'chest', isHalf: true, values: [1, 24, 25, 26] },
      ],
    })
    expect(broken.warnings.some((w) => w.includes('outside the plausible range'))).toBe(true)
    expect(rowValues(broken.table, 'chest')[1]).toBe('')
  })

  it('reports an unmapped row instead of guessing a site row', () => {
    const extra = techpackToSizeTable({
      ...OVERSIZED_TEE_SIZING,
      rows: [
        ...OVERSIZED_TEE_SIZING.rows,
        { letter: 'H', label: 'POCKET DEPTH', rowKey: null, isHalf: false, values: [5, 5, 5, 5] },
      ],
    })
    expect(extra.unmapped).toEqual(['POCKET DEPTH'])
    expect(extra.table.rows).toHaveLength(7)
  })

  it('warns about a size column it does not recognise', () => {
    const odd = techpackToSizeTable({ ...OVERSIZED_TEE_SIZING, sizes: ['SMALL', 'HUGE'] })
    expect(odd.warnings.some((w) => w.includes('HUGE'))).toBe(true)
  })

  it('accepts the abbreviated headings some packs print', () => {
    const abbreviated = techpackToSizeTable({
      ...OVERSIZED_TEE_SIZING,
      sizes: ['S', 'M', 'L', 'XL'],
    })
    expect(abbreviated.warnings).toEqual([])
    expect(rowValues(abbreviated.table, 'chest')[1]).toBe('57.8')
  })
})

describe('techpackToFitMeasurements', () => {
  it('emits passport measurement lines from the middle size', () => {
    const { lines, referenceSize } = techpackToFitMeasurements(OVERSIZED_TEE_SIZING)
    expect(referenceSize).toBe('MEDIUM')
    expect(lines).toContain('Chest|61 cm')
    expect(lines).toContain('Cb Length|68.6 cm')
    expect(lines.every((line) => line.includes('cm'))).toBe(true)
  })
})

describe('techpackToSizeEquivalence', () => {
  it('maps printed headings to site size keys', () => {
    expect(techpackToSizeEquivalence(OVERSIZED_TEE_SIZING)).toEqual({
      SMALL: 'S',
      MEDIUM: 'M',
      LARGE: 'L',
      'X-LARGE': 'XL',
    })
  })
})

describe('resolveGarmentType', () => {
  it('reads the cut from the product name', () => {
    expect(resolveGarmentType(header('MENS OVERSIZED TEE'))).toBe('tee')
    expect(resolveGarmentType(header('MENS SEAMLESS COMPRESSION TEE'))).toBe('tee')
    expect(resolveGarmentType(header('OLD-SCHOOL CUT STRINGER'))).toBe('stringer')
    expect(resolveGarmentType(header('MENS JOGGERS'))).toBe('joggers')
    expect(resolveGarmentType(header('MENS TRAINING SHORTS'))).toBe('shorts')
    expect(resolveGarmentType(header('HEAVYWEIGHT HOODIE'))).toBe('hoodie')
  })

  it('defaults rather than failing on an unfamiliar product', () => {
    expect(resolveGarmentType(header('SOMETHING NEW'))).toBe('tee')
  })
})
