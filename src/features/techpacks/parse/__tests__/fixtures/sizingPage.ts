import { headerTexts, makeExtract, titleTexts, type TextSpec } from './makeExtract'
import type { TechpackPageExtract } from '../../pdfTypes'

/**
 * The SIZING GUIDE page, reproducing the layout trap from the real packs.
 *
 * Labels wrap onto two lines ("CB LENGTH" / "-A") and the values do NOT
 * consistently sit on the first of those lines — for BOTTOM 1/2 WIDTH the
 * numbers are on the SECOND line. Reading the page as text lines therefore
 * shifts whole rows by one, which is exactly what the raw extraction of the
 * supplied packs does.
 *
 * Numbers below are the real oversized-tee figures, in inches.
 */

const COLUMN_X = [300, 400, 500, 600]
const LABEL_X = 60
const ROW_HEIGHT = 26
const FIRST_ROW_Y = 190

export interface SizingRowSpec {
  /** Label lines, in order, e.g. `['CB LENGTH', '-A']`. */
  labelLines: string[]
  values: string[]
  /** Which label line the values share a baseline with. */
  valuesOnLine?: number
}

export const OVERSIZED_TEE_ROWS: SizingRowSpec[] = [
  { labelLines: ['CB LENGTH', '-A'], values: ['26.00', '27.00', '28.00', '29.00'] },
  { labelLines: ['CHEST 1/2', 'WIDTH - B'], values: ['22.75', '24.00', '25.25', '26.50'] },
  { labelLines: ['WAIST 1/2', 'WIDTH - C'], values: ['22.00', '23.25', '24.50', '25.75'] },
  // The trap: values sit on the SECOND label line here.
  {
    labelLines: ['BOTTOM 1/2', 'WIDTH - D'],
    values: ['21.25', '22.50', '23.75', '25.00'],
    valuesOnLine: 1,
  },
  { labelLines: ['COLLAR 1/2', 'WIDTH - E'], values: ['8.25', '8.50', '8.75', '9.00'] },
  { labelLines: ['SLEEVE', 'LENGTH - F'], values: ['14.50', '15.25', '16.00', '16.75'] },
  { labelLines: ['CUFF 1/2', 'WIDTH - G'], values: ['7.00', '7.25', '7.50', '7.75'] },
]

export interface SizingPageOptions {
  rows?: SizingRowSpec[]
  /** Diagram marker letters and their page positions. */
  markers?: Array<{ letter: string; x: number; y: number }>
  withDiagram?: boolean
}

export function sizingGuidePage(options: SizingPageOptions = {}): TechpackPageExtract {
  const rows = options.rows ?? OVERSIZED_TEE_ROWS
  const texts: TextSpec[] = [...headerTexts(), ...titleTexts('SIZING', 'GUIDE')]

  // Column headings + the units row beneath them.
  texts.push({ text: 'MEASUREMENT', x: LABEL_X, y: 150, w: 90, h: 8 })
  const sizes = ['SMALL', 'MEDIUM', 'LARGE', 'X-LARGE']
  sizes.forEach((size, i) => {
    const w = size.length * 5
    texts.push({ text: size, x: (COLUMN_X[i] ?? 0) - w / 2, y: 150, w, h: 8 })
    texts.push({ text: '(INCHES)', x: (COLUMN_X[i] ?? 0) - 20, y: 162, w: 40, h: 8 })
  })

  rows.forEach((row, rowIndex) => {
    const baseY = FIRST_ROW_Y + rowIndex * ROW_HEIGHT
    row.labelLines.forEach((line, lineIndex) => {
      texts.push({ text: line, x: LABEL_X, y: baseY + lineIndex * 10, w: line.length * 5, h: 8 })
    })
    const valueY = baseY + (row.valuesOnLine ?? 0) * 10
    row.values.forEach((value, i) => {
      const w = value.length * 5
      texts.push({ text: value, x: (COLUMN_X[i] ?? 0) - w / 2, y: valueY, w, h: 8 })
    })
  })

  // The measuring note that sits next to the disclaimer on the real page.
  texts.push({
    text: 'NOTE: ALL MEASUREMENTS ARE MADE WITH THE GARMENT LAID FLAT ON THE TABLE',
    x: 300,
    y: 620,
    w: 360,
    h: 7,
  })
  texts.push({
    text: 'DISCLAIMER: PLEASE SAMPLE THESE SIZES IN THEIR ENTIRETY BEFORE PLACING A MASS ORDER',
    x: 300,
    y: 634,
    w: 380,
    h: 7,
  })
  texts.push({
    text: 'FITTDESIGN IS NOT LIABLE FOR FLAWED SIZING',
    x: 300,
    y: 648,
    w: 220,
    h: 7,
  })

  const markers = options.markers ?? [
    { letter: 'E', x: 800, y: 160 },
    { letter: 'F', x: 760, y: 200 },
    { letter: 'B', x: 840, y: 250 },
    { letter: 'G', x: 870, y: 300 },
    { letter: 'C', x: 790, y: 330 },
    { letter: 'A', x: 850, y: 360 },
    { letter: 'D', x: 880, y: 520 },
  ]
  for (const marker of markers) {
    texts.push({ text: marker.letter, x: marker.x, y: marker.y, w: 7, h: 8 })
  }

  return makeExtract({
    page: 4,
    texts,
    images:
      options.withDiagram === false
        ? []
        : [{ key: 'diagram', x: 700, y: 120, w: 260, h: 460, px: 900, py: 1600 }],
  })
}
