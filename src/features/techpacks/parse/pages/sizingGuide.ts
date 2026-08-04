import { SIZE_TABLE_ROW_KEYS, type SizeTableRowKey } from '@/features/cms/support/supportContent.size.zod'

import {
  assignToColumn,
  boxCenter,
  boxRight,
  buildColumnGrid,
  clusterRows,
  imagePlacementBox,
  joinRow,
  pageBoxToImagePercent,
  bodyText,
  type Box,
  type PlacedText,
} from '../geometry'
import { normalizeKey, parseNumber } from '../normalize'
import type { TechpackPageExtract } from '../pdfTypes'
import { rankGarmentFlat } from '../pdfImages'
import type { PageParser, TechpackParseContext } from '../parserContext'
import type { TechpackSizing, TechpackSizingRow } from '../../schema/techpack.zod'

/**
 * The SIZING GUIDE page: a graded measurement table beside a diagram whose
 * `A`–`G` markers show where each measurement is taken.
 *
 * This page is the reason the whole parser is coordinate-driven. Read as text
 * lines, the supplied tables come out MISALIGNED — a row's label wraps onto a
 * second line and the values sit on whichever of the two lines the layout
 * happened to use, so a naive reader shifts entire rows by one and produces a
 * size chart that is wrong but completely plausible.
 *
 * The fix is to treat labels and values as two independent columns and match
 * them by vertical overlap, then verify the result with a monotonicity check.
 */

const SIZE_HEADING = /^(?:X{0,2}-?\s*)?(?:SMALL|MEDIUM|LARGE|S|M|L|XS|XL|XXL)$/i
const MIN_SIZE_COLUMNS = 2
const MIN_VALUES_PER_ROW = 2

/** Explicit, never fuzzy: a wrong row mapping silently corrupts a public chart. */
const ROW_KEY_PATTERNS: ReadonlyArray<{ re: RegExp; key: SizeTableRowKey }> = [
  { re: /^CB\s+LENGTH|^BODY\s+LENGTH|^LENGTH\b/, key: 'length' },
  { re: /^CHEST\b/, key: 'chest' },
  { re: /^WAIST\b/, key: 'waist' },
  { re: /^BOTTOM\b|^HEM\b/, key: 'bottom' },
  { re: /^COLLAR\b|^NECK\b/, key: 'collar' },
  { re: /^SLEEVE\b/, key: 'sleeve' },
  { re: /^CUFF\b/, key: 'cuff' },
]

/** Plausibility bounds in inches — a garment measurement outside these is a misread. */
const MIN_PLAUSIBLE_IN = 3
const MAX_PLAUSIBLE_IN = 70

function resolveRowKey(label: string): SizeTableRowKey | null {
  for (const { re, key } of ROW_KEY_PATTERNS) {
    if (re.test(label)) return key
  }
  return null
}

/**
 * Attach the label column to the value rows.
 *
 * The naive approach — merge label lines that sit close together, then match
 * blocks to value rows — cannot work: the gap between the two lines of one
 * wrapped label and the gap to the NEXT label are both roughly a line high, so
 * no threshold separates them and every label collapses into one block.
 *
 * The value rows are the reliable anchor instead. There is exactly one per
 * measurement, they are unambiguous (two or more numbers in a row), and each
 * label line simply belongs to whichever value row it sits nearest. That holds
 * however the label wraps, and — critically — whether the numbers were printed
 * beside the label's first line or its second.
 */
function labelsByValueRow(
  labelItems: readonly PlacedText[],
  valueRowCenters: readonly number[],
): string[] {
  const buckets: PlacedText[][] = valueRowCenters.map(() => [])
  if (valueRowCenters.length === 0) return []

  for (const row of clusterRows(labelItems)) {
    const centre = boxCenter(row[0]!.box).y
    let nearest = 0
    let nearestDistance = Infinity
    valueRowCenters.forEach((valueCentre, i) => {
      const distance = Math.abs(centre - valueCentre)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearest = i
      }
    })
    buckets[nearest]!.push(...row)
  }

  return buckets.map((items) =>
    clusterRows(items)
      .map((row) => joinRow(row))
      .join(' ')
      .trim(),
  )
}

/** `CHEST 1/2 WIDTH - B` → label, marker letter, half-measurement flag. */
function parseLabel(raw: string): { label: string; letter: string; isHalf: boolean } {
  const text = normalizeKey(raw)
  const match = /^(.*?)\s*-\s*([A-Z])\s*$/.exec(text)
  const label = normalizeKey(match?.[1] ?? text)
  return {
    label,
    letter: match?.[2] ?? '',
    isHalf: /\b1\s*\/\s*2\b|\bHALF\b/.test(label),
  }
}

/**
 * The drift canary.
 *
 * A graded size run always increases from S to XL. If a row does not, the
 * values almost certainly belong to a neighbouring row — which is exactly the
 * failure this page invites. Flagging beats silently publishing it.
 */
function checkMonotonic(
  row: TechpackSizingRow,
  page: number,
  ctx: TechpackParseContext,
): void {
  const values = row.values.filter((v): v is number => v !== null)
  for (let i = 1; i < values.length; i += 1) {
    if ((values[i] ?? 0) < (values[i - 1] ?? 0)) {
      ctx.addIssue({
        page,
        path: `sizing.rows.${row.rowKey ?? row.label}`,
        code: 'sizing_row_not_monotonic',
        severity: 'warn',
        message: `"${row.label}" does not increase across sizes (${values.join(', ')}) — the row may have picked up a neighbour's values.`,
      })
      return
    }
  }
}

export const parseSizingGuide: PageParser = (extract, ctx) => {
  const placed = bodyText(extract)
  const rows = clusterRows(placed)

  const headerRow = rows.find(
    (row) => row.filter((i) => SIZE_HEADING.test(i.text)).length >= MIN_SIZE_COLUMNS,
  )
  if (!headerRow) {
    ctx.addIssue({
      page: extract.page,
      path: 'sizing',
      code: 'sizing_header_not_found',
      severity: 'error',
      message: 'No size column headings found — the measurement table was not read.',
    })
    return {}
  }

  const sizeCells = headerRow.filter((i) => SIZE_HEADING.test(i.text))
  const grid = buildColumnGrid(sizeCells)
  const tableLeft = (grid.centers[0] ?? 0) - grid.width * 0.6
  const tableRight = (grid.centers[grid.centers.length - 1] ?? 0) + grid.width * 0.7
  const headerBottom = Math.max(...headerRow.map((i) => i.box.y + i.box.h))

  const below = placed.filter((i) => i.box.y > headerBottom)
  const labelItems = below.filter((i) => boxRight(i.box) <= tableLeft)
  const valueItems = below.filter((i) => i.box.x > tableLeft && i.box.x < tableRight)

  const valueRows = clusterRows(valueItems)
    .map((row) => row.filter((i) => parseNumber(i.text) !== null))
    .filter((row) => row.length >= MIN_VALUES_PER_ROW)

  const rowLabels = labelsByValueRow(
    labelItems,
    valueRows.map((row) => boxCenter(row[0]!.box).y),
  )

  const sizingRows: TechpackSizingRow[] = []

  for (const [rowIndex, numeric] of valueRows.entries()) {
    const { label, letter, isHalf } = parseLabel(rowLabels[rowIndex] ?? '')
    if (!label || label === 'MEASUREMENT') continue

    const values: Array<number | null> = grid.centers.map(() => null)
    for (const cell of numeric) {
      const column = assignToColumn(cell.box, grid)
      if (column === null) {
        ctx.addIssue({
          page: extract.page,
          path: `sizing.rows.${label}`,
          code: 'sizing_cell_unassigned',
          severity: 'warn',
          message: `Value "${cell.text}" in "${label}" did not line up with any size column.`,
        })
        continue
      }
      const value = parseNumber(cell.text)
      if (value === null) continue

      if (values[column] !== null) {
        // Two values landing in one cell means the geometry has gone wrong.
        // Keeping the leftmost and saying so beats silently overwriting.
        ctx.addIssue({
          page: extract.page,
          path: `sizing.rows.${label}`,
          code: 'sizing_cell_collision',
          severity: 'warn',
          message: `Two values competed for one cell in "${label}" — kept ${String(values[column])}, dropped ${cell.text}.`,
        })
        continue
      }
      if (value < MIN_PLAUSIBLE_IN || value > MAX_PLAUSIBLE_IN) {
        ctx.addIssue({
          page: extract.page,
          path: `sizing.rows.${label}`,
          code: 'sizing_value_implausible',
          severity: 'warn',
          message: `"${label}" has an implausible measurement of ${value}in.`,
        })
      }
      values[column] = value
    }

    const rowKey = resolveRowKey(label)
    if (!rowKey) {
      ctx.addIssue({
        page: extract.page,
        path: `sizing.rows.${label}`,
        code: 'sizing_row_unmapped',
        severity: 'info',
        message: `"${label}" has no matching row in the site size chart — it will not be imported.`,
      })
    }

    const sizingRow: TechpackSizingRow = { letter, label, rowKey, isHalf, values }
    checkMonotonic(sizingRow, extract.page, ctx)
    sizingRows.push(sizingRow)
  }

  const diagramKey = rankGarmentFlat(extract.images, extract.viewport)

  const sizing: TechpackSizing = {
    unit: placed.some((i) => /INCH/i.test(i.text)) ? 'in' : 'cm',
    sizes: sizeCells.map((i) => normalizeKey(i.text)),
    rows: sizingRows,
    diagramImageId: diagramKey ? ctx.imageId(extract.page, diagramKey) : '',
    markers: collectMarkers(extract, ctx, tableRight, diagramKey),
  }

  if (sizingRows.length === 0) {
    ctx.addIssue({
      page: extract.page,
      path: 'sizing.rows',
      code: 'sizing_no_rows',
      severity: 'error',
      message: 'The measurement table was found but no rows could be read from it.',
    })
  }

  return { sizing }
}

/** `A`–`G` markers on the diagram, right of the table, as percent of the diagram. */
function collectMarkers(
  extract: TechpackPageExtract,
  ctx: TechpackParseContext,
  tableRight: number,
  diagramKey: string | null,
): TechpackSizing['markers'] {
  const placement = extract.images.find((i) => i.objectKey === diagramKey)
  if (!placement) return []

  const diagramBox: Box = imagePlacementBox(placement, extract.viewport.height)
  const byLetter = new Map<string, Array<{ x: number; y: number }>>()

  for (const item of bodyText(extract)) {
    if (!/^[A-G]$/.test(item.text)) continue
    if (boxRight(item.box) <= tableRight) continue
    const point = pageBoxToImagePercent(boxCenter(item.box), diagramBox)
    const existing = byLetter.get(item.text) ?? []
    existing.push(point)
    byLetter.set(item.text, existing)
  }

  if (byLetter.size === 0) {
    ctx.addIssue({
      page: extract.page,
      path: 'sizing.markers',
      code: 'sizing_markers_not_found',
      severity: 'info',
      message: 'No measurement-point markers were found on the sizing diagram.',
    })
  }

  return [...byLetter.entries()].map(([letter, positions]) => ({ letter, positions }))
}

/** Re-exported so the import mappers can assert the row vocabulary lines up. */
export const SIZING_ROW_KEYS = SIZE_TABLE_ROW_KEYS
