import { headerTexts, makeExtract, titleTexts, type TextSpec } from './makeExtract'
import type { TechpackPageExtract } from '../../pdfTypes'

/**
 * The BASIC SPECS page, laid out like the real oversized-tee pack.
 *
 * Structure taken from the supplied PDF: four columns of feature cards ring a
 * centred garment flat. Each card prints its KEY LETTER on one line and its
 * label several lines BELOW, in the same column — not beside it. Markers for
 * those same letters are scattered over the drawing, and several letters
 * appear more than once because the detail occurs in more than one place.
 */

/** Card columns, matching the real page: two at the left, two at the right. */
const COLUMN_X = [40, 180, 720, 880]
/** Card rows: a key line, then its label lines well below. */
const KEY_Y = [120, 330, 540]
const LABEL_OFFSET = 60

export interface CardSpec {
  code: string
  label: string
  detail?: string
}

/** The real cards from the oversized-tee BASIC SPECS page. */
export const OVERSIZED_TEE_CARDS: CardSpec[] = [
  { code: 'a', label: 'HIGH NECK FRONT NECKLINE STYLE' },
  { code: 'b', label: 'LOWER CHEST LINE DROP ARMHOLE STYLE' },
  { code: 'c', label: 'DROP SHOULDER STYLE PATTERN CONSTRUCTION' },
  { code: 'g', label: 'SINGLE JERSEY WEFT KNIT TEXTILE CONSTRUCTION' },
  { code: 'h', label: 'MATTE 2D SILICONE SCREEN PRINT HEAT TRANSFER LOGO' },
  { code: 'i', label: 'CLEAN FINISH TURNED UP HEM COVER SEAMING STITCH' },
  { code: 'j', label: 'HEM WRAPPED JACQUARD DAMASK WEAVE BRAND LABEL (SEE TRIM A)' },
  { code: 'k', label: 'PLAIN SEAM W/ 15SPI S/N 301 LOCKSTITCH' },
  { code: 'l', label: 'DIGITAL DIRECT TO GARMENT PRINT' },
  { code: 'd', label: 'ELBOW-LENGTH LENGTH SLEEVE TYPE' },
  { code: 'e', label: 'STRAIGHT BOTTOM HEMLINE' },
  { code: 'f', label: 'GARMENT STYLE AND FIT REFERENCE' },
]

/**
 * Markers on the drawing. Note `f`, `i` and `k` appear twice — one feature,
 * several places on the garment.
 */
export const OVERSIZED_TEE_MARKERS: Array<{ code: string; x: number; y: number }> = [
  { code: 'a', x: 470, y: 210 },
  { code: 'k', x: 520, y: 205 },
  { code: 'f', x: 440, y: 200 },
  { code: 'c', x: 560, y: 235 },
  { code: 'h', x: 450, y: 250 },
  { code: 'b', x: 530, y: 320 },
  { code: 'g', x: 490, y: 330 },
  { code: 'l', x: 600, y: 300 },
  { code: 'i', x: 555, y: 350 },
  { code: 'd', x: 640, y: 350 },
  { code: 'f', x: 425, y: 380 },
  { code: 'j', x: 490, y: 460 },
  { code: 'i', x: 430, y: 455 },
  { code: 'k', x: 610, y: 420 },
  { code: 'e', x: 500, y: 540 },
]

export interface BasicSpecsOptions {
  cards?: CardSpec[]
  markers?: Array<{ code: string; x: number; y: number }>
  withFlat?: boolean
}

export function basicSpecsPage(options: BasicSpecsOptions = {}): TechpackPageExtract {
  const cards = options.cards ?? OVERSIZED_TEE_CARDS
  const markers = options.markers ?? OVERSIZED_TEE_MARKERS

  const texts: TextSpec[] = [...headerTexts(), ...titleTexts('BASIC', 'SPECS')]

  // Cards fill column-major, the way the real page reads.
  cards.forEach((card, i) => {
    const column = COLUMN_X[Math.floor(i / KEY_Y.length) % COLUMN_X.length] ?? 0
    const keyY = KEY_Y[i % KEY_Y.length] ?? 0

    texts.push({ text: card.code, x: column + 30, y: keyY, w: 7, h: 8 })

    // Wrap the label so cards look like the real multi-line blocks.
    const words = card.label.split(' ')
    const lines: string[] = []
    let line = ''
    for (const word of words) {
      if ((line + word).length > 22) {
        lines.push(line.trim())
        line = ''
      }
      line += `${word} `
    }
    if (line.trim()) lines.push(line.trim())

    lines.forEach((text, lineIndex) => {
      texts.push({
        text,
        x: column,
        y: keyY + LABEL_OFFSET + lineIndex * 11,
        w: text.length * 5,
        h: 8,
      })
    })
  })

  for (const marker of markers) {
    texts.push({ text: marker.code, x: marker.x, y: marker.y, w: 7, h: 8 })
  }

  return makeExtract({
    page: 6,
    texts,
    images:
      options.withFlat === false
        ? []
        : [{ key: 'flat', x: 380, y: 150, w: 300, h: 440, px: 1200, py: 1760 }],
  })
}
