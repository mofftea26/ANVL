import {
  boxRight,
  clusterRows,
  joinRow,
  median,
  toPlacedText,
  unionBox,
  PAGE_BODY_BOTTOM,
  PAGE_BODY_TOP,
  type Box,
  type PlacedText,
} from '../geometry'
import { normalizeKey, parseNumber, parseSpi, parseStitchCode, splitSupplierRef } from '../normalize'
import { isStrippedText } from '../strip'
import type { PageParser } from '../parserContext'
import type { TechpackPageExtract } from '../pdfTypes'
import type { TechpackSeam, TechpackTechnical } from '../../schema/techpack.zod'

/**
 * TECHNICAL SHEET — the dimensioned flat, ringed with leader-line callouts
 * describing seams, stitch classes and finishes.
 *
 * The page must be read as COLUMNS, not rows. Callouts ring a central drawing
 * at many different x positions, so one visual "row" routinely holds two
 * unrelated callouts plus a sheet note; reading rows welds them into a single
 * sentence. Each callout is also set over SEVERAL STACKED LINES:
 *
 *     PLAIN SEAM W/ 15SPI S/N 301 LOCKSTITCH - 1/4” STITCH LINE
 *     OFFSET W/ 512 4 THREAD OVERLOCK INNER FINISH
 *     (SSa [1.01.01]) (SEE DETAIL K)
 *
 * so a row read also truncates every callout mid-phrase and drops the ISO 4916
 * class onto the floor — which is why `code` came back empty on all five
 * supplied packs even though `parseStitchCode` works.
 *
 * This page carries BOTH halves of the disclosure split, which is why the
 * policy is field-level rather than page-level (see `techpackDisclosure.ts`):
 * - the construction callouts are the transparency story worth telling;
 * - the dimension figures scattered over the drawing are, collectively, close
 *   to a reproducible pattern, so they are extracted for the operator but
 *   never disclosed.
 */

/**
 * Where the repeated header block ends, as a fraction of page width.
 *
 * `bodyText`'s own 0.55 cut is too aggressive HERE: measured over the five
 * supplied packs, the leftmost callout in the header band starts at 0.5032 W
 * (`PLAIN SEAM …` at x=423.6–432.5), so a 0.55 cut sliced the first two words
 * off it and shipped `W/ 15SPI S/N 301 LOCKSTITCH …`. The header block's own
 * two columns never reach past 0.4952 W in any pack.
 *
 * That leaves only 0.008 W of clear air, so the x test alone is not enough and
 * a second, independent signal guards it — see {@link sheetBody}.
 */
const HEADER_BLOCK_RIGHT = 0.5
/** The right-aligned page title; mirrors `bodyText`'s own bound. */
const PAGE_TITLE_LEFT = 0.88

/**
 * Where one line breaks into separate cells, in LINE HEIGHTS.
 *
 * Measured over the five packs' technical sheets, the two populations are
 * cleanly separated with a wide empty band between them:
 * - gaps INSIDE a printed line (word spaces) top out at 4.9 pt, and sit at a
 *   constant 0.67–0.70 of their own face — 2.7 pt in the 4 pt callout face,
 *   4.8 pt in the 7 pt note face;
 * - the narrowest gap between two independently placed blocks sharing one
 *   clustered row is 37.7 pt (`… STATED` → `LINE OFFSET …` is 67.7 pt).
 *
 * 2.5 line heights is 10.0 pt against the measured 4.0 pt line height: 2.0x
 * above the widest word gap and 3.8x below the narrowest block gap.
 */
const CELL_GAP = 2.5

/**
 * How much two boxes must overlap horizontally to count as one column.
 *
 * A continuation line is always fully contained in the line above it across
 * the whole corpus (the blocks are right-aligned and indent as they go), so
 * every real pair measures 100%. Half is generous slack that still refuses the
 * left/right callout pairs, which do not overlap at all.
 */
const COLUMN_OVERLAP = 0.5

/**
 * How far below its predecessor a continuation line may sit, in LINE PITCHES.
 *
 * The pitch is measured off the page (see {@link linePitch}) rather than taken
 * from the font size: the packs print BOTH a 4.0 pt and a 3.3 pt callout face
 * on the same sheet, yet stack both at exactly 5.0 pt — a font-derived bound
 * would lose the small-face callouts' last line. Against that measured pitch
 * 1.5 yields 7.5 pt, which clears the 5.0 pt step between a callout's own
 * lines and still refuses the 9.6–9.7 pt breaks between stacked blocks.
 */
const MAX_LINE_STEP = 1.5
/** How far to look for the next line when measuring the pitch, in line heights. */
const PITCH_SEARCH_LINES = 3

/**
 * A callout ENDS at its cross-reference.
 *
 * This is the only reliable separator for two callouts printed back to back:
 * on the oversized packs one block's last line sits 4.0 pt below the previous
 * block's last line — CLOSER than the 5.0 pt pitch inside a block — so no
 * vertical rule can split them. Every one of the 40 callouts in the five packs
 * terminates with a `(SEE DETAIL x)` / `(SEE DETAIL x / GRAPHIC y)` reference,
 * so consuming one closes the callout.
 */
const CALLOUT_TERMINATOR = /\(\s*SEE\b|\bSEE\s+(?:DETAILS?|TRIMS?|GRAPHICS?|INDEX)\b/i

/**
 * The ISO class as PRINTED, brackets and all — `(SSa [1.01.01])`.
 *
 * Two copies on purpose: a `/g` regex carries `lastIndex` across calls, so the
 * same object cannot safely be used for both `replace` and `test`.
 */
const PRINTED_STITCH_CODE_SOURCE = String.raw`\(?\s*\b[A-Z]{2,3}[a-z]?\s*\[\s*[\d.]+\s*\]\s*\)?`
const PRINTED_STITCH_CODE_ALL = new RegExp(PRINTED_STITCH_CODE_SOURCE, 'g')
const PRINTED_STITCH_CODE = new RegExp(PRINTED_STITCH_CODE_SOURCE)

/**
 * A callout mentions a seam, a stitch, or a finish.
 *
 * The long terms deliberately carry no LEFT word boundary. pdf.js emits a
 * letter-spaced phrase as ONE item, so `W E F T K N I T` reaches us welded
 * into `WEFTKNIT` and the word break is unrecoverable — there is no wider gap
 * anywhere in the source to read it back from. Requiring `\bKNIT\b` therefore
 * silently dropped a real `SINGLE JERSEY WEFT KNIT TEXTILE CONSTRUCTION`
 * callout from three of the five packs. `HEM` and `TAPE` keep their left
 * boundary: they are short enough to hide inside ordinary words (`THEM`).
 */
const SEAM_TERMS =
  /(SEAM|STITCH|LOCKSTITCH|OVERLOCK|COVER\s*SEAMING|BLINDSTITCH|FINISH|KNIT|BINDING)\b|\b(HEM|TAPE)\b/i
/** Sheet-wide prose that is not a callout and must never be welded into one. */
const SHEET_NOTE = /^(?:NOTE\b|ALL\s+MEASUREMENTS\b|PLEASE\s+USE\b|SCALE\s*:)/i
/** Bare numbers scattered across the drawing are dimensions, not prose. */
const BARE_DIMENSION = /^[\d.\s"”]+$/
const MIN_CALLOUT_CHARS = 12

/** One visually separate run of text — a line of a callout, a note, a figure. */
interface Cell {
  /**
   * ORIGINAL case. ISO 4916 classes are case-significant (`SSa`, not `SSA`),
   * and `SSA [1.01.01]` is not a class anyone can look up.
   */
  text: string
  /**
   * The individual runs the cell was assembled from.
   *
   * Kept only for the dimension figures: a strip of them along one edge of the
   * flat sits closer together than a column break — and their leader-line
   * boxes can even OVERLAP — so they arrive as one cell whose joined text
   * reads `2.75 2.3751.125`. Splitting that string loses two of three figures;
   * splitting the runs cannot, because each figure was printed as one run.
   */
  parts: string[]
  box: Box
}

interface Callout {
  cells: Cell[]
  /** Closed callouts no longer accept continuation lines. */
  open: boolean
}

/**
 * The sheet's working set: callouts, notes and dimensions, without the header
 * block, the page title or the `CLIENT:` footer.
 *
 * The header band is filtered on TWO independent signals because neither is
 * safe alone. Horizontally the header block and the callout column are only
 * 0.008 W apart, so a longer FABRIC line would leak into the callouts — and it
 * contains the word `KNIT`, so it would read as a construction callout.
 * Typographically the band is cleanly split: across all five packs every run
 * left of {@link HEADER_BLOCK_RIGHT} is set at 6, 7 or 14 pt and every callout
 * run at 3.3 or 4 pt, with nothing in between.
 */
function sheetBody(extract: TechpackPageExtract): PlacedText[] {
  const { width, height } = extract.viewport
  const all = toPlacedText(extract)
  const band = height * PAGE_BODY_TOP
  const headerRuns = all.filter(
    (item) => item.box.y <= band && item.box.x < width * HEADER_BLOCK_RIGHT,
  )
  // Infinity, not 0: a band with no header block at all must not reject every
  // callout on the page.
  const headerFace = median(headerRuns.map((item) => item.box.h)) || Infinity

  return all.filter((item) => {
    if (item.box.y >= height * PAGE_BODY_BOTTOM) return false
    if (item.box.y > band) return true
    return (
      item.box.x >= width * HEADER_BLOCK_RIGHT &&
      boxRight(item.box) <= width * PAGE_TITLE_LEFT &&
      item.box.h < headerFace
    )
  })
}

/** Split one clustered row into cells wherever the horizontal gap opens up. */
function segmentRow(row: readonly PlacedText[], maxGap: number): PlacedText[][] {
  const sorted = [...row].sort((a, b) => a.box.x - b.box.x)
  const out: PlacedText[][] = []
  let current: PlacedText[] = []
  for (const item of sorted) {
    const prev = current[current.length - 1]
    if (prev && item.box.x - boxRight(prev.box) > maxGap) {
      out.push(current)
      current = []
    }
    current.push(item)
  }
  if (current.length > 0) out.push(current)
  return out
}

/** Rows, then cells: the page as a set of independently placed text runs. */
function cellRows(items: readonly PlacedText[], maxGap: number): Cell[][] {
  const rows: Cell[][] = []
  for (const row of clusterRows(items)) {
    const cells: Cell[] = []
    for (const segment of segmentRow(row, maxGap)) {
      const box = unionBox(segment.map((i) => i.box))
      const text = joinRow(segment)
      if (box && text) cells.push({ text, parts: segment.map((i) => i.text), box })
    }
    if (cells.length > 0) rows.push(cells)
  }
  return rows
}

function sameColumn(a: Box, b: Box): boolean {
  const overlap = Math.min(boxRight(a), boxRight(b)) - Math.max(a.x, b.x)
  const narrower = Math.min(a.w, b.w)
  return narrower > 0 && overlap >= narrower * COLUMN_OVERLAP
}

/**
 * The vertical pitch between stacked lines, measured off this page.
 *
 * The MODE, not the median: a technical sheet is mostly dimension figures
 * scattered at arbitrary heights, and their spacing swamps a median (it comes
 * out at 7.0 pt against a true 5.0 pt pitch). Counting the nearest same-column
 * neighbour of every cell puts the real pitch at the top of the histogram by a
 * wide margin — 16 hits against 6 for the runner-up on the compression packs,
 * 11 against 3 on the oversized ones, and exactly 5.0 pt in all five.
 */
function linePitch(cells: readonly Cell[], lineHeight: number): number {
  const counts = new Map<number, number>()
  for (const cell of cells) {
    let nearest = Infinity
    for (const other of cells) {
      const step = other.box.y - cell.box.y
      if (step <= 0 || step > lineHeight * PITCH_SEARCH_LINES) continue
      if (!sameColumn(cell.box, other.box)) continue
      if (step < nearest) nearest = step
    }
    if (nearest === Infinity) continue
    const key = Math.round(nearest * 10) / 10
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  let best = 0
  let bestCount = 0
  for (const [step, count] of counts) {
    // Ties break to the TIGHTER step: over-estimating the pitch merges two
    // blocks, which is the failure this whole module exists to fix.
    if (count > bestCount || (count === bestCount && step < best)) {
      best = step
      bestCount = count
    }
  }
  return best || lineHeight
}

/** Stack each column's cells into the multi-line callouts they were set as. */
function buildCallouts(rows: readonly Cell[][], pitch: number): Callout[] {
  const maxStep = pitch * MAX_LINE_STEP
  const callouts: Callout[] = []

  for (const row of rows) {
    // One callout may take at most one cell per row: a wide callout can
    // column-overlap two cells of the same row, and appending both would weld
    // its neighbour's text onto it.
    const used = new Set<Callout>()
    for (const cell of row) {
      const owner = callouts.find((callout) => {
        if (!callout.open || used.has(callout)) return false
        const last = callout.cells[callout.cells.length - 1]
        if (!last) return false
        const step = cell.box.y - last.box.y
        return step > 0 && step <= maxStep && sameColumn(last.box, cell.box)
      })
      const target = owner ?? { cells: [], open: true }
      if (!owner) callouts.push(target)
      target.cells.push(cell)
      used.add(target)
      if (CALLOUT_TERMINATOR.test(cell.text)) target.open = false
    }
  }

  return callouts
}

export const parseTechnicalSheet: PageParser = (extract, ctx) => {
  const body = sheetBody(extract)
  // The 1 only guards a degenerate page whose runs all report zero height —
  // the real sheets give 4.0 here.
  const lineHeight = median(body.map((item) => item.box.h).filter((h) => h > 0)) || 1

  const seams: TechpackSeam[] = []
  const patternPieces: TechpackTechnical['patternPieces'] = []
  const notes: string[] = []
  let scale = ''
  let baseSize = ''

  /** Cells left once notes, dimensions and stripped supplier prose are out. */
  const calloutRows: Cell[][] = []
  for (const row of cellRows(body, lineHeight * CELL_GAP)) {
    const kept: Cell[] = []
    for (const cell of row) {
      const text = normalizeKey(cell.text)
      if (!text || isStrippedText(text)) continue

      if (SHEET_NOTE.test(text)) {
        notes.push(text)
        scale = /SCALE\s*:\s*([\d:]+)/i.exec(text)?.[1] ?? scale
        const size = /MEASUREMENTS\s+PROVIDED\s+ABOVE\s+ARE\s+FOR\s+A\s+SIZE\s+(\w[\w-]*)/i.exec(text)
        if (size?.[1]) baseSize = normalizeKey(size[1])
        continue
      }

      if (BARE_DIMENSION.test(text)) {
        // Internal-only: a dimension with no label is only useful next to the
        // drawing it came from, and collectively these approach a pattern.
        for (const part of cell.parts) {
          const value = parseNumber(part)
          if (value !== null) patternPieces.push({ label: '', value, unit: 'in' })
        }
        continue
      }

      kept.push(cell)
    }
    if (kept.length > 0) calloutRows.push(kept)
  }

  const pitch = linePitch(calloutRows.flat(), lineHeight)
  const accepted: string[] = []

  for (const callout of buildCallouts(calloutRows, pitch)) {
    const printed = callout.cells.map((cell) => cell.text).join(' ')
    if (normalizeKey(printed).length < MIN_CALLOUT_CHARS) continue
    if (!SEAM_TERMS.test(printed)) continue

    // Read the class off the PRINTED text, then take it out of the prose: it
    // is carried in `code`, and `(SSa [1.01.01])` reads as noise on a passport.
    const code = parseStitchCode(printed)
    const { text, supplierRef } = splitSupplierRef(
      code ? printed.replace(PRINTED_STITCH_CODE_ALL, ' ') : printed,
    )

    const key = text.toUpperCase()
    // Containment, not equality: a callout that was assembled short would
    // otherwise appear alongside the complete one as its own entry.
    if (!key || accepted.some((seen) => seen.includes(key))) continue
    accepted.push(key)
    seams.push({ text, code, spi: parseSpi(text), supplierRef })
  }

  const printsClasses = PRINTED_STITCH_CODE.test(body.map((item) => item.text).join(' '))
  if (seams.length === 0) {
    ctx.addIssue({
      page: extract.page,
      path: 'technical.seams',
      code: 'technical_no_seams',
      severity: 'info',
      message: 'No construction callouts were read from the technical sheet.',
    })
  } else if (printsClasses && seams.every((seam) => !seam.code)) {
    // The sheet printed ISO classes and not one reached a seam — the callouts
    // were assembled, but wrongly. This is the exact failure the column read
    // replaced, so it is worth saying out loud rather than shipping quietly.
    ctx.addIssue({
      page: extract.page,
      path: 'technical.seams',
      code: 'technical_stitch_codes_lost',
      severity: 'warn',
      message:
        'This technical sheet prints ISO seam classes, but none could be attached to a callout.',
    })
  }

  const technical: TechpackTechnical = { seams, patternPieces, notes, scale, baseSize }
  return { technical }
}
