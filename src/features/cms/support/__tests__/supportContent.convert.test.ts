import { describe, expect, it } from 'vitest'

import {
  convertLegacyCareLines,
  convertLegacySizeEntry,
  matchMeasurementRow,
  matchSizeColumn,
} from '@/features/cms/support/supportContent.convert'

describe('convertLegacyCareLines', () => {
  it('maps trimmed non-empty lines to generic items', () => {
    const items = convertLegacyCareLines({
      note: 'n',
      lines: [' Wash cold ', '', 'Hang dry'],
      items: [],
    })
    expect(items).toEqual([
      { id: 'care-converted-0', icon: 'generic', name: 'Wash cold', value: '', note: '' },
      { id: 'care-converted-1', icon: 'generic', name: 'Hang dry', value: '', note: '' },
    ])
  })
})

describe('matchSizeColumn', () => {
  it('normalizes common size labels', () => {
    expect(matchSizeColumn(' m ')).toBe('M')
    expect(matchSizeColumn('xxl')).toBe('XXL')
    expect(matchSizeColumn('2XL')).toBe('XXL')
    expect(matchSizeColumn('Medium')).toBe('M')
    expect(matchSizeColumn('EU 48')).toBeNull()
  })
})

describe('matchMeasurementRow', () => {
  it('maps measurement headings by name heuristics', () => {
    expect(matchMeasurementRow('Body chest (cm)')).toBe('chest')
    expect(matchMeasurementRow('Back length')).toBe('length')
    expect(matchMeasurementRow('Sleeve')).toBe('sleeve')
    expect(matchMeasurementRow('Hem width')).toBe('bottom')
    expect(matchMeasurementRow('Neck opening')).toBe('collar')
    expect(matchMeasurementRow('Mystery')).toBeNull()
  })
})

describe('convertLegacySizeEntry', () => {
  it('maps legacy size rows and measurement columns onto the fixed grid', () => {
    const table = convertLegacySizeEntry({
      note: '',
      columns: ['Body chest (cm)', 'Back length (cm)'],
      rows: [
        { id: 'r1', size: 'S', values: ['96', '68'] },
        { id: 'r2', size: 'M', values: ['100', '70'] },
        { id: 'r3', size: 'EU 52', values: ['110', '74'] }, // unmappable size → skipped
      ],
    })
    const chest = table.rows.find((r) => r.key === 'chest')
    const length = table.rows.find((r) => r.key === 'length')
    // Columns: [XS, S, M, L, XL, XXL]
    expect(chest?.values).toEqual(['', '96', '100', '', '', ''])
    expect(length?.values).toEqual(['', '68', '70', '', '', ''])
    expect(table.halfMeasurement).toBe(true)
    // Every fixed row exists even when empty.
    expect(table.rows).toHaveLength(7)
  })

  it('routes the first unmappable column into the empty length row only', () => {
    const table = convertLegacySizeEntry({
      note: '',
      columns: ['Mystery A', 'Mystery B'],
      rows: [{ id: 'r1', size: 'L', values: ['12', '34'] }],
    })
    const length = table.rows.find((r) => r.key === 'length')
    expect(length?.values).toEqual(['', '', '', '12', '', ''])
    // Second unmappable column is conservatively dropped.
    for (const row of table.rows) {
      expect(row.values).not.toContain('34')
    }
  })
})
