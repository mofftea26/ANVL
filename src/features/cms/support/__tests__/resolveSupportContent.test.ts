import { describe, expect, it } from 'vitest'

import { SUPPORT_CONTENT_DEFAULTS } from '@/features/cms/support/supportContent.defaults'
import { parseSupportContent } from '@/features/cms/support/supportContent.zod'
import { resolveSupportContent } from '@/features/cms/support/resolveSupportContent'

function config(overrides: Record<string, unknown> = {}) {
  return parseSupportContent(overrides)
}

describe('resolveSupportContent', () => {
  it('renders the full designed pages from an empty blob', () => {
    const resolved = resolveSupportContent(config())
    expect(resolved.faq.intro).toBe(SUPPORT_CONTENT_DEFAULTS.faq.intro)
    expect(resolved.faq.items).toEqual(SUPPORT_CONTENT_DEFAULTS.faq.items)
    expect(resolved.contact.email).toBe('support@anvlathletics.com')
    expect(resolved.contact.instagram).toBe('@anvlathletics')
    // Shipping is net-new — it must have real default sections.
    expect(resolved.shipping.sections.length).toBeGreaterThan(0)
    expect(resolved.returns.sections).toEqual(SUPPORT_CONTENT_DEFAULTS.returns.sections)
  })

  it('treats blank strings as "use the default" per field', () => {
    const resolved = resolveSupportContent(
      config({ contact: { email: '   ', phone: '+961 1 234 567' } }),
    )
    expect(resolved.contact.email).toBe('support@anvlathletics.com')
    expect(resolved.contact.phone).toBe('+961 1 234 567')
  })

  it('replaces default FAQ items when the CMS supplies any', () => {
    const resolved = resolveSupportContent(
      config({ faq: { items: [{ id: 'x', question: 'Q?', answer: 'A.' }] } }),
    )
    expect(resolved.faq.items).toEqual([{ id: 'x', question: 'Q?', answer: 'A.' }])
  })

  it('falls back to default sections when all authored rows are empty', () => {
    const resolved = resolveSupportContent(
      config({ shipping: { sections: [{ id: 'x', heading: '', body: '' }] } }),
    )
    expect(resolved.shipping.sections).toEqual(SUPPORT_CONTENT_DEFAULTS.shipping.sections)
  })

  it('passes authored per-product care/size entries through unchanged', () => {
    const resolved = resolveSupportContent(
      config({
        careGuide: { perProduct: { 'oversized-tee': { note: 'n', lines: ['wash cold'] } } },
        sizeGuide: {
          perProduct: {
            stringer: { note: '', columns: ['Chest'], rows: [{ id: 'r', size: 'M', values: ['96'] }] },
          },
        },
      }),
    )
    expect(resolved.careGuide.perProduct['oversized-tee']).toEqual({
      note: 'n',
      lines: ['wash cold'],
    })
    expect(resolved.sizeGuide.perProduct.stringer.rows[0].values).toEqual(['96'])
  })
})
