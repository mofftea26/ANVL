import { describe, expect, it } from 'vitest'

import {
  DEFAULT_SUPPORT_CONTENT,
  SIZE_TABLE_SIZES,
  parseSupportContent,
  supportContentSchema,
} from '@/features/cms/support/supportContent.zod'

describe('parseSupportContent', () => {
  it('returns blank defaults for non-object input', () => {
    for (const raw of [undefined, null, 'junk', 42, ['x']]) {
      expect(parseSupportContent(raw)).toEqual(DEFAULT_SUPPORT_CONTENT)
    }
  })

  it('round-trips a complete config unchanged (structured care + size table)', () => {
    const full = {
      faq: { intro: 'FAQ', items: [{ id: 'q1', question: 'Q', answer: 'A' }] },
      contact: {
        intro: 'Reach us',
        email: 'a@b.com',
        phone: '+961',
        instagram: '@x',
        address: 'Beirut',
        hours: '9-5',
      },
      shipping: { intro: 'Ship', sections: [{ id: 's1', heading: 'H', body: 'B' }] },
      returns: { intro: 'Ret', sections: [{ id: 'r1', heading: 'H', body: 'B' }] },
      careGuide: {
        intro: 'Care',
        sections: [{ id: 'c1', heading: 'H', body: 'B' }],
        perProduct: {
          'oversized-tee': {
            note: 'n',
            lines: ['wash cold'],
            items: [
              { id: 'i1', icon: 'washing-machine', name: 'Machine wash', value: '30', note: '' },
            ],
          },
        },
      },
      sizeGuide: {
        intro: 'Size',
        note: 'Measure',
        perProduct: {
          stringer: {
            note: 'fit',
            columns: ['Chest'],
            rows: [{ id: 'row1', size: 'M', values: ['96'] }],
            table: {
              rows: [{ key: 'chest', values: ['44', '46', '48', '50', '52', '54'] }],
              halfMeasurement: true,
            },
          },
        },
      },
    }
    const parsed = parseSupportContent(full)
    expect(parsed).toEqual(full)
    expect(supportContentSchema.parse(parsed)).toEqual(full)
  })

  it('upgrades legacy-shape entries (no items / no table) without touching legacy data', () => {
    const parsed = parseSupportContent({
      careGuide: { perProduct: { tee: { note: 'n', lines: ['wash cold', 'hang dry'] } } },
      sizeGuide: {
        perProduct: {
          stringer: {
            note: '',
            columns: ['Chest'],
            rows: [{ id: 'r', size: 'M', values: ['96'] }],
          },
        },
      },
    })
    expect(parsed.careGuide.perProduct.tee).toEqual({
      note: 'n',
      lines: ['wash cold', 'hang dry'],
      items: [],
    })
    const stringer = parsed.sizeGuide.perProduct.stringer
    expect(stringer.columns).toEqual(['Chest'])
    expect(stringer.rows).toEqual([{ id: 'r', size: 'M', values: ['96'] }])
    expect(stringer.table).toBeUndefined()
  })

  it('fills missing sub-objects and fields with blank defaults', () => {
    const parsed = parseSupportContent({ faq: { intro: 'Just an intro' } })
    expect(parsed.faq.intro).toBe('Just an intro')
    expect(parsed.faq.items).toEqual([])
    expect(parsed.contact).toEqual(DEFAULT_SUPPORT_CONTENT.contact)
    expect(parsed.sizeGuide.perProduct).toEqual({})
  })

  it('drops unknown keys everywhere (strict never throws)', () => {
    const parsed = parseSupportContent({
      legacy: true,
      faq: { intro: 'x', ghost: 1, items: [{ id: 'q', question: 'Q', answer: 'A', extra: 9 }] },
      careGuide: {
        perProduct: { tee: { note: 'n', lines: ['l'], bogus: true } },
      },
    })
    expect(parsed).not.toHaveProperty('legacy')
    expect(parsed.faq.items[0]).toEqual({ id: 'q', question: 'Q', answer: 'A' })
    expect(parsed.careGuide.perProduct.tee).toEqual({ note: 'n', lines: ['l'], items: [] })
  })

  it('skips blank per-product slugs and coerces bad value types', () => {
    const parsed = parseSupportContent({
      careGuide: { perProduct: { '': { note: 'x' }, tee: { note: 'ok', lines: 'nope' } } },
      sizeGuide: { perProduct: { hat: { columns: 'bad', rows: 'bad' } } },
    })
    expect(Object.keys(parsed.careGuide.perProduct)).not.toContain('')
    expect(parsed.careGuide.perProduct.tee).toEqual({ note: 'ok', lines: [], items: [] })
    expect(parsed.sizeGuide.perProduct.hat).toEqual({ note: '', columns: [], rows: [] })
  })

  it('degrades bad care icons to generic and drops size-table rows with bad keys', () => {
    const parsed = parseSupportContent({
      careGuide: {
        perProduct: {
          tee: {
            note: '',
            lines: [],
            items: [{ id: 'i', icon: 'not-a-real-icon', name: 'Wash', value: '', note: '' }],
          },
        },
      },
      sizeGuide: {
        perProduct: {
          tee: {
            note: '',
            columns: [],
            rows: [],
            table: {
              rows: [
                { key: 'chest', values: ['44'] },
                { key: 'hips', values: ['99', '99', '99', '99', '99', '99'] },
              ],
              halfMeasurement: false,
            },
          },
        },
      },
    })
    expect(parsed.careGuide.perProduct.tee.items[0].icon).toBe('generic')
    const table = parsed.sizeGuide.perProduct.tee.table
    expect(table?.halfMeasurement).toBe(false)
    expect(table?.rows).toHaveLength(1)
    expect(table?.rows[0].key).toBe('chest')
    // Values are padded to one slot per fixed size column.
    expect(table?.rows[0].values).toHaveLength(SIZE_TABLE_SIZES.length)
    expect(table?.rows[0].values[0]).toBe('44')
  })

  it('rejects prototype-pollution style keys', () => {
    const parsed = parseSupportContent(
      JSON.parse('{"__proto__": {"polluted": true}, "faq": {"intro": "ok"}}'),
    )
    expect(parsed.faq.intro).toBe('ok')
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})
