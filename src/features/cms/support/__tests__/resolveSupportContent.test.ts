import { describe, expect, it } from 'vitest'

import { SUPPORT_CONTENT_DEFAULTS } from '@/features/cms/support/supportContent.defaults'
import { parseSupportContent } from '@/features/cms/support/supportContent.zod'
import {
  resolveCareItems,
  resolveCareLegend,
  resolveMeasurePoints,
  resolveSizeTable,
  resolveSupportContent,
} from '@/features/cms/support/resolveSupportContent'

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
      items: [],
    })
    expect(resolved.sizeGuide.perProduct.stringer.rows[0].values).toEqual(['96'])
  })
})

describe('resolveCareItems', () => {
  it('maps legacy lines to generic items when no structured items exist', () => {
    const items = resolveCareItems({
      note: '',
      lines: ['Wash cold', '  ', 'Hang dry'],
      items: [],
    })
    expect(items).toEqual([
      { id: 'care-line-0', icon: 'generic', name: 'Wash cold', value: '', note: '' },
      { id: 'care-line-1', icon: 'generic', name: 'Hang dry', value: '', note: '' },
    ])
  })

  it('prefers structured items over legacy lines without mutating the entry', () => {
    const entry = {
      note: '',
      lines: ['legacy line'],
      items: [
        { id: 'i1', icon: 'washing-machine' as const, name: 'Machine wash', value: '30', note: 'inside out' },
        { id: '', icon: 'generic' as const, name: '  ', value: '', note: '' },
      ],
    }
    const items = resolveCareItems(entry)
    expect(items).toEqual([
      { id: 'i1', icon: 'washing-machine', name: 'Machine wash', value: '30', note: 'inside out' },
    ])
    // Stored data untouched.
    expect(entry.lines).toEqual(['legacy line'])
    expect(entry.items).toHaveLength(2)
  })
})

describe('resolveSizeTable', () => {
  const legacyRows = [{ id: 'r', size: 'M', values: ['96'] }]

  it('returns null when nothing is authored', () => {
    expect(resolveSizeTable({ note: '', columns: [], rows: [] })).toBeNull()
  })

  it('falls back to the legacy shape when the structured table is empty', () => {
    const resolved = resolveSizeTable({
      note: '',
      columns: ['Chest'],
      rows: legacyRows,
      table: { rows: [{ key: 'chest', values: ['', '', '', '', '', ''] }], halfMeasurement: true },
    })
    expect(resolved).toEqual({ kind: 'legacy', columns: ['Chest'], rows: legacyRows })
  })

  it('prefers the structured table when any cell is filled', () => {
    const resolved = resolveSizeTable({
      note: '',
      columns: ['Chest'],
      rows: legacyRows,
      table: {
        rows: [
          { key: 'chest', values: ['44', '46', '48', '50', '', ''] },
          { key: 'cuff', values: ['', '', '', '', '', ''] },
        ],
        halfMeasurement: false,
      },
    })
    expect(resolved?.kind).toBe('structured')
    if (resolved?.kind === 'structured') {
      // Empty structured rows are dropped from the render shape.
      expect(resolved.rows).toHaveLength(1)
      expect(resolved.rows[0].key).toBe('chest')
      expect(resolved.sizes).toEqual(['XS', 'S', 'M', 'L', 'XL', 'XXL'])
      expect(resolved.halfMeasurement).toBe(false)
    }
  })
})

describe('resolveMeasurePoints', () => {
  it('renders the full designed points for a garment type from an empty blob', () => {
    const resolved = resolveMeasurePoints(config(), 'joggers')
    const defaultJoggers = SUPPORT_CONTENT_DEFAULTS.sizeGuide.measure.garmentTypes.find(
      (g) => g.key === 'joggers',
    )!
    expect(resolved.garmentTypeKey).toBe('joggers')
    expect(resolved.garmentTypeLabel).toBe(defaultJoggers.label)
    expect(resolved.points).toEqual(defaultJoggers.points)
    expect(resolved.heading).toBe(SUPPORT_CONTENT_DEFAULTS.sizeGuide.measure.heading)
  })

  it('falls back to tee for an unknown or blank garment type key', () => {
    const defaultTee = SUPPORT_CONTENT_DEFAULTS.sizeGuide.measure.garmentTypes.find(
      (g) => g.key === 'tee',
    )!
    const resolved = resolveMeasurePoints(config(), 'not-a-real-garment')
    expect(resolved.garmentTypeKey).toBe('tee')
    expect(resolved.points).toEqual(defaultTee.points)
    expect(resolveMeasurePoints(config(), '').garmentTypeKey).toBe('tee')
  })

  it('merges a CMS point override per field, blank fields falling back to the default', () => {
    const resolved = resolveMeasurePoints(
      config({
        sizeGuide: {
          measure: {
            garmentTypes: [
              {
                key: 'tee',
                label: '',
                points: [{ key: 'chest', letter: '', label: 'Bust', description: '' }],
              },
            ],
          },
        },
      }),
      'tee',
    )
    const defaultTee = SUPPORT_CONTENT_DEFAULTS.sizeGuide.measure.garmentTypes.find(
      (g) => g.key === 'tee',
    )!
    const defaultChestPoint = defaultTee.points.find((p) => p.key === 'chest')!
    const resolvedChest = resolved.points.find((p) => p.key === 'chest')!
    // Overridden field wins...
    expect(resolvedChest.label).toBe('Bust')
    // ...blank fields fall back to the code default per field, not wholesale.
    expect(resolvedChest.letter).toBe(defaultChestPoint.letter)
    expect(resolvedChest.description).toBe(defaultChestPoint.description)
    // Point geometry (the full set of keys) is unchanged by a partial override.
    expect(resolved.points.map((p) => p.key)).toEqual(defaultTee.points.map((p) => p.key))
  })
})

describe('resolveCareLegend', () => {
  it('renders the full designed 26-entry legend from an empty blob', () => {
    const resolved = resolveCareLegend(config())
    expect(resolved.heading).toBe(SUPPORT_CONTENT_DEFAULTS.careGuide.legend.heading)
    expect(Object.keys(resolved.entries)).toHaveLength(26)
    expect(resolved.entries.wash).toEqual(SUPPORT_CONTENT_DEFAULTS.careGuide.legend.entries.wash)
  })

  it('merges a partial entries override per key and per field', () => {
    const resolved = resolveCareLegend(
      config({
        careGuide: {
          legend: {
            entries: {
              wash: { label: 'Wash it', meaning: '' },
              'do-not-bleach': { label: '', meaning: '' },
            },
          },
        },
      }),
    )
    const defaults = SUPPORT_CONTENT_DEFAULTS.careGuide.legend.entries
    // Overridden label wins; blank meaning falls back to the default.
    expect(resolved.entries.wash).toEqual({ label: 'Wash it', meaning: defaults.wash.meaning })
    // A present-but-fully-blank override entry is a no-op — default stands.
    expect(resolved.entries['do-not-bleach']).toEqual(defaults['do-not-bleach'])
    // Every other key is untouched, still exactly the default.
    expect(resolved.entries['do-not-iron']).toEqual(defaults['do-not-iron'])
  })
})
