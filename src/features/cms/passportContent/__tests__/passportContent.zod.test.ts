import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PASSPORT_PRODUCT_CONTENT,
  parsePassportContent,
  passportProductContentSchema,
} from '@/features/cms/passportContent/passportContent.zod'

describe('passportContent schema — structured care/material migration', () => {
  it('parses a legacy blob (no careItems / materials) and defaults the new lists', () => {
    const legacy = {
      'seamless-tee': {
        material: { title: 'Seamless knit', note: '240 GSM', macroAsset: 'asset-1' },
        care: {
          intro: 'Treat it well.',
          steps: ['Cold wash'],
          asset: '',
          symbols: ['no-bleach'],
          notes: ['Bleach eats elastane.'],
        },
      },
    }
    const parsed = parsePassportContent(legacy)
    const entry = parsed['seamless-tee']!
    // Legacy fields preserved…
    expect(entry.material.title).toBe('Seamless knit')
    expect(entry.care.symbols).toEqual(['no-bleach'])
    expect(entry.care.steps).toEqual(['Cold wash'])
    // …new structured lists default to empty (never crash a legacy render).
    expect(entry.material.materials).toEqual([])
    expect(entry.care.careItems).toEqual([])
  })

  it('round-trips structured materials and care items', () => {
    const parsed = passportProductContentSchema.parse({
      ...DEFAULT_PASSPORT_PRODUCT_CONTENT,
      material: {
        title: '',
        note: '',
        macroAsset: '',
        materials: [{ id: 'm1', name: 'Combed cotton', percentage: 80, gsm: 240, image: '' }],
      },
      care: {
        intro: '',
        steps: [],
        asset: '',
        symbols: [],
        notes: [],
        careItems: [{ id: 'c1', icon: 'wash-30', name: 'Machine wash 30°C', value: '', note: '' }],
      },
    })
    expect(parsed.material.materials[0]?.name).toBe('Combed cotton')
    expect(parsed.material.materials[0]?.percentage).toBe(80)
    expect(parsed.care.careItems[0]?.icon).toBe('wash-30')
  })

  it('coerces a bad careItems value to an empty list via catch (never throws)', () => {
    const parsed = passportProductContentSchema.parse({
      ...DEFAULT_PASSPORT_PRODUCT_CONTENT,
      care: { ...DEFAULT_PASSPORT_PRODUCT_CONTENT.care, careItems: 'not-an-array' },
    })
    expect(parsed.care.careItems).toEqual([])
  })
})

/**
 * The care steps/notes, fit measurements + size map, forge notes, and design
 * facts moved from newline textareas to structured add/edit/delete list
 * editors. The STORED shape (arrays/records) is unchanged, so these guard that
 * stored blobs round-trip and malformed/pre-section blobs degrade to defaults.
 */
describe('passportContent schema — tolerant structured lists', () => {
  it('preserves list fields verbatim', () => {
    const parsed = parsePassportContent({
      tee: {
        care: { steps: ['Rinse', 'Air dry'], notes: ['Cold water', ''] },
        fit: { measurements: ['Chest|52 cm'], sizeEquivalence: { M: 'S' } },
        forgeNotes: [{ title: 'Eleven revisions', body: 'The collar took four.' }],
        details: { facts: ['Bonded seams', 'Laser-cut hem'] },
      },
    })
    const entry = parsed.tee!
    expect(entry.care.steps).toEqual(['Rinse', 'Air dry'])
    expect(entry.care.notes).toEqual(['Cold water', ''])
    expect(entry.fit.measurements).toEqual(['Chest|52 cm'])
    expect(entry.fit.sizeEquivalence).toEqual({ M: 'S' })
    expect(entry.forgeNotes).toEqual([{ title: 'Eleven revisions', body: 'The collar took four.' }])
    expect(entry.details.facts).toEqual(['Bonded seams', 'Laser-cut hem'])
  })

  it('degrades malformed list fields to defaults instead of throwing', () => {
    const parsed = parsePassportContent({
      tee: {
        care: { steps: 'not-an-array' },
        forgeNotes: 'nope',
        fit: { sizeEquivalence: 'bad', measurements: 42 },
        details: { facts: { 0: 'x' } },
      },
    })
    const entry = parsed.tee!
    expect(entry.care.steps).toEqual([])
    expect(entry.forgeNotes).toEqual([])
    expect(entry.fit.sizeEquivalence).toEqual({})
    expect(entry.fit.measurements).toEqual([])
    expect(entry.details.facts).toEqual([])
  })
})
