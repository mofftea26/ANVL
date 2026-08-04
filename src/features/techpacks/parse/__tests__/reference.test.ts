import { describe, expect, it } from 'vitest'
import {
  parseBrandingElements,
  parseColorSwatches,
  parsePatternPrints,
  parseSeamlessKnits,
  parseTrims,
} from '../pages/reference'
import { makeContext } from './fixtures/makeContext'
import { makeExtract, type TextSpec } from './fixtures/makeExtract'

/**
 * Every box in this file is copied from the raw geometry of the operator's real
 * packs (A4 landscape, 841.89 x 595.276). Only the colour NAMES are sometimes
 * substituted, and only to avoid an unrelated defect: `collapseLetterSpacing`
 * leaves `L AVA` / `AVA I L A B L E` un-collapsed because it demands every
 * token be one or two characters, so asserting on `LAVA SMOKE` would encode a
 * bug in `normalize.ts` that these tests do not own.
 */

const A4 = { width: 841.89, height: 595.276 }
const page = (texts: TextSpec[], images: Parameters<typeof makeExtract>[0]['images'] = []) =>
  makeExtract({ page: 12, ...A4, texts, images })

/** The section title, whose 383.6pt run centres inside the PRINT column. */
const MATRIX_TITLE: TextSpec = {
  text: 'COLORWAY SCHEDULE COLOR COMBINATIONS:',
  x: 17.9,
  y: 104.8,
  w: 383.6,
  h: 14.2,
}

/** COLORWAY / NUMBER over MAIN over PRINT + its `(SEE INDEX A)` cross-ref. */
const MATRIX_HEADERS: TextSpec[] = [
  { text: 'COLORWAY', x: 23.2, y: 138.6, w: 67.2, h: 10 },
  { text: 'NUMBER', x: 32.2, y: 150.6, w: 49.2, h: 10 },
  { text: 'MAIN', x: 121.1, y: 144.2, w: 26.9, h: 9 },
  { text: 'PRINT', x: 197.3, y: 138.7, w: 30, h: 9 },
  { text: '(SEE INDEX A)', x: 175.2, y: 149.5, w: 74.2, h: 9 },
]

/** Two colorway bands, each three lines deep, the number beside the middle one. */
const MATRIX_BODY: TextSpec[] = [
  // Colorway 1 — Pantone row.
  { text: 'T C X', x: 98.7, y: 171.1, w: 13.1, h: 4.8 },
  { text: 'N O T', x: 115.1, y: 171.1, w: 13.4, h: 4.8 },
  { text: 'AVA I L A B L E', x: 131.8, y: 171.1, w: 38.5, h: 4.8 },
  { text: '1 8 - 0 2 0 2', x: 191, y: 171.1, w: 26.2, h: 4.8 },
  { text: 'T C X', x: 220.5, y: 171.1, w: 13.1, h: 4.8 },
  // Colorway 1 — name row.
  { text: 'P R O C E S S', x: 102, y: 176.8, w: 32.2, h: 4.8 },
  { text: 'B L A C K', x: 137.5, y: 176.8, w: 22.2, h: 4.8 },
  { text: 'C', x: 163, y: 176.8, w: 4.1, h: 4.8 },
  { text: 'T O F U', x: 190, y: 176.8, w: 17.8, h: 4.8 },
  // The number sits BETWEEN the name and sRGB rows.
  { text: '1', x: 54.9, y: 179.1, w: 3.7, h: 9 },
  // Colorway 1 — sRGB row.
  { text: 's R G B', x: 105.4, y: 182.6, w: 16.7, h: 4.8 },
  { text: '( 4 8 / 4 6 / 4 4 )', x: 125.3, y: 182.6, w: 38.3, h: 4.8 },
  { text: 's R G B', x: 182.2, y: 182.6, w: 16.7, h: 4.8 },
  { text: '( 9 4 / 9 6 / 1 0 0 )', x: 202.1, y: 182.6, w: 40.3, h: 4.8 },
  // Colorway 2 — Pantone row.
  { text: '1 1 - 4 8 0 1', x: 114.3, y: 205.3, w: 24, h: 4.8 },
  { text: 'T C X', x: 141.6, y: 205.3, w: 13.1, h: 4.8 },
  { text: '1 8 - 0 2 0 2', x: 191, y: 205.3, w: 26.2, h: 4.8 },
  { text: 'T C X', x: 220.5, y: 205.3, w: 13.1, h: 4.8 },
  // Colorway 2 — name row.
  { text: 'T O F U', x: 125.6, y: 211, w: 17.8, h: 4.8 },
  { text: 'O P T I C', x: 190, y: 211, w: 20.6, h: 4.8 },
  { text: 'W H I T E', x: 213.8, y: 211, w: 22.1, h: 4.8 },
  { text: '2', x: 53.8, y: 212.8, w: 5.9, h: 9 },
  // Colorway 2 — sRGB row.
  { text: 's R G B', x: 100.5, y: 216.8, w: 16.7, h: 4.8 },
  { text: '( 2 3 2 / 2 2 8 / 2 1 8 )', x: 120.4, y: 216.8, w: 48.2, h: 4.8 },
  { text: 's R G B', x: 182.2, y: 216.8, w: 16.7, h: 4.8 },
  { text: '( N / A )', x: 202.1, y: 216.8, w: 19, h: 4.8 },
]

describe('parseColorSwatches', () => {
  it('reads the matrix as a grid, not as rows', () => {
    const { ctx, issues } = makeContext()
    const result = parseColorSwatches(page([MATRIX_TITLE, ...MATRIX_HEADERS, ...MATRIX_BODY]), ctx)

    expect(issues).toHaveLength(0)
    expect(result.swatches).toEqual([
      { colorwayIndex: 1, roleKey: 'main', colorName: 'PROCESS BLACK C', pantone: '', hex: '#302e2c' },
      { colorwayIndex: 1, roleKey: 'print', colorName: 'TOFU', pantone: '18-0202 TCX', hex: '#5e6064' },
      { colorwayIndex: 2, roleKey: 'main', colorName: 'TOFU', pantone: '11-4801 TCX', hex: '#e8e4da' },
      { colorwayIndex: 2, roleKey: 'print', colorName: 'OPTIC WHITE', pantone: '18-0202 TCX', hex: '' },
    ])
  })

  it('does not let the colorway number pull the sRGB line into a swatch', () => {
    const { ctx } = makeContext()
    const result = parseColorSwatches(page([MATRIX_TITLE, ...MATRIX_HEADERS, ...MATRIX_BODY]), ctx)

    // The row-wise reader clustered the number with the sRGB line and emitted
    // `colorName: "(48/46/44)"` with no role and no Pantone.
    for (const swatch of result.swatches ?? []) {
      expect(swatch.colorName).not.toMatch(/^\(/)
      expect(swatch.roleKey).not.toBe('')
    }
  })

  it('keeps the section title out of the column grid', () => {
    const { ctx } = makeContext()
    const withTitle = parseColorSwatches(page([MATRIX_TITLE, ...MATRIX_HEADERS, ...MATRIX_BODY]), ctx)
    const withoutTitle = parseColorSwatches(page([...MATRIX_HEADERS, ...MATRIX_BODY]), ctx)

    expect(withTitle.swatches).toEqual(withoutTitle.swatches)
  })

  it('resolves a header overprinted with its template text', () => {
    const { ctx } = makeContext()
    const result = parseColorSwatches(
      page([
        ...MATRIX_HEADERS.filter((t) => t.text !== 'MAIN'),
        // Both compression packs stamp the first column twice: the template's
        // `MAIN` inside the pack's own `MAIN 1`.
        { text: 'MAIN 1', x: 118, y: 144.1, w: 33.1, h: 9 },
        { text: 'MAIN', x: 121.1, y: 144, w: 26.9, h: 9 },
        ...MATRIX_BODY,
      ]),
      ctx,
    )

    expect(result.swatches?.[0]?.roleKey).toBe('main-1')
  })

  it('raises swatches_not_read when the matrix has no colour values', () => {
    const { ctx, issues } = makeContext()
    const result = parseColorSwatches(page([MATRIX_TITLE, ...MATRIX_HEADERS]), ctx)

    expect(result.swatches).toBeUndefined()
    expect(issues.map((i) => i.code)).toEqual(['swatches_not_read'])
  })
})

describe('parseSeamlessKnits', () => {
  /** Compression page 7: GRAPHIC A at x=17.9 and GRAPHIC B at x=428.9. */
  const knitPage = () =>
    page([
      { text: 'SEAMLESS KNIT TEXTURE (GRAPHIC A):', x: 17.9, y: 104.7, w: 316.5, h: 14 },
      { text: 'SEAMLESS KNIT TEXTURE (GRAPHIC B):', x: 428.9, y: 104.7, w: 314.5, h: 14 },
      { text: 'REPEATING PATTERN - KNITTED INTO GARMENT PATTERN', x: 17.9, y: 120.4, w: 324.4, h: 10 },
      { text: 'REPEATING PATTERN - KNITTED INTO GARMENT PATTERN', x: 428.9, y: 120.4, w: 324.4, h: 10 },
      { text: 'SCALED UP TO 0.375”X0.375” PER TILE', x: 17.9, y: 144.4, w: 211.8, h: 10 },
      { text: 'SCALED UP TO 0.75”X0.75” PER TILE', x: 428.9, y: 144.4, w: 199, h: 10 },
      { text: 'TILE AREA:', x: 17.9, y: 160.8, w: 35.8, h: 5 },
      { text: 'TILE AREA:', x: 428.9, y: 160.8, w: 35.8, h: 5 },
      { text: 'G A P', x: 51.7, y: 339.7, w: 17.1, h: 6 },
      { text: '( D E P R E S S E D )', x: 72.9, y: 339.7, w: 59.2, h: 6 },
      { text: '( M A I N', x: 136.2, y: 339.7, w: 25.4, h: 6 },
      { text: '1 )', x: 165.7, y: 339.7, w: 6.4, h: 6 },
      { text: 'W A L E', x: 462.7, y: 373.2, w: 24.4, h: 6 },
      { text: '( E L E VA T E D )', x: 491.2, y: 373.2, w: 52.8, h: 6 },
      { text: '( M A I N', x: 548.1, y: 373.2, w: 25.4, h: 6 },
      { text: '2 )', x: 577.6, y: 373.2, w: 6.4, h: 6 },
    ])

  it('splits a two-column page into one block per column', () => {
    const { ctx } = makeContext()
    const result = parseSeamlessKnits(knitPage(), ctx)

    expect(result.knits?.map((k) => k.code)).toEqual(['GRAPHIC A', 'GRAPHIC B'])
    // Each block keeps its OWN tile size; row-wise reading welded both into one.
    expect(result.knits?.map((k) => k.size)).toEqual(['0.375”X0.375”', '0.75”X0.75”'])
    expect(result.knits?.[0]?.description).not.toContain('0.75”X0.75”')
    expect(result.knits?.[0]?.colors).toEqual(['MAIN 1'])
    expect(result.knits?.[1]?.colors).toEqual(['MAIN 2'])
  })

  it('stops the description where the tile annotations begin', () => {
    const { ctx } = makeContext()
    const result = parseSeamlessKnits(knitPage(), ctx)

    expect(result.knits?.[0]?.description).toBe(
      'SEAMLESS KNIT TEXTURE REPEATING PATTERN - KNITTED INTO GARMENT PATTERN SCALED UP TO 0.375”X0.375” PER TILE',
    )
  })
})

describe('parseTrims', () => {
  it('reads a code printed as a suffix marker', () => {
    const { ctx } = makeContext()
    const result = parseTrims(
      page(
        [
          {
            text: 'CUSTOM JACQUARD DAMASK WEAVE BRAND LABEL TRIM W/ WOVEN BRANDING (TRIM A):',
            x: 17.9,
            y: 104.6,
            w: 721.3,
            h: 14,
          },
          { text: '1.00”X1.00” (VISIBLE)', x: 17.9, y: 120.3, w: 112.4, h: 10 },
          { text: 'PLACED ON TO EXTERIOR GARMENT- WRAPPED AROUND HEM', x: 17.9, y: 132.3, w: 400, h: 10 },
          { text: 'SEW', x: 130.6, y: 194.3, w: 14.8, h: 5 },
        ],
        [{ key: 'img_p8_1', x: 281, y: 275.6, w: 205, h: 184.4, px: 570, py: 513 }],
      ),
      ctx,
    )

    // `TRIM A):` used to leave the bracket in the code — when it matched at all.
    expect(result.trims?.[0]?.code).toBe('TRIM A')
    expect(result.trims?.[0]?.name).toBe(
      'CUSTOM JACQUARD DAMASK WEAVE BRAND LABEL TRIM W/ WOVEN BRANDING',
    )
    // Typographic quotes, which is the only way the packs print a size.
    expect(result.trims?.[0]?.visibleSize).toBe('1.00”X1.00”')
    expect(result.trims?.[0]?.description).not.toContain('SEW')
    // 205pt on an 841.9pt page is under the garment-flat ranker's width floor.
    expect(result.trims?.[0]?.imageId).toBe('p12-i0')
  })
})

describe('parsePatternPrints', () => {
  it('reads screen colours and leaves the colour block out of the description', () => {
    const { ctx } = makeContext()
    const result = parsePatternPrints(
      page([
        { text: 'CUSTOM GRAPHIC PRINT (GRAPHIC A):', x: 17.9, y: 104.6, w: 304.4, h: 14 },
        { text: 'PRINTED ON TO MAIN BODY', x: 17.9, y: 120.3, w: 156.7, h: 10 },
        { text: '- SEE TECHNICAL SHEET FOR PLACEMENT', x: 17.9, y: 132.3, w: 240.4, h: 10 },
        // Screen 1 — a specified ink.
        { text: 'P A N T O N E', x: 339.8, y: 181.7, w: 40.6, h: 6 },
        { text: 'C O L O R', x: 384.5, y: 181.7, w: 28.8, h: 6 },
        { text: 'C O D E :', x: 417.4, y: 181.7, w: 26.2, h: 6 },
        { text: '1 8 - 0 2 0 2', x: 339.8, y: 188.7, w: 32.8, h: 6 },
        { text: 'T C X', x: 376.6, y: 188.7, w: 16.4, h: 6 },
        { text: 'T O F U', x: 339.8, y: 195.7, w: 22.2, h: 6 },
        { text: 's R G B', x: 339.8, y: 202.7, w: 20.8, h: 6 },
        { text: '( 9 4 / 9 6 / 1 0 0 )', x: 364.7, y: 202.7, w: 50.4, h: 6 },
        // Screen 2 — no code, no triplet: "as per the artwork", not a colour.
        { text: 'P A N T O N E', x: 339.8, y: 212.4, w: 40.6, h: 6 },
        { text: 'C O L O R', x: 384.5, y: 212.4, w: 28.8, h: 6 },
        { text: 'C O D E :', x: 417.4, y: 212.4, w: 26.2, h: 6 },
        { text: 'T C X', x: 339.8, y: 219.4, w: 16.4, h: 6 },
        { text: 'N O T', x: 360.3, y: 219.4, w: 16.7, h: 6 },
        { text: 'AVA I L A B L E', x: 381.2, y: 219.4, w: 48.2, h: 6 },
        { text: 'A S', x: 339.8, y: 226.4, w: 11, h: 6 },
        { text: 'P E R', x: 354.9, y: 226.4, w: 15.9, h: 6 },
        { text: 'G R A P H I C', x: 374.8, y: 226.4, w: 38.1, h: 6 },
        { text: 's R G B', x: 339.8, y: 233.4, w: 20.8, h: 6 },
        { text: '( N / A )', x: 364.7, y: 233.4, w: 23.7, h: 6 },
      ]),
      ctx,
    )

    expect(result.prints?.[0]?.code).toBe('GRAPHIC A')
    expect(result.prints?.[0]?.colors).toEqual(['TOFU'])
    expect(result.prints?.[0]?.description).toBe(
      'CUSTOM GRAPHIC PRINT PRINTED ON TO MAIN BODY - SEE TECHNICAL SHEET FOR PLACEMENT',
    )
  })
})

describe('parseBrandingElements', () => {
  it('lifts the placement offsets out of the prose', () => {
    const { ctx } = makeContext()
    const result = parseBrandingElements(
      page([
        { text: 'INDEX A:', x: 17.9, y: 104.6, w: 70.2, h: 14 },
        {
          text: '3.00” WIDE LOGO PRINTED ON UPPER CENTER CHEST- CENTER ALIGNED HORIZONTALLY AND PLACED 2.50” BELOW FRONT NECKLINE',
          x: 17.9,
          y: 226.5,
          w: 757.9,
          h: 10,
        },
        { text: '-', x: 17.9, y: 238.5, w: 3.8, h: 10 },
        { text: 'SEE TECHNICAL SHEET FOR SIZE AND PLACEMENT', x: 24.6, y: 238.5, w: 291, h: 10 },
      ]),
      ctx,
    )

    expect(result.branding?.[0]?.code).toBe('INDEX A')
    expect(result.branding?.[0]?.dimensions).toEqual(['3.00”', '2.50”'])
    expect(result.branding?.[0]?.description).toContain('SEE TECHNICAL SHEET FOR SIZE AND PLACEMENT')
  })
})
