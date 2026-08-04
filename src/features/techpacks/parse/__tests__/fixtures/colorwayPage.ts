import { makeExtract, type TextSpec } from './makeExtract'
import type { TechpackPageExtract } from '../../pdfTypes'

/**
 * The COLORWAY SCHEDULE page, built from the real packs' measurements.
 *
 * Every number below was read off the raw pdf.js geometry of the five supplied
 * techpacks, because the two traps on this page are purely dimensional:
 *
 * - the role label (`MAIN`) is set in a SMALLER face than the block text and
 *   its baseline falls BETWEEN the code and name lines, so row clustering
 *   welds it onto the colour name unless the two faces are told apart;
 * - the repeated `CLIENT:` footer starts at 0.9100 of page height, i.e. inside
 *   `bodyText`'s 0.92 default, so it lands in whichever colour column shares
 *   its x unless the page parser narrows the window.
 */

/** A4 landscape — the size of every page in every supplied pack. */
const PAGE_WIDTH = 841.89
const PAGE_HEIGHT = 595.276

/** Block text is set at 6.0pt, role labels at 3.7pt, in every pack. */
const FACE = 6
const ROLE_FACE = 3.7
/** Line pitch inside a block: 141.6 → 148.6 → 155.6 → 162.6. */
const LINE_PITCH = 7
/** Widest gap between two runs of one line, measured across the corpus: 4.2. */
const WORD_GAP = 4.1
/** Anchor top → role label top, identical in every block of every pack. */
const ROLE_TOP_OFFSET = 11.9
/** Role label right edge → block left edge; the corpus range is 6.3–12.0. */
const ROLE_CLEAR = 10.4
/** Per-glyph advance: `P A N T O N E` measures 40.6pt for 7 letters at 6pt. */
const ADVANCE = 0.96

export interface ColorBlockSpec {
  /** Printed role label; blank reproduces a block with no label at all. */
  role: string
  /** Left edge shared by all four lines — they are flush to within 0.1pt. */
  left: number
  /** Top of the `… COLOR CODE:` line. */
  top: number
  codeLabel?: string
  /** `18-0202 TCX`, or `TCX NOT AVAILABLE` where the pack specifies no ink. */
  code: string
  /** The colour name, or a `SEE TRIM A` cross-reference. */
  name: string
  srgb: string
  /** Leading between the block's four lines; the packs print 7.0. */
  pitch?: number
}

function runWidth(word: string, face: number): number {
  return word.length * face * ADVANCE
}

/**
 * Lay out one line the way pdf.js reports it: one run per word, with the
 * packs' tracking arriving as spaces INSIDE each run (`P A N T O N E`).
 */
function spacedLine(text: string, x: number, y: number, face: number, gap = WORD_GAP): TextSpec[] {
  let cursor = x
  return text.split(' ').map((word) => {
    const w = runWidth(word, face)
    const spec: TextSpec = { text: word.split('').join(' '), x: cursor, y, w, h: face }
    cursor += w + gap
    return spec
  })
}

function lineWidth(text: string, face: number, gap = WORD_GAP): number {
  const words = text.split(' ')
  return words.reduce((sum, word) => sum + runWidth(word, face), 0) + gap * (words.length - 1)
}

export function colorBlockTexts(spec: ColorBlockSpec): TextSpec[] {
  const codeLabel = spec.codeLabel ?? 'PANTONE COLOR CODE:'
  const pitch = spec.pitch ?? LINE_PITCH
  const texts: TextSpec[] = [
    ...spacedLine(codeLabel, spec.left, spec.top, FACE),
    ...spacedLine(spec.code, spec.left, spec.top + pitch, FACE),
    ...spacedLine(spec.name, spec.left, spec.top + pitch * 2, FACE),
    ...spacedLine(spec.srgb, spec.left, spec.top + pitch * 3, FACE),
  ]
  if (spec.role) {
    // The label is right-aligned against the block, not left-aligned to it.
    const gap = 2.4
    const start = spec.left - ROLE_CLEAR - lineWidth(spec.role, ROLE_FACE, gap)
    texts.push(...spacedLine(spec.role, start, spec.top + ROLE_TOP_OFFSET, ROLE_FACE, gap))
  }
  return texts
}

/** The header spec column and the `CLIENT:` footer, at their measured positions. */
function chromeTexts(index: number, count: number): TextSpec[] {
  return [
    ...spacedLine('CONTRAST: SOLID (NONE)', 217.5, 14.8, FACE),
    ...spacedLine('STYLE: ANVL-M-SS01-FW26', 217.5, 22.8, FACE),
    ...spacedLine(`COLORWAYS: ${index} OF ${count}`, 217.5, 30.8, FACE),
    ...spacedLine('FABRIC: 100% COTTON | 260 GSM', 217.5, 38.8, FACE),
    { text: 'PRODUCT:', x: 19.1, y: 19.7, w: 82.3, h: 14 },
    { text: 'MENS OVERSIZED TEE', x: 19.1, y: 34.7, w: 179.8, h: 14 },
    { text: 'COLORWAY', x: 728.7, y: 19.7, w: 94.1, h: 14 },
    { text: 'SCHEDULE', x: 734.6, y: 35.7, w: 88.2, h: 14 },
    { text: 'CLIENT:', x: 19.1, y: 541.7, w: 61.9, h: 14 },
    { text: 'ANVL ATHLETICS', x: 19.1, y: 558.5, w: 139.3, h: 14 },
  ]
}

export function colorwaySchedulePage(options: {
  blocks: ColorBlockSpec[]
  index?: number
  count?: number
  page?: number
}): TechpackPageExtract {
  return makeExtract({
    page: options.page ?? 1,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    texts: [
      ...chromeTexts(options.index ?? 1, options.count ?? 3),
      ...options.blocks.flatMap(colorBlockTexts),
    ],
  })
}

/**
 * Page 1 of the oversized pack: four blocks in one bank.
 *
 * `PRINT` carries the only specified Pantone; `TRIM` and `GRAPHIC` print a
 * cross-reference where a colour name would go; `MAIN` names a process ink.
 */
export const OVERSIZED_COLORWAY_BLOCKS: ColorBlockSpec[] = [
  {
    role: 'PRINT',
    left: 51.1,
    top: 141.6,
    code: '18-0202 TCX',
    name: 'LAVA SMOKE',
    srgb: 'sRGB (94/96/100)',
  },
  {
    role: 'TRIM',
    left: 237.5,
    top: 141.6,
    code: 'TCX NOT AVAILABLE',
    name: 'SEE TRIM A',
    srgb: 'sRGB (N/A)',
  },
  {
    role: 'GRAPHIC',
    left: 380.4,
    top: 141.6,
    code: 'TCX NOT AVAILABLE',
    name: 'SEE GRAPHIC A',
    srgb: 'sRGB (N/A)',
  },
  {
    role: 'MAIN',
    left: 547.4,
    top: 141.6,
    code: 'TCX NOT AVAILABLE',
    name: 'PROCESS BLACK C',
    srgb: 'sRGB (48/46/44)',
  },
]

/**
 * Page 1 of the compression pack: two STACKED banks.
 *
 * `GRAPHIC` sits directly above `PRINT` at the same left edge, 30.4pt apart —
 * the case that a column-only read merges into a single colour.
 */
export const COMPRESSION_COLORWAY_BLOCKS: ColorBlockSpec[] = [
  {
    role: 'GRAPHIC',
    left: 366,
    top: 101.2,
    codeLabel: 'COLORO COLOR CODE:',
    code: 'TCX NOT AVAILABLE',
    name: 'SEE GRAPHIC A',
    srgb: 'sRGB (N/A)',
  },
  {
    role: 'MAIN 1',
    left: 51.1,
    top: 131.6,
    codeLabel: 'COLORO COLOR CODE:',
    code: 'TCX NOT AVAILABLE',
    name: 'PROCESS BLACK C',
    srgb: 'sRGB (48/46/44)',
  },
  {
    role: 'SEAM',
    left: 221.7,
    top: 131.6,
    codeLabel: 'COLORO COLOR CODE:',
    code: 'TCX NOT AVAILABLE',
    name: 'PROCESS BLACK C',
    srgb: 'sRGB (48/46/44)',
  },
  {
    role: 'PRINT',
    left: 366,
    top: 131.6,
    code: '14-0935 TCX',
    name: 'JOJOBA',
    srgb: 'sRGB (218/190/129)',
  },
  {
    role: 'MAIN 2',
    left: 701.3,
    top: 131.6,
    code: '14-0935 TCX',
    name: 'JOJOBA',
    srgb: 'sRGB (218/190/129)',
  },
]
