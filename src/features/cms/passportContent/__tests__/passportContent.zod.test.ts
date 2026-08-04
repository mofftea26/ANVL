import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PASSPORT_PRODUCT_CONTENT,
  parsePassportContent,
  passportProductContentSchema,
  type PassportProductContent,
} from '@/features/cms/passportContent/passportContent.zod'

/**
 * A blob with EVERY field populated with a distinguishable value.
 *
 * Typed as `PassportProductContent` on purpose: `deepMergeDefaults` is the real
 * schema — hand-written, and it silently drops anything it does not name — so
 * the guard against that is a literal the compiler forces you to extend. Add a
 * key to the Zod schema and this stops compiling until it is populated here;
 * populate it and the round-trip below proves the merge kept it.
 */
const FULLY_POPULATED: PassportProductContent = {
  identity: { tagline: 'Forged under pressure', authenticityNote: 'One owner, forever.' },
  piece: { heroRender: 'media-hero', gallery: ['media-g1', 'media-g2'] },
  material: {
    title: 'Seamless knit',
    note: '260 GSM',
    macroAsset: 'media-macro',
    materials: [
      { id: 'm1', name: 'Combed cotton', percentage: 80, gsm: 260, image: 'media-mat-1' },
    ],
  },
  specs: {
    construction: 'Flatlock',
    fitType: 'Athletic',
    compression: 'Medium',
    stretch: '4-way',
    breathability: 'High',
    intendedUse: 'Heavy lifting',
    points: [{ x: 31.5, y: 18.25, label: 'Weight', value: '260 GSM' }],
  },
  fit: {
    intendedFit: 'True to size',
    measurements: ['Chest|52 cm'],
    stretchRange: '+6 cm',
    modelHeight: '186 cm',
    modelSize: 'L',
    sizeAdvice: 'Size down for a compressive fit.',
    points: [{ x: 50, y: 24, label: 'Chest', value: '52 cm' }],
    sizeEquivalence: { M: 'S' },
  },
  forgeNotes: [{ title: 'Eleven revisions', body: 'The collar alone took four.' }],
  hotspots: [{ x: 12.5, y: 88.75, title: 'Hem label', body: 'Woven, not printed.' }],
  blueprint: {
    heading: 'Blueprint',
    intro: 'Every seam, marked where it lands.',
    features: [{ code: 'a', title: 'High neck', body: 'Holds its shape.' }],
    points: [{ x: 66, y: 42, label: 'Flatlock', value: '6-thread' }],
  },
  care: {
    intro: 'Treat it well.',
    steps: ['Cold wash'],
    asset: 'media-care',
    symbols: ['no-bleach'],
    notes: ['Bleach eats elastane.'],
    careItems: [{ id: 'c1', icon: 'wash-30', name: 'Machine wash 30°C', value: '', note: '' }],
  },
  details: {
    heading: 'Forged details',
    story: 'Eighteen months.',
    facts: ['Bonded seams'],
    funFact: 'The first sample weighed twice this.',
    asset: 'media-detail',
  },
  origin: {
    label: 'Forged in Lebanon',
    place: 'Beirut',
    story: 'A single atelier.',
    asset: 'media-origin',
    madeIn: 'lb',
    designedIn: 'lb',
  },
}

/**
 * The save path is `writePassportContentToStorage` → `parsePassportContent` →
 * `deepMergeDefaults`. Anything that literal forgets is deleted on every save,
 * with no error and no type failure (it returns through an `as` cast). These
 * are the regression tests standing between the passport and silent data loss.
 */
describe('passportContent schema — full round-trip (deepMergeDefaults guard)', () => {
  it('loses nothing when a fully-populated blob is saved', () => {
    const saved = parsePassportContent({ tee: FULLY_POPULATED })
    expect(saved.tee).toEqual(FULLY_POPULATED)
  })

  it('is stable across repeated saves (no drift on the second edit)', () => {
    const once = parsePassportContent({ tee: FULLY_POPULATED })
    expect(parsePassportContent(once)).toEqual(once)
  })

  it('keeps the placed markers of all three sections verbatim', () => {
    // The coordinates ARE the data here — a marker whose x/y were rounded,
    // reset to the 50/50 catch default, or dropped is a marker in the wrong
    // place on the storefront, which is worse than no marker at all.
    const entry = parsePassportContent({ tee: FULLY_POPULATED }).tee!
    expect(entry.blueprint.points).toEqual([
      { x: 66, y: 42, label: 'Flatlock', value: '6-thread' },
    ])
    expect(entry.specs.points).toEqual([
      { x: 31.5, y: 18.25, label: 'Weight', value: '260 GSM' },
    ])
    expect(entry.fit.points).toEqual([{ x: 50, y: 24, label: 'Chest', value: '52 cm' }])
  })

  it('back-compat: a blob authored before markers existed gains empty lists', () => {
    // Every passport already in `passport_content` looks like this. It must
    // keep parsing, and must render exactly as before until someone places a
    // marker — the whole feature is additive or it is a migration.
    const legacy = {
      tee: {
        specs: { construction: 'Flatlock', fitType: '', compression: '' },
        fit: { intendedFit: 'True to size', measurements: ['Chest|52 cm'] },
        blueprint: { heading: 'Blueprint', features: [{ code: 'a', title: 'Neck', body: '' }] },
      },
    }
    const entry = parsePassportContent(legacy).tee!
    expect(entry.specs.points).toEqual([])
    expect(entry.fit.points).toEqual([])
    expect(entry.blueprint.points).toEqual([])
    // …and the copy that WAS authored is untouched.
    expect(entry.specs.construction).toBe('Flatlock')
    expect(entry.fit.measurements).toEqual(['Chest|52 cm'])
    expect(entry.blueprint.features).toEqual([{ code: 'a', title: 'Neck', body: '' }])
  })

  it('clamps an out-of-range coordinate instead of dropping the marker', () => {
    const entry = parsePassportContent({
      tee: {
        specs: {
          ...DEFAULT_PASSPORT_PRODUCT_CONTENT.specs,
          points: [{ x: 420, y: -7, label: 'Weight', value: '260 GSM' }],
        },
      },
    }).tee!
    // `.catch(50)` on a failed min/max is the schema's contract: the fact
    // survives, its position falls back to centre rather than throwing away a
    // readout the editor wrote.
    expect(entry.specs.points).toEqual([{ x: 50, y: 50, label: 'Weight', value: '260 GSM' }])
  })

  it('degrades a malformed marker list to empty without taking the section with it', () => {
    const entry = parsePassportContent({
      tee: { blueprint: { heading: 'Blueprint', points: 'nope' } },
    }).tee!
    expect(entry.blueprint.points).toEqual([])
    expect(entry.blueprint.heading).toBe('Blueprint')
  })
})

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
 * Blueprint — the techpack flat + its multi-position construction callouts.
 * Every save runs the blob back through `parsePassportContent`
 * (`writePassportContentToStorage`), and that path merges through the
 * hand-written `deepMergeDefaults` literal — a section present in the schema
 * but missing there typechecks and then drops on save, with no error. These
 * guard that round-trip.
 */
describe('passportContent schema — blueprint', () => {
  const authored = {
    heading: 'Blueprint',
    intro: 'Every seam, marked where it lands.',
    features: [
      { code: 'a', title: 'High neck front neckline style', body: '' },
      {
        code: 'j',
        title: 'Hem wrapped jacquard damask weave brand label',
        body: 'Woven, not printed.',
      },
    ],
  }

  it('survives a save round-trip with every callout intact', () => {
    const saved = parsePassportContent({
      'seamless-tee': { ...DEFAULT_PASSPORT_PRODUCT_CONTENT, blueprint: authored },
    })
    const entry = saved['seamless-tee']!
    expect(entry.blueprint.intro).toBe('Every seam, marked where it lands.')
    expect(entry.blueprint.features).toEqual(authored.features)

    // Save → reload → save again is stable (no slow drift on repeat edits).
    expect(parsePassportContent(saved)).toEqual(saved)
  })

  it('drops a legacy flat asset and marker positions on the way through', () => {
    // Packs authored before the pivot carry both. They must not survive the
    // parse: the storefront has no drawing to place them on any more, and a
    // stale media id would keep an asset "in use" in the media library.
    const saved = parsePassportContent({
      tee: {
        blueprint: {
          ...authored,
          flatAsset: 'asset-flat',
          features: [{ code: 'a', title: 'Bartack', body: '', positions: [{ x: 48, y: 6 }] }],
        },
      },
    })
    expect(saved.tee!.blueprint).toEqual({
      heading: 'Blueprint',
      intro: 'Every seam, marked where it lands.',
      features: [{ code: 'a', title: 'Bartack', body: '' }],
      // The effect markers are a separate, hand-placed list — a pack authored
      // before they existed simply carries none.
      points: [],
    })
  })

  it('defaults blueprint for a blob authored before the section existed', () => {
    const parsed = parsePassportContent({ tee: { identity: { tagline: 'Old blob' } } })
    expect(parsed.tee!.blueprint).toEqual({ heading: '', intro: '', features: [], points: [] })
  })

  it('degrades a malformed callout list to empty instead of throwing', () => {
    // Same tolerance contract as `hotspots`/`forgeNotes`: the list catches as a
    // whole, so the rest of the section (and every other section) still lands.
    const parsed = parsePassportContent({
      tee: { blueprint: { ...authored, features: 'nope' } },
    })
    expect(parsed.tee!.blueprint.features).toEqual([])
    expect(parsed.tee!.blueprint.intro).toBe('Every seam, marked where it lands.')
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
