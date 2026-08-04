import { makeExtract, type TextSpec } from './makeExtract'
import type { TechpackPageExtract } from '../../pdfTypes'

/**
 * PACKAGING AND LABELS, transcribed from page 13 of the real cotton pack.
 *
 * Every box below is copied from the harness's raw geometry dump of
 * `oversized-may20-final` (A4 landscape, 841.89 × 595.276), converted from the
 * dump's baseline-relative `y` to the top-left `y` this builder expects by
 * subtracting the glyph height.
 *
 * The point of transcribing it rather than inventing it is the interference:
 * the size-label column, its `0.65”` callouts and the `SEW`/`FOLD`/`HERE`
 * markers all sit at the SAME heights as the care label's lines, and every one
 * of them used to corrupt a line when the page was read row by row.
 */

/** The care label block: x 64.6–112.0, set at 3.5 pt, one line every 4.5 pt. */
const CARE_LABEL: TextSpec[] = [
  { text: '100% COTTON', x: 75.3, y: 319.7, w: 26.1, h: 3.5 },
  { text: '-', x: 87.5, y: 324.2, w: 1.6, h: 3.5 },
  { text: 'COOL WASH INSIDE OUT', x: 65.2, y: 328.7, w: 46.3, h: 3.5 },
  { text: '-', x: 87.5, y: 333.2, w: 1.6, h: 3.5 },
  { text: 'USE MILD DETERGENT', x: 67.1, y: 337.7, w: 42.4, h: 3.5 },
  { text: '-', x: 87.5, y: 342.2, w: 1.6, h: 3.5 },
  { text: 'WASH DARK COLORS', x: 68.6, y: 346.7, w: 39.5, h: 3.5 },
  { text: 'SEPARATELY', x: 76.5, y: 351.2, w: 23.6, h: 3.5 },
  { text: '-', x: 87.5, y: 355.7, w: 1.6, h: 3.5 },
  { text: 'RESHAPE WHILST', x: 71.7, y: 360.2, w: 33.2, h: 3.5 },
  { text: 'DAMP', x: 82.8, y: 364.7, w: 11.1, h: 3.5 },
  { text: '-', x: 87.5, y: 369.2, w: 1.6, h: 3.5 },
  { text: 'DO NOT TUMBLE DRY', x: 67.8, y: 373.7, w: 41.0, h: 3.5 },
  { text: '-', x: 87.5, y: 378.2, w: 1.6, h: 3.5 },
  { text: 'COOL IRON ON REVERSE', x: 64.6, y: 382.7, w: 47.4, h: 3.5 },
  { text: '-', x: 87.5, y: 387.2, w: 1.6, h: 3.5 },
  { text: 'DO NOT IRON', x: 75.5, y: 391.7, w: 25.7, h: 3.5 },
  { text: 'DECORATION', x: 75.8, y: 396.2, w: 25.0, h: 3.5 },
  { text: '-', x: 87.5, y: 400.7, w: 1.6, h: 3.5 },
  { text: 'DO NOT DRY CLEAN', x: 69.4, y: 405.3, w: 37.9, h: 3.5 },
]

/** "Designed in" / "Lebanon", wrapped over two rows and printed twice. */
const ORIGIN: TextSpec[] = [
  { text: 'Designed in', x: 60.4, y: 254.9, w: 55.8, h: 9 },
  { text: 'Designed in', x: 274.6, y: 254.9, w: 55.8, h: 9 },
  { text: 'Lebanon', x: 68.4, y: 264.9, w: 39.9, h: 9 },
  { text: 'Lebanon', x: 282.5, y: 264.9, w: 39.9, h: 9 },
]

/**
 * Everything that shares a row with a care line without belonging to it.
 *
 * `0.65”` at x 427.2 sat on `100% COTTON`; `FOLD` on `COOL WASH INSIDE OUT`;
 * `SIZE:` on `COOL IRON ON REVERSE`; `0.65”X0.50” VISIBLE` on `DO NOT IRON`.
 */
const INTERFERENCE: TextSpec[] = [
  { text: '0.65”', x: 427.2, y: 315.0, w: 20.7, h: 7 },
  { text: 'FOLD', x: 499.8, y: 328.7, w: 17.0, h: 5 },
  { text: 'HERE', x: 499.8, y: 334.7, w: 17.1, h: 5 },
  { text: '1.875”', x: 24.1, y: 364.9, w: 24.4, h: 7 },
  { text: '0.65”', x: 427.2, y: 361.8, w: 20.7, h: 7 },
  { text: 'SEW', x: 501.0, y: 371.0, w: 14.8, h: 5 },
  { text: 'HERE', x: 499.8, y: 377.0, w: 17.1, h: 5 },
  { text: 'SIZE:', x: 449.0, y: 383.4, w: 14.2, h: 5 },
  { text: '0.65”X0.50” VISIBLE', x: 449.0, y: 389.4, w: 53.6, h: 5 },
  { text: 'SEW', x: 150.3, y: 417.9, w: 14.8, h: 5 },
  { text: 'HERE', x: 149.2, y: 423.9, w: 17.1, h: 5 },
]

/** The two label headings and the size letters on the sizing label. */
const HEADINGS: TextSpec[] = [
  { text: 'CENTER FOLDED CARE / BRAND LABEL:', x: 17.9, y: 90.6, w: 317.7, h: 14 },
  { text: 'CENTER FOLDED LOOPED SIZING LABEL:', x: 421.0, y: 90.6, w: 325.0, h: 14 },
  { text: '1.875”X1.25” (VISIBLE)', x: 17.9, y: 110.3, w: 116.9, h: 10 },
  { text: '0.65”X0.50” (VISIBLE)', x: 420.9, y: 110.3, w: 116.3, h: 10 },
  {
    text: 'SEWN INSIDE GARMENT - ATTACHED SIDEWAYS ABOVE LEFT HIP',
    x: 17.9,
    y: 122.3,
    w: 370.0,
    h: 10,
  },
  { text: 'S', x: 462.7, y: 166.1, w: 8.6, h: 23 },
  { text: 'M', x: 579.6, y: 166.1, w: 12.4, h: 23 },
  { text: 'L', x: 700.7, y: 166.1, w: 7.8, h: 23 },
  { text: 'XL', x: 458.2, y: 298.2, w: 17.7, h: 23 },
  { text: 'CLIENT:', x: 19.1, y: 541.7, w: 61.9, h: 14 },
]

export interface PackagingPageOptions {
  /** Replaces the care-label block, e.g. to drop it entirely. */
  careLabel?: TextSpec[]
  /** Replaces the "Designed in / Lebanon" block. */
  origin?: TextSpec[]
}

export function packagingPage(options: PackagingPageOptions = {}): TechpackPageExtract {
  return makeExtract({
    page: 13,
    width: 841.89,
    height: 595.276,
    texts: [
      ...HEADINGS,
      ...INTERFERENCE,
      ...(options.origin ?? ORIGIN),
      ...(options.careLabel ?? CARE_LABEL),
    ],
  })
}
