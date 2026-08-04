import {
  bodyText,
  boxBottom,
  boxCenter,
  boxRight,
  clusterRows,
  joinRow,
  median,
  unionBox,
} from '../geometry'
import type { Box, PlacedText } from '../geometry'
import { normalizeKey, normalizeSpaces } from '../normalize'
import { rankGarmentFlat } from '../pdfImages'
import type { PageParser } from '../parserContext'
import type { TechpackPackaging } from '../../schema/techpack.zod'

/**
 * PACKAGING AND LABELS — the care/brand label and the size label.
 *
 * This is the highest-value page for the passport: the care label is the
 * legally-printed truth about how to look after the garment, and "Designed in
 * <country>" is the origin line.
 *
 * It is also where the two supplied packs diverge most sharply. The cotton
 * pack sets its care label as real text, so every line reads straight off the
 * page. The seamless pack heat-transfers a PRINTED label, so the same
 * information exists only as artwork with no text layer at all.
 *
 * That is what `textAvailable` records. Reporting "no lines" honestly lets the
 * import block and the review queue ask a human (or the vision pass) for them,
 * instead of quietly publishing an empty care section.
 *
 * The care label is read as a COLUMN, not as page rows. The page prints the
 * size label beside it and dimension callouts around it, all at the same
 * heights: on `oversized-may20-final` page 13 the label sits in x 64.6–112.0
 * while a `0.65”` size callout sits at x 427.2, and a whole-page row join
 * welded the two into `100% COTTON 0.65”`. Worse, a page row is one PRINTED
 * line, so `WASH DARK COLORS` / `SEPARATELY` arrived as two rows and the
 * second — carrying no care word of its own — was dropped as noise.
 */

/** Phrases that only appear on a garment care label. */
const CARE_TERMS =
  /\b(WASH|IRON|TUMBLE|DRY\s*CLEAN|BLEACH|DETERGENT|RESHAPE|DO\s+NOT|COOL|WARM|HAND\s*WASH|LINE\s+DRY|COTTON|POLYESTER|NYLON|SPANDEX|ELASTANE)\b/i
/** A composition line is itself a care-label line. */
const COMPOSITION_LINE = /^\d{1,3}\s*%\s*[A-Z]/i
const MIN_CARE_LINES = 3
const SIZE_TOKENS = /^(XXS|XS|S|M|L|XL|XXL|XXXL)$/

/** Lines that are page furniture rather than label copy. */
const NOT_CARE_COPY =
  /(LABEL|PLACEMENT|VISIBLE|SEWN|ATTACHE?D|FOLD|SEW\s+HERE|SIZE\s*:|PRINT\s+AREA|BRANDING|APPLICATION|TRIM\s+BASE|CLIENT|PRODUCT|CONTRAST|STYLE|COLOU?RWAYS?|FABRIC|PACKAGING)/i

/** The bare dash the label prints between two instructions. */
const CARE_SEPARATOR = /^[-–—]+$/

/** Inch marks are typographic on these packs (`1.875”X1.25”`), not `"`. */
const VISIBLE_SIZE = /(\d+(?:\.\d+)?\s*["”″]\s*[xX×]\s*\d+(?:\.\d+)?\s*["”″])/

const ORIGIN_ANCHOR = /\bDESIGNED\s+IN\b\s*(.*)$/i
/** A country name — deliberately not a code, a measurement or a sentence. */
const ORIGIN_VALUE = /^[A-Za-z][A-Za-z .'-]{1,39}$/

/**
 * How far a run's height may stray from the label's own type size.
 *
 * Every run inside the care block is set at exactly one size in all five
 * supplied packs (3.5 pt on the cotton packs, 3.6 pt on the seamless one) and
 * the next-smallest text on the same page is 5.0 pt, so ±25% separates the
 * label from its neighbours with room to spare.
 */
const TYPE_SIZE_TOLERANCE = 0.25

/** True for a run that could only have come off a care label. */
function isCareStatement(text: string): boolean {
  if (NOT_CARE_COPY.test(text)) return false
  return CARE_TERMS.test(text) || COMPOSITION_LINE.test(text)
}

/**
 * Locate the care label's column and return every run printed inside it.
 *
 * Two passes, because a wrapped line has no care word to recognise it by:
 * seeded runs (`DO NOT TUMBLE DRY`, `100% COTTON`) fix WHERE the label is, then
 * the block is re-read purely geometrically so `SEPARATELY`, `DAMP`,
 * `DECORATION` and the `-` separators come back with it.
 *
 * Columns are grown by horizontal OVERLAP rather than a shared centre: it
 * costs nothing, and it holds for a left-aligned label as well as the centred
 * one these packs print. Measured on page 13 of `oversized-may20-final`, all
 * nine seeds span x 64.6–112.0 and every other run on the page starts at
 * x ≥ 149, so nothing outside the label can join the chain.
 */
function findCareColumn(items: readonly PlacedText[]): PlacedText[] {
  const seeds = items.filter((item) => isCareStatement(normalizeKey(item.text)))
  if (seeds.length < MIN_CARE_LINES) return []

  const columns: PlacedText[][] = []
  let right = -Infinity
  for (const seed of [...seeds].sort((a, b) => a.box.x - b.box.x)) {
    const current = columns[columns.length - 1]
    if (current && seed.box.x <= right) current.push(seed)
    else columns.push([seed])
    right = Math.max(right, boxRight(seed.box))
  }

  // Reducing without an initial value is safe: MIN_CARE_LINES seeds reached
  // this line, so at least one column exists.
  const best = columns.reduce((a, b) => (b.length > a.length ? b : a))
  if (best.length < MIN_CARE_LINES) return []

  const box = unionBox(best.map((item) => item.box))
  if (!box) return []
  const typeSize = median(best.map((item) => item.box.h)) || box.h
  // Two lines of slack at each end so a wrap on the first or last instruction
  // still comes back; the printed line pitch is ~1.3× the type size.
  const reach = typeSize * 2
  const top = box.y - reach
  const bottom = boxBottom(box) + reach

  return items.filter((item) => {
    const cx = boxCenter(item.box).x
    if (cx < box.x || cx > boxRight(box)) return false
    if (Math.abs(item.box.h - typeSize) > typeSize * TYPE_SIZE_TOLERANCE) return false
    return item.box.y >= top && boxBottom(item.box) <= bottom
  })
}

/**
 * Fold the column's printed rows into the instructions they spell out.
 *
 * The label separates instructions with a bare `-`, so everything between two
 * dashes is ONE instruction however many lines it wraps over — which is how
 * `WASH DARK COLORS` + `SEPARATELY` becomes a single line again.
 *
 * Without that separator there is no way to tell a wrap from the next
 * instruction, so each row is left standing alone rather than guessed at.
 */
function foldWrappedLines(rows: readonly string[]): string[] {
  if (!rows.some((row) => CARE_SEPARATOR.test(row))) return [...rows]

  const out: string[] = []
  let block: string[] = []
  const flush = (): void => {
    const text = normalizeSpaces(block.join(' '))
    if (text) out.push(text)
    block = []
  }

  for (const row of rows) {
    if (CARE_SEPARATOR.test(row)) {
      flush()
      continue
    }
    // A percentage opens a new fibre statement: the composition block prints
    // `95% COTTON` / `5% SPANDEX` on two lines with no dash between them.
    if (block.length > 0 && COMPOSITION_LINE.test(row)) flush()
    block.push(row)
  }
  flush()

  return out
}

/**
 * The country under "Designed in".
 *
 * The phrase wraps on the real label — `Designed in` and `Lebanon` are two
 * runs 1 pt apart vertically — and the whole block is printed twice side by
 * side, so a regex over joined page rows reads `Designed in Designed`. Taking
 * the run directly beneath the anchor, in the anchor's own column, reads the
 * label the way it is set.
 */
function readOrigin(items: readonly PlacedText[]): string {
  const byTop = [...items].sort((a, b) => a.box.y - b.box.y)

  for (const anchor of byTop) {
    const match = ORIGIN_ANCHOR.exec(anchor.text)
    if (!match) continue

    const inline = normalizeSpaces(match[1] ?? '')
    if (ORIGIN_VALUE.test(inline)) return inline

    const anchorBottom = boxBottom(anchor.box)
    for (const item of byTop) {
      if (item === anchor) continue
      // A quarter of a line of tolerance absorbs baseline jitter between the
      // anchor's descenders and the next line's cap height.
      if (item.box.y < anchorBottom - anchor.box.h * 0.25) continue
      if (item.box.y > anchorBottom + anchor.box.h * 2) break
      if (item.box.x > boxRight(anchor.box) || boxRight(item.box) < anchor.box.x) continue
      const value = normalizeSpaces(item.text)
      if (ORIGIN_VALUE.test(value)) return value
    }
  }

  return ''
}

/**
 * The two printed "visible" dimensions: the care label's and the size label's.
 *
 * Reading order alone cannot tell them apart — the cotton pack prints the care
 * dimension first, the seamless pack prints the size one first — so the care
 * value is the one whose run shares x with the care column, and the size value
 * is simply the first that is not it.
 */
function readVisibleSizes(
  items: readonly PlacedText[],
  column: Box | null,
  joined: string,
): { care: string; size: string } {
  const found: Array<{ value: string; inColumn: boolean }> = []
  for (const item of [...items].sort((a, b) => a.box.y - b.box.y || a.box.x - b.box.x)) {
    const match = VISIBLE_SIZE.exec(item.text)
    if (!match) continue
    found.push({
      value: normalizeSpaces(match[1] ?? ''),
      inColumn:
        column !== null && item.box.x <= boxRight(column) && boxRight(item.box) >= column.x,
    })
  }
  // Fallback for a producer that splits the dimension across runs: the pair is
  // one run in all five supplied packs, but the joined text still finds it.
  if (found.length === 0) {
    const value = VISIBLE_SIZE.exec(joined)?.[1] ?? ''
    return { care: normalizeSpaces(value), size: '' }
  }

  const care = (found.find((entry) => entry.inColumn) ?? found[0])?.value ?? ''
  return { care, size: found.find((entry) => entry.value !== care)?.value ?? '' }
}

export const parsePackaging: PageParser = (extract, ctx) => {
  const items = bodyText(extract)
  const lines = clusterRows(items)
    .map((row) => normalizeSpaces(joinRow(row)))
    .filter(Boolean)
  const joined = lines.join(' ')

  const column = findCareColumn(items)
  const columnBox = column.length > 0 ? unionBox(column.map((item) => item.box)) : null
  const columnRows = clusterRows(column)
    .map((row) => normalizeKey(joinRow(row)))
    .filter(Boolean)
  const careLines = [...new Set(foldWrappedLines(columnRows))]

  const sizes = [
    ...new Set(
      lines
        .flatMap((line) => line.split(/\s+/))
        .map((token) => normalizeKey(token))
        .filter((token) => SIZE_TOKENS.test(token)),
    ),
  ]

  const visible = readVisibleSizes(items, columnBox, joined)
  const imageKey = rankGarmentFlat(extract.images, extract.viewport)

  const textAvailable = careLines.length >= MIN_CARE_LINES
  if (!textAvailable) {
    ctx.addIssue({
      page: extract.page,
      path: 'packaging.careLabel.lines',
      code: 'care_label_image_only',
      severity: 'warn',
      message:
        'The care label on this page is artwork with no text layer — its wording must be read from the image or entered by hand.',
    })
  }

  const packaging: TechpackPackaging = {
    careLabel: {
      textAvailable,
      lines: careLines,
      origin: readOrigin(items),
      visibleSize: visible.care,
      imageId: imageKey ? ctx.imageId(extract.page, imageKey) : '',
    },
    sizeLabel: {
      visibleSize: visible.size,
      placement: /SEWN\s+INSIDE\s+GARMENT[^|.]*/i.exec(joined)?.[0]?.trim() ?? '',
      sizes,
      imageId: '',
    },
  }

  return { packaging }
}
