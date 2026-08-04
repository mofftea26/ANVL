import {
  assignToColumn,
  bodyText,
  boxCenter,
  boxRight,
  buildColumnGrid,
  clusterRows,
  joinRow,
  unionBox,
  type Box,
  type PlacedText,
} from '../geometry'
import { normalizeKey, normalizeSpaces, slugifyRole, splitSupplierRef } from '../normalize'
import { readColorCell } from './colorCell'
import type { PageParser } from '../parserContext'
import type { TechpackPageExtract } from '../pdfTypes'
import type { TechpackSwatch } from '../../schema/techpack.zod'

/**
 * COLOR SWATCHES — the colorway x colour-role matrix.
 *
 * The page the `INDEX`/`TRIM`/`GRAPHIC` codes on the other reference pages
 * point at: one row band per colorway, one column per colour role, and in each
 * cell a Pantone code, a colour name and an sRGB triplet.
 */

const COLORWAY_HEADER = /^COLOU?RWAY$/
/** Runs that can only be colour data — used to find where the matrix starts. */
const COLOR_VALUE = /^\d{2}-\d{4}$|^T[CP][XG]$|^SRGB$/i
const COLORWAY_NUMBER = /^\d{1,2}$/

/**
 * Pure nearest-column assignment, no rejection.
 *
 * The matrix carries no stray annotation between its columns — every run below
 * the header belongs to a cell — and its widest legitimate drift is the trailing
 * `C` of `PROCESS BLACK C`, whose centre sits 30.5pt from a column centre on a
 * 77.75pt pitch (0.39 of a column). The library default of 0.35 would drop it.
 */
const GRID_DRIFT = 0.5

/** Merge header cells that share a column: they overlap horizontally. */
function overlapColumns(items: readonly PlacedText[]): Box[] {
  const columns: Box[] = []
  for (const item of [...items].sort((a, b) => a.box.x - b.box.x)) {
    const last = columns[columns.length - 1]
    if (last && item.box.x <= boxRight(last)) {
      columns[columns.length - 1] = unionBox([last, item.box]) ?? last
      continue
    }
    columns.push(item.box)
  }
  return columns
}

/**
 * Drop runs printed on top of one another, keeping the covering run.
 *
 * Both compression packs overprint their first column header, and joining the
 * row naively welds the two strings together. The final pack carries the
 * template's `MAIN` (x 121.1–148.0) inside its own `MAIN 1` (x 118.0–151.1),
 * yielding `MAIN 1MAIN`; the first pack stamps `MAIN` twice at the identical
 * box, yielding `MAINMAIN`. Covering-run-wins handles both, and header cells
 * never legitimately nest inside one another within a row.
 */
function dropOverprints(row: readonly PlacedText[]): PlacedText[] {
  const covers = (outer: PlacedText, inner: PlacedText): boolean =>
    outer.box.x <= inner.box.x && boxRight(outer.box) >= boxRight(inner.box)

  const kept: PlacedText[] = []
  for (const item of row) {
    if (kept.some((other) => covers(other, item))) continue
    for (let i = kept.length - 1; i >= 0; i -= 1) {
      const other = kept[i]
      if (other && covers(item, other)) kept.splice(i, 1)
    }
    kept.push(item)
  }
  return kept
}

/** The stacked header cells of one column, read as a single role label. */
function columnLabel(column: Box, headers: readonly PlacedText[]): string {
  const cells = headers.filter(
    (header) => header.box.x <= boxRight(column) && boxRight(header.box) >= column.x,
  )
  const text = clusterRows(cells)
    .map((row) => joinRow(dropOverprints(row)))
    .join(' ')
  // `PRINT (SEE INDEX A)` is a role plus a cross-reference; the compression
  // pack's `PRINT (INDEX A)` / `PRINT (INDEX B)` is a role that NEEDS its
  // bracket to stay unique, and `splitSupplierRef` only takes `(SEE …)`.
  return splitSupplierRef(normalizeKey(text)).text
}

interface CellBucket {
  colorwayIndex: number
  column: number
  items: PlacedText[]
}

function nearestNumber(numbers: readonly PlacedText[], y: number): PlacedText | null {
  let best: PlacedText | null = null
  let bestDelta = Infinity
  for (const number of numbers) {
    const delta = Math.abs(boxCenter(number.box).y - y)
    if (delta < bestDelta) {
      bestDelta = delta
      best = number
    }
  }
  return best
}

/**
 * Read the matrix as a 2D GRID.
 *
 * Row-wise reading cannot work here, and not for a subtle reason: each cell
 * stacks three lines and the colorway number is set beside the MIDDLE one,
 * 4.4pt below the name row's centre and 1.4pt above the sRGB row's.
 * `clusterRows` therefore files the number with the sRGB line, and a row-wise
 * parser reports `colorName: "(48/46/44)"` with no role and no Pantone — which
 * is exactly what it did.
 *
 * The grid is measured, not assumed:
 * - column centres come from the header cells, which stack (`PRINT` over
 *   `(SEE INDEX A)`) and so share a centre to within 0.05pt; merging them by
 *   horizontal overlap is unambiguous because adjacent columns clear each other
 *   by 2.1pt at the tightest;
 * - the resulting pitch is a uniform 77.75pt in both packs;
 * - each band is claimed by its printed number, the nearest of which is 2.4x
 *   closer than any other for every line of the matrix (10.1pt vs 24.1pt at the
 *   worst).
 */
function readSwatchMatrix(extract: TechpackPageExtract): TechpackSwatch[] {
  const body = bodyText(extract)
  const anchor = body.find((item) => COLORWAY_HEADER.test(normalizeKey(item.text)))
  if (!anchor) return []

  const values = body.filter((item) => COLOR_VALUE.test(item.text))
  if (values.length === 0) return []
  const matrixTop = Math.min(...values.map((item) => item.box.y))

  // The header band runs from just above the COLORWAY cell down to the first
  // colour value. The section title ("COLORWAY SCHEDULE COLOR COMBINATIONS:")
  // must stay out of it: it is one 384pt run whose centre lands inside the
  // PRINT column and would fuse three columns into one. It sits 34pt higher —
  // twice the COLORWAY cell's height, which is where the window starts.
  const headers = body.filter(
    (item) => item.box.y >= anchor.box.y - anchor.box.h * 2 && item.box.y < matrixTop,
  )
  const columns = overlapColumns(headers)
  if (columns.length < 2) return []

  const grid = buildColumnGrid(columns.map((box) => ({ box })))
  const roleKeys = columns.map((column) => slugifyRole(columnLabel(column, headers)))

  const matrix = body.filter((item) => item.box.y >= matrixTop)
  const numbers = matrix.filter(
    (item) => COLORWAY_NUMBER.test(item.text) && assignToColumn(item.box, grid, GRID_DRIFT) === 0,
  )
  if (numbers.length === 0) return []

  const cells = new Map<string, CellBucket>()
  for (const item of matrix) {
    const column = assignToColumn(item.box, grid, GRID_DRIFT)
    // Column 0 holds the colorway numbers themselves, never a colour.
    if (column === null || column === 0) continue
    const band = nearestNumber(numbers, boxCenter(item.box).y)
    if (!band) continue
    const colorwayIndex = Number(band.text) || 0
    const key = `${colorwayIndex}:${column}`
    const bucket = cells.get(key) ?? { colorwayIndex, column, items: [] }
    bucket.items.push(item)
    cells.set(key, bucket)
  }

  return [...cells.values()]
    .sort((a, b) => a.colorwayIndex - b.colorwayIndex || a.column - b.column)
    .flatMap((bucket) => {
      const cell = readColorCell(
        clusterRows(bucket.items).map((row) => normalizeSpaces(joinRow(row))),
      )
      if (!cell.colorName && !cell.pantone && !cell.hex) return []
      return [
        { colorwayIndex: bucket.colorwayIndex, roleKey: roleKeys[bucket.column] ?? '', ...cell },
      ]
    })
}

/** COLOR SWATCHES — the colorway x colour-role matrix. */
export const parseColorSwatches: PageParser = (extract, ctx) => {
  const swatches = readSwatchMatrix(extract)

  if (swatches.length === 0) {
    ctx.addIssue({
      page: extract.page,
      path: 'swatches',
      code: 'swatches_not_read',
      severity: 'info',
      message: 'The colour-swatch matrix could not be read; colorway pages remain the source.',
    })
    return {}
  }

  return { swatches }
}
