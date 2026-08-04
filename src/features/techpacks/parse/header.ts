import { clusterRows, joinRow, toPlacedText, type PlacedText } from './geometry'
import {
  normalizeKey,
  normalizeSpaces,
  parseComposition,
  parseGsm,
  parseNumber,
} from './normalize'
import type { TechpackPageExtract } from './pdfTypes'
import type { TechpackHeader } from '../schema/techpack.zod'

/**
 * The header block that repeats on every techpack page.
 *
 * It is parsed per page and then reduced to the value that appears MOST OFTEN
 * across the document. Reading it once from page 1 would let a single
 * mis-extracted page rewrite the product's fabric or style code; taking the
 * modal value means a page has to be wrong more often than it is right before
 * it changes anything.
 *
 * The block occupies the upper-left two thirds of the page: the product name
 * runs down the far-left column, the specification lines sit beside it, and
 * the page title is pushed to the right margin (handled by `classifyPage`).
 */

const NAME_COLUMN_END = 0.22
const SPEC_COLUMN_START = 0.2
const SPEC_COLUMN_END = 0.66
/**
 * The header block occupies the top ~9% of a real page, and page BODY content
 * starts around 25%. Reaching further than this pulls colorway blocks into the
 * product name — measured against the supplied packs, not guessed.
 */
const HEADER_BAND = 0.16
const FOOTER_BAND = 0.88

const EMPTY_HEADER: TechpackHeader = {
  product: '',
  contrast: '',
  style: '',
  colorwayCount: 0,
  fabric: { raw: '', composition: [], gsm: null, construction: '' },
  client: '',
}

function joinRegion(items: readonly PlacedText[]): string {
  return normalizeSpaces(
    clusterRows(items)
      .map((row) => joinRow(row))
      .join(' '),
  )
}

/** Everything after a `LABEL:` up to the next known label or the end. */
function fieldAfter(text: string, label: string): string {
  const pattern = new RegExp(
    `${label}\\s*:\\s*(.*?)(?=\\b(?:PRODUCT|CONTRAST|STYLE|COLOU?RWAYS?|FABRIC|CLIENT)\\s*:|$)`,
    'i',
  )
  return normalizeSpaces(pattern.exec(text)?.[1] ?? '')
}

/**
 * Split the fabric line into its three concerns.
 *
 * The line is pipe-delimited but not consistently ordered, so each part is
 * identified by what it looks like rather than by position: percentages are
 * fibres, a `NNN GSM` token is the weight, and whatever remains describes the
 * knit construction.
 */
function parseFabric(raw: string): TechpackHeader['fabric'] {
  const cleaned = normalizeSpaces(raw)
  const construction = cleaned
    .split('|')
    .map((part) => normalizeSpaces(part))
    .filter((part) => part && !/%/.test(part) && !/\bGSM\b/i.test(part))
    .join(' ')

  return {
    raw: cleaned,
    composition: parseComposition(cleaned),
    gsm: parseGsm(cleaned),
    construction: normalizeKey(construction),
  }
}

/** Parse the header block from one page. */
export function parseHeader(extract: TechpackPageExtract): TechpackHeader {
  const { width, height } = extract.viewport
  const placed = toPlacedText(extract)

  const nameItems = placed.filter(
    (i) => i.box.x < width * NAME_COLUMN_END && i.box.y < height * HEADER_BAND,
  )
  const specItems = placed.filter(
    (i) =>
      i.box.x >= width * SPEC_COLUMN_START &&
      i.box.x < width * SPEC_COLUMN_END &&
      i.box.y < height * HEADER_BAND,
  )
  const footerItems = placed.filter(
    (i) => i.box.y > height * FOOTER_BAND && i.box.x < width * SPEC_COLUMN_END,
  )

  const nameText = joinRegion(nameItems)
  const specText = joinRegion(specItems)
  const footerText = joinRegion(footerItems)

  // The name column is literally "PRODUCT:" followed by the name on the rows
  // beneath it, so removing the label leaves the name.
  const product = normalizeKey(nameText.replace(/^\s*PRODUCT\s*:\s*/i, ''))

  const colorwayText = fieldAfter(specText, 'COLOU?RWAYS?')
  const colorwayCount = parseNumber(/OF\s+(\d+)/i.exec(colorwayText)?.[1] ?? '') ?? 0

  return {
    product,
    contrast: normalizeKey(fieldAfter(specText, 'CONTRAST')),
    style: normalizeKey(fieldAfter(specText, 'STYLE')),
    colorwayCount: Math.max(0, Math.round(colorwayCount)),
    fabric: parseFabric(fieldAfter(specText, 'FABRIC')),
    client: normalizeKey(footerText.replace(/^\s*CLIENT\s*:\s*/i, '')),
  }
}

/** The `n` in `COLORWAYS: n OF m` — which colorway a schedule page describes. */
export function parseColorwayIndex(extract: TechpackPageExtract): number {
  const { width, height } = extract.viewport
  const specItems = toPlacedText(extract).filter(
    (i) =>
      i.box.x >= width * SPEC_COLUMN_START &&
      i.box.x < width * SPEC_COLUMN_END &&
      i.box.y < height * HEADER_BAND,
  )
  const text = fieldAfter(joinRegion(specItems), 'COLOU?RWAYS?')
  return Math.max(0, Math.round(parseNumber(/^(\d+)/.exec(text)?.[1] ?? '') ?? 0))
}

function modal(values: readonly string[]): string {
  const counts = new Map<string, number>()
  for (const value of values) {
    if (!value) continue
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  let best = ''
  let bestCount = 0
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value
      bestCount = count
    }
  }
  return best
}

/**
 * Reduce per-page headers to one document header by majority vote.
 *
 * Fields are voted on INDEPENDENTLY. A page whose fabric line was clipped
 * still contributes a perfectly good style code, and discarding the whole page
 * because one field failed would throw away good data.
 */
export function mergeHeaders(headers: readonly TechpackHeader[]): TechpackHeader {
  if (headers.length === 0) return structuredClone(EMPTY_HEADER)

  const fabricRaw = modal(headers.map((h) => h.fabric.raw))
  const counts = headers
    .map((h) => h.colorwayCount)
    .filter((n) => n > 0)
    .map(String)

  return {
    product: modal(headers.map((h) => h.product)),
    contrast: modal(headers.map((h) => h.contrast)),
    style: modal(headers.map((h) => h.style)),
    colorwayCount: Number(modal(counts) || 0),
    fabric: fabricRaw ? parseFabric(fabricRaw) : structuredClone(EMPTY_HEADER.fabric),
    client: modal(headers.map((h) => h.client)),
  }
}
