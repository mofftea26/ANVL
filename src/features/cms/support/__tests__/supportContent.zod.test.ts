import { describe, expect, it } from 'vitest'

import {
  DEFAULT_SUPPORT_CONTENT,
  parseSupportContent,
  supportContentSchema,
} from '@/features/cms/support/supportContent.zod'

describe('parseSupportContent', () => {
  it('returns blank defaults for non-object input', () => {
    for (const raw of [undefined, null, 'junk', 42, ['x']]) {
      expect(parseSupportContent(raw)).toEqual(DEFAULT_SUPPORT_CONTENT)
    }
  })

  it('round-trips a complete config unchanged', () => {
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
        perProduct: { 'oversized-tee': { note: 'n', lines: ['wash cold'] } },
      },
      sizeGuide: {
        intro: 'Size',
        note: 'Measure',
        perProduct: {
          stringer: {
            note: 'fit',
            columns: ['Chest'],
            rows: [{ id: 'row1', size: 'M', values: ['96'] }],
          },
        },
      },
    }
    const parsed = parseSupportContent(full)
    expect(parsed).toEqual(full)
    expect(supportContentSchema.parse(parsed)).toEqual(full)
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
    expect(parsed.careGuide.perProduct.tee).toEqual({ note: 'n', lines: ['l'] })
  })

  it('skips blank per-product slugs and coerces bad value types', () => {
    const parsed = parseSupportContent({
      careGuide: { perProduct: { '': { note: 'x' }, tee: { note: 'ok', lines: 'nope' } } },
      sizeGuide: { perProduct: { hat: { columns: 'bad', rows: 'bad' } } },
    })
    expect(Object.keys(parsed.careGuide.perProduct)).not.toContain('')
    expect(parsed.careGuide.perProduct.tee).toEqual({ note: 'ok', lines: [] })
    expect(parsed.sizeGuide.perProduct.hat).toEqual({ note: '', columns: [], rows: [] })
  })

  it('rejects prototype-pollution style keys', () => {
    const parsed = parseSupportContent(
      JSON.parse('{"__proto__": {"polluted": true}, "faq": {"intro": "ok"}}'),
    )
    expect(parsed.faq.intro).toBe('ok')
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})
