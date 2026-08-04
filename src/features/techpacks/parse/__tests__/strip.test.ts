import { describe, expect, it } from 'vitest'

import { isStrippedText, stripDeep, stripFilename, stripText } from '../strip'

/**
 * The supplier's name must not survive into stored content by ANY route.
 * These are the phrases that actually appear in the supplied packs.
 */
const REAL_DISCLAIMERS = [
  'DISCLAIMER: PLEASE SAMPLE THESE SIZES IN THEIR ENTIRETY TO DOUBLE CHECK FIT BEFORE PLACING A MASS ORDER',
  'FITTDESIGN IS NOT LIABLE FOR FLAWED SIZING',
  '(FITTDESIGN CANNOT NOT BE HELD LIABLE FOR ANY SIZING ISSUES)',
  'REFERENCE IMAGE',
  'DELETE',
  'ARTWORK BOUNDARY:',
]

describe('isStrippedText', () => {
  it('flags every disclaimer present in the supplied packs', () => {
    for (const phrase of REAL_DISCLAIMERS) {
      expect(isStrippedText(phrase), phrase).toBe(true)
    }
  })

  it('flags the supplier name however it is spaced', () => {
    expect(isStrippedText('FITTDESIGN')).toBe(true)
    expect(isStrippedText('FITT DESIGN')).toBe(true)
    // Techpack headings are letter-spaced, so the name can arrive glyph by glyph.
    expect(isStrippedText('F I T T D E S I G N')).toBe(true)
    expect(isStrippedText('fittdesign')).toBe(true)
  })

  it('leaves legitimate content alone', () => {
    expect(isStrippedText('PLAIN SEAM W/ 15SPI S/N 301 LOCKSTITCH')).toBe(false)
    expect(isStrippedText('100% COTTON')).toBe(false)
    expect(isStrippedText('HIGH NECK FRONT NECKLINE STYLE')).toBe(false)
    expect(isStrippedText('')).toBe(false)
  })
})

describe('stripText', () => {
  it('removes the offending phrase but keeps the rest of the line', () => {
    // The sizing page prints the measuring note directly above the liability
    // text — blanking the whole string would discard real content.
    const line =
      'NOTE: ALL MEASUREMENTS ARE MADE WITH THE GARMENT LAID FLAT. FITTDESIGN IS NOT LIABLE FOR FLAWED SIZING'
    const out = stripText(line)
    expect(out).toContain('ALL MEASUREMENTS ARE MADE WITH THE GARMENT LAID FLAT')
    expect(out.toLowerCase()).not.toContain('fittdesign')
    expect(out.toLowerCase()).not.toContain('not liable')
  })

  it('consumes to the sentence boundary, not just the matched words', () => {
    // Removing only the phrase leaves residue like "FOR FLAWED SIZING" —
    // meaningless, and still recognisably someone else's disclaimer.
    expect(stripText('FITTDESIGN IS NOT LIABLE FOR FLAWED SIZING')).toBe('')
    expect(stripText('A FITTDESIGN B')).toBe('A')
  })

  it('clears the punctuation a removal leaves behind', () => {
    expect(stripText('HEM (REFERENCE IMAGE)')).toBe('HEM')
    expect(stripText('(FITTDESIGN CANNOT NOT BE HELD LIABLE FOR ANY SIZING ISSUES)')).toBe('')
  })

  it('empties a string that was nothing but a disclaimer', () => {
    expect(stripText('DELETE')).toBe('')
    expect(stripText('REFERENCE IMAGE')).toBe('')
  })
})

describe('stripDeep', () => {
  it('reaches strings at any depth (gate 2)', () => {
    // Gate 1 works per text item; a phrase split across three runs matches
    // none of them individually and only becomes visible once joined.
    const doc = {
      header: { product: 'MENS OVERSIZED TEE' },
      sizing: {
        rows: [{ label: 'CHEST 1/2 WIDTH', note: 'FITTDESIGN IS NOT LIABLE FOR FLAWED SIZING' }],
      },
      blueprint: [{ features: [{ label: 'HEM (REFERENCE IMAGE)', positions: [{ x: 10, y: 20 }] }] }],
    }
    const out = stripDeep(doc)
    expect(out.sizing.rows[0]!.note).toBe('')
    expect(out.sizing.rows[0]!.label).toBe('CHEST 1/2 WIDTH')
    expect(out.blueprint[0]!.features[0]!.label).toBe('HEM')
    expect(out.header.product).toBe('MENS OVERSIZED TEE')
  })

  it('preserves non-string values', () => {
    const out = stripDeep({ n: 42, b: true, nil: null, arr: [1, 2], nested: { x: 10.5 } })
    expect(out).toEqual({ n: 42, b: true, nil: null, arr: [1, 2], nested: { x: 10.5 } })
  })

  it('does not mutate the input', () => {
    const input = { a: 'DELETE' }
    stripDeep(input)
    expect(input.a).toBe('DELETE')
  })
})

describe('stripFilename', () => {
  it('normalizes the real supplied filenames', () => {
    expect(
      stripFilename('ANVLAthletics_MensOversizedDropShoulderTee_Updated_FinalPack_May202026.pdf'),
    ).toBe('anvlathletics-mensoversizeddropshouldertee-updated-finalpack-may202026.pdf')
  })

  it('strips a supplier name out of a filename', () => {
    // Object paths surface in signed URLs and the media library, so a supplier
    // name here would outlive every other gate.
    expect(stripFilename('FittDesign_ANVL_CompressionTee.pdf')).toBe('anvl-compressiontee.pdf')
  })

  it('survives an empty or extension-only name', () => {
    expect(stripFilename('FITTDESIGN.pdf')).toBe('techpack.pdf')
    expect(stripFilename('pack')).toBe('pack')
  })

  it('lowercases the extension', () => {
    expect(stripFilename('Pack.PDF')).toBe('pack.pdf')
  })
})
