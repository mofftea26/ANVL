import { describe, expect, it } from 'vitest'
import { makeContext } from './fixtures/makeContext'
import { makeExtract, type TextSpec } from './fixtures/makeExtract'
import { parseTechnicalSheet } from '../pages/technicalSheet'

/**
 * The fixture below is TRACED, not invented.
 *
 * Every run is `[text, x, y, w, h]` copied out of page 5 of the oversized
 * drop-shoulder pack, in top-left points, letter-spacing and all. That matters
 * more here than on any other page: the bug this parser exists to fix was a
 * geometry misreading, and a fixture built from a mental model of the layout
 * is exactly the thing that cannot catch one. In particular it preserves
 *
 * - the header block ending at x=414.2 and the first callout starting at
 *   x=432.5 — 18 pt apart, the whole reason the old 0.55 W cut sliced
 *   `PLAIN SEAM` off its own callout;
 * - callouts A and B printed BACK TO BACK: B's first line sits 4.0 pt below
 *   A's last, CLOSER than the 5.0 pt pitch inside a callout, so only the
 *   `(SEE …)` terminator can separate them;
 * - the `ALL MEASUREMENTS …` note threaded BETWEEN callout D's first and
 *   second lines, which is how it came to be welded into a seam.
 */
type Run = readonly [text: string, x: number, y: number, w: number, h: number]

const run = ([text, x, y, w, h]: Run): TextSpec => ({ text, x, y, w, h })

/** The repeated header block and the right-aligned page title. */
const CHROME: readonly Run[] = [
  ['PRODUCT:', 19.1, 33.7, 82.3, 14],
  ['MENS OVERSIZED TEE', 19.1, 48.7, 179.8, 14],
  ['C O N T R A S T :', 217.5, 20.8, 49.2, 6],
  ['S O L I D', 270.8, 20.8, 25.5, 6],
  ['( N O N E )', 300.3, 20.8, 32.1, 6],
  ['S T Y L E :', 217.5, 28.8, 29.7, 6],
  ['A N V L - M - S S 0 1 - F W 2 6', 251.3, 28.8, 85.7, 6],
  ['C O L O R W AY S :', 217.5, 36.8, 57.2, 6],
  ['3', 278.8, 36.8, 3.9, 6],
  ['O F', 286.8, 36.8, 11.1, 6],
  ['3', 302, 36.8, 3.9, 6],
  ['F A B R I C :', 217.5, 44.8, 33.9, 6],
  ['1 0 0 %', 255.5, 44.8, 20.2, 6],
  ['C O T T O N', 279.9, 44.8, 34.1, 6],
  ['|', 318, 44.8, 1.9, 6],
  ['2 6 0', 324, 44.8, 14.5, 6],
  ['G S M', 342.6, 44.8, 17.6, 6],
  ['|', 364.3, 44.8, 1.9, 6],
  ['S I N G L E', 370.3, 44.8, 31.2, 6],
  ['J E R S E Y', 217.5, 52.8, 32.6, 6],
  ['W E F T', 254.2, 52.8, 24.2, 6],
  ['K N I T', 282.6, 52.8, 19.5, 6],
  ['T E X T I L E', 306.1, 52.8, 35.5, 6],
  ['C O N S T R U C T I O N', 345.7, 52.8, 68.5, 6],
  ['TECHNICAL', 729.9, 33.7, 92.9, 14],
  ['SHEET', 769.3, 49.7, 53.5, 14],
  ['CLIENT:', 19.1, 555.7, 61.9, 14],
  ['ANVL ATHLETICS', 19.1, 572.5, 139.3, 14],
]

/** Callout A — three lines, ISO class SSa, in the header band. */
const CALLOUT_A: readonly Run[] = [
  ['P L A I N', 432.5, 18.4, 16.9, 4],
  ['S E A M', 452.1, 18.4, 15.7, 4],
  ['W /', 470.5, 18.4, 7.7, 4],
  ['1 5 S P I', 481, 18.4, 14.5, 4],
  ['S / N', 498.2, 18.4, 10, 4],
  ['3 0 1', 511, 18.4, 8.7, 4],
  ['L O C K S T I T C H', 522.4, 18.4, 36.4, 4],
  ['-', 561.6, 18.4, 1.5, 4],
  ['1 / 4 ”', 565.9, 18.4, 10.4, 4],
  ['S T I T C H', 579, 18.4, 20.4, 4],
  ['L I N E', 602.1, 18.4, 12.8, 4],
  ['O F F S E T', 463.3, 23.4, 22.5, 4],
  ['W /', 488.5, 23.4, 7.7, 4],
  ['5 1 2', 498.9, 23.4, 8.5, 4],
  ['4', 510.1, 23.4, 2.9, 4],
  ['T H R E A D', 515.8, 23.4, 22.9, 4],
  ['OV E R L O C K', 541.5, 23.4, 31.6, 4],
  ['I N N E R', 575.8, 23.4, 17.5, 4],
  ['F I N I S H', 596, 23.4, 19, 4],
  ['( S S a', 526.6, 28.4, 12.6, 4],
  ['[ 1 . 0 1 . 0 1 ] )', 541.9, 28.4, 25.4, 4],
  ['( S E E', 570, 28.4, 13.5, 4],
  ['D E T A I L', 586.3, 28.4, 20.2, 4],
  ['K )', 609.2, 28.4, 5.7, 4],
]

/** Callout B — starts 4.0 pt below A's last line, in the same column. */
const CALLOUT_B: readonly Run[] = [
  ['H E M', 436.3, 32.4, 11.7, 4],
  ['W R A P P E D', 450.8, 32.4, 28.4, 4],
  ['J A C Q U A R D', 482, 32.4, 31, 4],
  ['D A M A S K', 515.7, 32.4, 24.2, 4],
  ['W E AV E', 542.7, 32.4, 21, 4],
  ['C E N T E R', 566.4, 32.4, 22.9, 4],
  ['F O L D E D', 592.1, 32.4, 22.9, 4],
  ['B R A N D', 465.4, 37.4, 19.5, 4],
  ['L A B E L', 487.6, 37.4, 18.1, 4],
  ['W /', 508.5, 37.4, 7.7, 4],
  ['W OV E N', 518.9, 37.4, 21.7, 4],
  ['B R A N D I N G', 543.4, 37.4, 30, 4],
  ['A P P L I C A T I O N', 576.1, 37.4, 38.8, 4],
  ['( S E E', 545.9, 42.4, 13.5, 4],
  ['D E T A I L', 562.2, 42.4, 20.2, 4],
  ['J', 585.1, 42.4, 2.3, 4],
  ['/ T R I M', 590.2, 42.4, 15.9, 4],
  ['A )', 608.8, 42.4, 6.2, 4],
]

/** Callout C — right-hand column, below the header band. */
const CALLOUT_C: readonly Run[] = [
  ['P L A I N', 661.3, 79.4, 16.9, 4],
  ['S E A M', 680.9, 79.4, 15.7, 4],
  ['W /', 699.3, 79.4, 7.7, 4],
  ['5 1 2', 709.8, 79.4, 8.5, 4],
  ['3', 721, 79.4, 2.6, 4],
  ['T H R E A D', 726.3, 79.4, 22.9, 4],
  ['OV E R L O C K', 751.9, 79.4, 31.6, 4],
  ['I N N E R', 786.2, 79.4, 17.5, 4],
  ['F I N I S H', 806.4, 79.4, 19, 4],
  ['( S S a', 736.5, 84.4, 12.6, 4],
  ['[ 1 . 0 1 . 0 1 ] )', 751.8, 84.4, 25.4, 4],
  ['( S E E', 780, 84.4, 13.5, 4],
  ['D E T A I L', 796.2, 84.4, 20.2, 4],
  ['O )', 819.1, 84.4, 6.3, 4],
]

/** Callout D — its three lines straddle the `ALL MEASUREMENTS` note. */
const CALLOUT_D: readonly Run[] = [
  ['S L E E V E', 639.4, 91.4, 22.7, 4],
  ['S E T', 664.9, 91.4, 10.5, 4],
  ['S E A M', 678.2, 91.4, 15.7, 4],
  ['W /', 696.6, 91.4, 7.7, 4],
  ['1 5 S P I', 707, 91.4, 14.5, 4],
  ['S / N', 724.2, 91.4, 10, 4],
  ['3 0 1', 737, 91.4, 8.7, 4],
  ['L O C K S T I T C H', 748.5, 91.4, 36.4, 4],
  ['-', 787.6, 91.4, 1.5, 4],
  ['1 / 4 ”', 791.9, 91.4, 10.4, 4],
  ['S T I T C H', 805, 91.4, 20.4, 4],
  ['L I N E', 658.2, 96.4, 12.8, 4],
  ['O F F S E T', 673.8, 96.4, 22.5, 4],
  ['W /', 699, 96.4, 7.7, 4],
  ['5 1 2', 709.4, 96.4, 8.5, 4],
  ['4', 720.6, 96.4, 2.9, 4],
  ['T H R E A D', 726.3, 96.4, 22.9, 4],
  ['OV E R L O C K', 751.9, 96.4, 31.6, 4],
  ['I N N E R', 786.2, 96.4, 17.5, 4],
  ['F I N I S H', 806.4, 96.4, 19, 4],
  ['( L S r', 735, 101.4, 11.5, 4],
  ['[ 2 . 0 6 . 0 2 ] )', 749.2, 101.4, 28.2, 4],
  ['( S E E', 780.2, 101.4, 13.5, 4],
  ['D E T A I L', 796.4, 101.4, 20.2, 4],
  ['N )', 819.3, 101.4, 6.1, 4],
]

/** Sheet-wide prose, the scale, and bare dimensions off the flat. */
const NOTES_AND_FIGURES: readonly Run[] = [
  ['A L L', 251.4, 93.9, 18.2, 7],
  ['M E A S U R E M E N T S', 274.4, 93.9, 83.4, 7],
  ['A R E', 362.6, 93.9, 19.7, 7],
  ['I N', 387.1, 93.9, 9.6, 7],
  ['I N C H E S', 401.5, 93.9, 37.4, 7],
  ['U N L E S S', 443.7, 93.9, 39.5, 7],
  ['O T H E R W I S E', 488, 93.9, 59.6, 7],
  ['S T A T E D', 552.4, 93.9, 38.1, 7],
  ['S C A L E :', 391.9, 102.9, 36.3, 7],
  ['1 : 1 0', 433, 102.9, 16.9, 7],
  ['N O T E :', 236.8, 492.5, 29.7, 7],
  ['T H E', 271.3, 492.5, 18.8, 7],
  ['M E A S U R E M E N T S', 294.9, 492.5, 83.4, 7],
  ['P R OV I D E D', 383.2, 492.5, 51.4, 7],
  ['A B OV E', 439.4, 492.5, 34.8, 7],
  ['A R E', 479, 492.5, 19.7, 7],
  ['F O R', 503.5, 492.5, 19.4, 7],
  ['A', 527.7, 492.5, 6.2, 7],
  ['S I Z E', 538.7, 492.5, 22.2, 7],
  ['M E D I U M', 565.8, 492.5, 39.3, 7],
  ['I S', 378.8, 506.5, 6.2, 5],
  ['N O T', 388.5, 506.5, 14, 5],
  ['L I A B L E', 405.9, 506.5, 25.1, 5],
  ['F O R', 434.4, 506.5, 13.9, 5],
  ['F L A W E D', 451.7, 506.5, 30.3, 5],
  ['S I Z I N G', 485.4, 506.5, 24.1, 5],
  ['24.00', 256.8, 153.2, 23.4, 7.6],
  ['24.00', 563.8, 153.1, 23.4, 7.6],
  ['8.50', 262.2, 172.1, 12.8, 5.4],
  ['8.50', 569.2, 172.1, 12.8, 5.4],
  ['2.50', 110.3, 220.1, 12.4, 5.4],
  ['22.50', 257.4, 446.9, 22.3, 7.6],
]

const SHEET: readonly Run[] = [
  ...CHROME,
  ...CALLOUT_A,
  ...CALLOUT_B,
  ...CALLOUT_C,
  ...CALLOUT_D,
  ...NOTES_AND_FIGURES,
]

function parseSheet(runs: readonly Run[] = SHEET) {
  const { ctx, issues } = makeContext()
  const extract = makeExtract({
    page: 5,
    width: 841.89,
    height: 595.276,
    texts: runs.map(run),
  })
  const technical = parseTechnicalSheet(extract, ctx).technical
  if (!technical) throw new Error('the technical sheet parser returned nothing')
  return { technical, issues }
}

describe('parseTechnicalSheet', () => {
  it('assembles each stacked callout into one seam', () => {
    const { technical } = parseSheet()
    expect(technical.seams.map((seam) => seam.text)).toEqual([
      'PLAIN SEAM W/ 15SPI S/N 301 LOCKSTITCH - 1/4” STITCH LINE OFFSET W/ 512 4 THREAD OVERLOCK INNER FINISH',
      'HEM WRAPPED JACQUARD DAMASK WEAVE CENTER FOLDED BRAND LABEL W/ WOVEN BRANDING APPLICATION',
      'PLAIN SEAM W/ 512 3 THREAD OVERLOCK INNER FINISH',
      'SLEEVE SET SEAM W/ 15SPI S/N 301 LOCKSTITCH - 1/4” STITCH LINE OFFSET W/ 512 4 THREAD OVERLOCK INNER FINISH',
    ])
  })

  it('reads the ISO class wherever the sheet prints one, in its own case', () => {
    const { technical } = parseSheet()
    expect(technical.seams.map((seam) => seam.code)).toEqual([
      'SSa [1.01.01]',
      '',
      'SSa [1.01.01]',
      'LSr [2.06.02]',
    ])
  })

  it('keeps the first words of a callout that reaches into the header block', () => {
    const { technical } = parseSheet()
    // x=432.5 sits left of `bodyText`'s 0.55 W cut; a header-band read that
    // used it shipped `W/ 15SPI S/N 301 LOCKSTITCH …`.
    expect(technical.seams[0]?.text.startsWith('PLAIN SEAM W/ 15SPI')).toBe(true)
  })

  it('splits two callouts printed back to back', () => {
    const { technical } = parseSheet()
    // B's first line is 4.0 pt below A's last — tighter than A's own 5.0 pt
    // line pitch — so only the `(SEE DETAIL K)` terminator separates them.
    expect(technical.seams[0]?.text).not.toContain('HEM WRAPPED')
    expect(technical.seams[1]?.text.startsWith('HEM WRAPPED JACQUARD')).toBe(true)
  })

  it('never welds sheet notes, the header, the title or the footer into a seam', () => {
    const { technical } = parseSheet()
    const joined = technical.seams.map((seam) => seam.text).join(' | ')
    for (const leak of [
      'MEASUREMENTS',
      'SCALE',
      'COTTON',
      'GSM',
      'ANVL-M-SS01',
      'TECHNICAL',
      'ANVL ATHLETICS',
      'LIABLE',
    ]) {
      expect(joined).not.toContain(leak)
    }
  })

  it('holds the cross-reference back from the customer-facing text', () => {
    const { technical } = parseSheet()
    expect(technical.seams.map((seam) => seam.supplierRef)).toEqual([
      'SEE DETAIL K',
      'SEE DETAIL J /TRIM A',
      'SEE DETAIL O',
      'SEE DETAIL N',
    ])
    expect(technical.seams.map((seam) => seam.text).join(' ')).not.toContain('SEE DETAIL')
  })

  it('reads stitches per inch off the assembled callout', () => {
    const { technical } = parseSheet()
    expect(technical.seams.map((seam) => seam.spi)).toEqual([15, null, null, 15])
  })

  it('emits no duplicate and no fragment of another seam', () => {
    const { technical } = parseSheet()
    const texts = technical.seams.map((seam) => seam.text)
    expect(new Set(texts).size).toBe(texts.length)
    for (const [i, text] of texts.entries()) {
      const others = texts.filter((_, j) => j !== i)
      expect(others.some((other) => other.includes(text))).toBe(false)
    }
  })

  it('keeps sheet notes internal and out of the seam list', () => {
    const { technical } = parseSheet()
    expect(technical.notes).toEqual([
      'ALL MEASUREMENTS ARE IN INCHES UNLESS OTHERWISE STATED',
      'SCALE: 1:10',
      'NOTE: THE MEASUREMENTS PROVIDED ABOVE ARE FOR A SIZE MEDIUM',
    ])
  })

  it('drops the supplier liability text at the first gate', () => {
    const { technical } = parseSheet()
    const everything = [...technical.notes, ...technical.seams.map((s) => s.text)].join(' ')
    expect(everything).not.toContain('LIABLE')
  })

  it('reads the scale and the base size', () => {
    const { technical } = parseSheet()
    expect(technical.scale).toBe('1:10')
    expect(technical.baseSize).toBe('MEDIUM')
  })

  it('files the bare dimension figures as internal pattern pieces', () => {
    const { technical } = parseSheet()
    expect(technical.patternPieces.map((piece) => piece.value)).toEqual([24, 24, 8.5, 8.5, 2.5, 22.5])
    expect(technical.patternPieces.every((piece) => piece.unit === 'in')).toBe(true)
  })

  it('splits a strip of figures printed as one cell into one piece each', () => {
    // Along the hem the flat carries its dimensions in a tight row; the gaps
    // between them are narrower than a column break, so they arrive as one
    // cell and must not be stored as a single unparseable value.
    const { technical } = parseSheet([
      ['2.75', 233.5, 414.2, 12.1, 5.4],
      ['2.375', 252, 414.2, 15.6, 5.4],
      ['1.125', 264.4, 414.2, 13, 5.4],
    ])
    expect(technical.patternPieces.map((piece) => piece.value)).toEqual([2.75, 2.375, 1.125])
  })

  it('reports an empty sheet instead of throwing', () => {
    const { technical, issues } = parseSheet([])
    expect(technical.seams).toEqual([])
    expect(issues.map((issue) => issue.code)).toContain('technical_no_seams')
  })

  it('says so when the sheet prints ISO classes that reach no callout', () => {
    // The class is printed, but nothing on the page reads as a callout — the
    // exact shape of the failure this parser replaced.
    const { issues } = parseSheet([
      ['S O M E T H I N G', 300, 200, 60, 4],
      ['B O N D E D', 365, 200, 30, 4],
      ['( S S a', 300, 205, 12.6, 4],
      ['[ 1 . 0 1 . 0 1 ] )', 315.3, 205, 25.4, 4],
    ])
    expect(issues.map((issue) => issue.code)).toContain('technical_no_seams')
  })

  it('raises no issue when the sheet reads cleanly', () => {
    const { issues } = parseSheet()
    expect(issues).toEqual([])
  })
})
