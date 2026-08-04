import { normalizeKey, parsePantoneCode, parseSrgbHex } from '../normalize'

/**
 * Reading one printed colour.
 *
 * Every reference page states a colour the same way — a Pantone code, a colour
 * name, and an sRGB triplet, stacked — whether it appears as a screen on an
 * artwork page or as a cell of the COLOR SWATCHES matrix. Both parsers share
 * this reader so the two pages can never disagree about what a colour is.
 */

export const COLOR_CODE_LABEL = /\b(PANTONE|COLORO)\s+COLOU?R\s+CODE\s*:/i
const SRGB_LINE = /\bSRGB\b/i
const DIMENSION_ONLY = /^\d+(?:\.\d+)?\s*["”″]$/

export interface ColorCell {
  colorName: string
  pantone: string
  hex: string
}

/**
 * Read a stack of lines as one colour.
 *
 * `TCX NOT AVAILABLE` is a statement about the CODE, not a colour name, so it
 * is skipped; the packs print it for every Solid-Coated colour. The spaces are
 * squeezed out before that test because the letter-spaced runs arrive as
 * `TCX NOT AVA I L A B L E`.
 */
export function readColorCell(lines: readonly string[]): ColorCell {
  const cell: ColorCell = { colorName: '', pantone: '', hex: '' }
  for (const line of lines) {
    if (SRGB_LINE.test(line)) {
      if (!cell.hex) cell.hex = parseSrgbHex(line)
      continue
    }
    if (COLOR_CODE_LABEL.test(line)) continue
    const code = parsePantoneCode(line)
    if (code) {
      if (!cell.pantone) cell.pantone = code
      continue
    }
    if (line.replace(/\s+/g, '').toUpperCase().includes('NOTAVAILABLE')) continue
    if (DIMENSION_ONLY.test(line)) continue
    if (!cell.colorName) cell.colorName = normalizeKey(line)
  }
  return cell
}

/** One group per `PANTONE COLOR CODE:` heading — a print page has one per screen. */
export function colorGroups(lines: readonly string[]): string[][] {
  const groups: string[][] = []
  let current: string[] | null = null
  for (const line of lines) {
    if (COLOR_CODE_LABEL.test(line)) {
      current = []
      groups.push(current)
      continue
    }
    current?.push(line)
  }
  return groups
}
