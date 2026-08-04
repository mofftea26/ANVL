import { describe, expect, it } from 'vitest'

import { classifyPage, titleBandItems } from '../classifyPage'
import { headerTexts, makeExtract, titleTexts } from './fixtures/makeExtract'

const page = (line1: string, line2 = '') =>
  makeExtract({ texts: [...headerTexts(), ...titleTexts(line1, line2)] })

describe('classifyPage', () => {
  it('classifies every page kind the supplied packs contain', () => {
    const cases: Array<[string, string, string]> = [
      ['COLORWAY', 'SCHEDULE', 'colorway-schedule'],
      ['SIZING', 'GUIDE', 'sizing-guide'],
      ['TECHNICAL', 'SHEET', 'technical-sheet'],
      ['BASIC', 'SPECS', 'basic-specs'],
      ['BRANDING', 'ELEMENTS', 'branding-elements'],
      ['TRIMS', 'AND NOTIONS', 'trims-and-notions'],
      ['PATTERN PRINTS', 'AND GRAPHICS', 'pattern-prints'],
      ['SEAMLESS KNITS', 'AND TEXTURES', 'seamless-knits'],
      ['COLOR', 'SWATCHES', 'color-swatches'],
      ['PACKAGING', 'AND LABELS', 'packaging-and-labels'],
    ]
    for (const [l1, l2, expected] of cases) {
      expect(classifyPage(page(l1, l2)).kind, `${l1} ${l2}`).toBe(expected)
    }
  })

  it('reads a title set on a single line', () => {
    expect(classifyPage(page('BASIC SPECS')).kind).toBe('basic-specs')
  })

  it('reads a letter-spaced title', () => {
    // Real packs letter-space the title; joinRow reassembles it from the gaps.
    const glyphs = 'BASICSPECS'.split('').map((ch, i) => ({
      text: ch,
      x: 820 + i * 13,
      y: 20,
      w: 11,
      h: 18,
    }))
    expect(classifyPage(makeExtract({ texts: [...headerTexts(), ...glyphs] })).kind).toBe(
      'basic-specs',
    )
  })

  it('accepts both colour spellings', () => {
    expect(classifyPage(page('COLOURWAY', 'SCHEDULE')).kind).toBe('colorway-schedule')
    expect(classifyPage(page('COLOUR', 'SWATCHES')).kind).toBe('color-swatches')
  })

  it('returns unknown rather than guessing', () => {
    expect(classifyPage(page('SOMETHING', 'ELSE')).kind).toBe('unknown')
    expect(classifyPage(makeExtract({ texts: headerTexts() })).kind).toBe('unknown')
    expect(classifyPage(makeExtract({})).kind).toBe('unknown')
  })

  it('reports the title it decided from', () => {
    expect(classifyPage(page('SIZING', 'GUIDE')).title).toBe('SIZING GUIDE')
  })

  it('falls back to a full-page scan when the title sits below the band', () => {
    const low = makeExtract({
      texts: [
        ...headerTexts(),
        { text: 'TECHNICAL SHEET', x: 700, y: 400, w: 200, h: 18 },
      ],
    })
    expect(classifyPage(low).kind).toBe('technical-sheet')
  })
})

describe('titleBandItems', () => {
  it('excludes the left header block', () => {
    // The PRODUCT/CONTRAST/STYLE/FABRIC block shares the band with the title,
    // so the band needs both the "high up" and "pushed right" constraints.
    const texts = titleBandItems(page('BASIC', 'SPECS')).map((i) => i.text)
    expect(texts.join(' ')).toContain('BASIC')
    expect(texts.join(' ')).not.toContain('CONTRAST')
    expect(texts.join(' ')).not.toContain('PRODUCT')
    expect(texts.join(' ')).not.toContain('FABRIC')
  })

  it('excludes body content lower on the page', () => {
    const withBody = makeExtract({
      texts: [
        ...headerTexts(),
        ...titleTexts('BASIC', 'SPECS'),
        { text: 'RIGHT ALIGNED BODY TEXT', x: 800, y: 500, w: 170, h: 8 },
      ],
    })
    expect(titleBandItems(withBody).map((i) => i.text).join(' ')).not.toContain('BODY')
  })
})
