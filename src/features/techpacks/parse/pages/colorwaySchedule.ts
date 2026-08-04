import {
  bodyText,
  boxBottom,
  boxCenter,
  boxRight,
  clusterRows,
  joinRow,
  median,
  unionBox,
  PAGE_BODY_TOP,
  type Box,
  type PlacedText,
} from '../geometry'
import { parseColorwayIndex } from '../header'
import { normalizeKey, parsePantoneCode, parseSrgbHex, slugifyRole } from '../normalize'
import type { PageParser } from '../parserContext'
import type { TechpackColorRole, TechpackColorway } from '../../schema/techpack.zod'

/**
 * COLORWAY SCHEDULE — one page per colorway, carrying a row of colour blocks.
 *
 * Every block is the same rigid four-line stack, flush-left:
 *
 *     PANTONE COLOR CODE:      <- the anchor
 *     18-0202 TCX              <- the code, or "TCX NOT AVAILABLE"
 *     LAVA SMOKE               <- the colour name, or "SEE TRIM A"
 *     sRGB (94/96/100)
 *
 * and the ROLE that names the block is set in a smaller face immediately to
 * its left. The role is read as free text, never matched against a fixed
 * vocabulary: the supplied packs already disagree — `MAIN` vs `MAIN 1`/`MAIN
 * 2`, `GRAPHIC` vs `PRINT`, plus `SEAM` and `TRIM` — and a garment that
 * introduces a fifth term should still import cleanly rather than dropping a
 * colour on the floor.
 */

/**
 * Exclude the repeated `CLIENT: ANVL ATHLETICS` footer.
 *
 * Measured over all 65 pages of the five supplied packs: the footer LABEL's
 * box top sits at 0.9100 of page height (0.9117 on two pages) and its value at
 * 0.9382, so `bodyText`'s 0.92 default keeps the label — which is exactly how
 * `CLIENT` came to be printed as a colour name. The lowest real body content
 * anywhere in the corpus tops out at 0.8653, and on a colorway page the last
 * colour line ends at 0.283, so 0.88 sits in an empty band with room either
 * side. `header.ts` already calls the same boundary `FOOTER_BAND = 0.88`.
 */
const COLORWAY_BODY_BOTTOM = 0.88

/** The label that opens a colour block; every other line hangs off its position. */
const CODE_LABEL = /(PANTONE|COLORO)\s+COLOU?R\s+CODE\s*:/i

/**
 * A block's four lines are flush-left to within 0.1pt in every pack and the
 * nearest neighbouring block is 39pt away, so half a line height is a
 * generous-but-unambiguous "same column" test.
 */
const BLOCK_LEFT_TOLERANCE = 0.5

/**
 * How far below its anchor a block reaches, in LINE PITCHES.
 *
 * Four lines span three pitches, so 3.5 leaves half a line of slack. The
 * pitch is measured off the page rather than taken from the font size,
 * because that ratio is a producer's choice: the supplied packs set a 6pt
 * face on a 7pt pitch (1.17x), and a pack that leads its blocks more loosely
 * would silently lose its sRGB line to a font-derived bound. Against the
 * measured 7pt pitch this yields 24.5pt — comfortably clear of the 21.1pt a
 * real block occupies, and short of the 30.4pt between the two stacked banks
 * on the compression pack's page 1.
 */
const BLOCK_DEPTH_PITCHES = 3.5

/**
 * Runs inside one line sit at most 4.2pt apart; the closest two blocks come
 * within 39pt. Two line heights is 2.9x above the former and 3.3x below the
 * latter — the band between the two populations is empty.
 */
const CELL_GAP = 2

/**
 * Role labels are set smaller than block text — 3.7pt against 6.0pt in every
 * pack. That size difference is the only reliable separator: the label's
 * baseline falls BETWEEN the code and name lines, close enough that row
 * clustering welds it onto the colour name (`MAIN PROCESS BLACK C`).
 */
const ROLE_FONT = 0.8

/**
 * A role label sits to the LEFT of the block it names, 6.3–12.0pt clear of it
 * across the corpus. Four line heights bounds that at twice the widest
 * measured gap, so a block printed without a label is left unnamed rather than
 * stealing its neighbour's.
 */
const ROLE_GAP = 4

/** One visually separate run of text — a line of a block, or a role label. */
interface Cell {
  text: string
  box: Box
}

interface ColorBlock {
  left: number
  top: number
  bottom: number
  cells: Cell[]
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
function cellsOf(items: readonly PlacedText[], maxGap: number): Cell[] {
  const cells: Cell[] = []
  for (const row of clusterRows(items)) {
    for (const segment of segmentRow(row, maxGap)) {
      const box = unionBox(segment.map((i) => i.box))
      if (!box) continue
      cells.push({ text: normalizeKey(joinRow(segment)), box })
    }
  }
  return cells
}

/** The vertical pitch between printed lines, measured off this page. */
function rowPitch(cells: readonly Cell[], fallback: number): number {
  const tops = [...new Set(cells.map((cell) => Math.round(cell.box.y * 10) / 10))].sort(
    (a, b) => a - b,
  )
  const deltas: number[] = []
  for (let i = 1; i < tops.length; i += 1) deltas.push((tops[i] ?? 0) - (tops[i - 1] ?? 0))
  return median(deltas) || fallback
}

/**
 * Group cells into colour blocks, anchored on the `… COLOR CODE:` line.
 *
 * Anchoring on that label rather than on an x-column is what keeps the
 * compression pack's two STACKED banks apart: its GRAPHIC block sits directly
 * above a PRINT block at the same x, and a pure column read merges the two
 * into a single colour — losing one outright.
 */
function buildBlocks(cells: readonly Cell[], lineHeight: number): ColorBlock[] {
  const maxDepth = rowPitch(cells, lineHeight) * BLOCK_DEPTH_PITCHES
  const anchors = new Set(cells.filter((cell) => CODE_LABEL.test(cell.text)))
  const blocks = [...anchors].map<ColorBlock>((anchor) => ({
    left: anchor.box.x,
    top: anchor.box.y,
    bottom: boxBottom(anchor.box),
    cells: [anchor],
  }))

  for (const cell of cells) {
    if (anchors.has(cell)) continue
    let owner: ColorBlock | null = null
    for (const block of blocks) {
      if (Math.abs(cell.box.x - block.left) > lineHeight * BLOCK_LEFT_TOLERANCE) continue
      const depth = cell.box.y - block.top
      if (depth <= 0 || depth > maxDepth) continue
      // The LOWEST qualifying anchor owns the line, so a bank never reaches
      // past the bank beneath it.
      if (!owner || block.top > owner.top) owner = block
    }
    if (!owner) continue
    owner.cells.push(cell)
    owner.bottom = Math.max(owner.bottom, boxBottom(cell.box))
  }

  for (const block of blocks) block.cells.sort((a, b) => a.box.y - b.box.y)
  // Reading order: bank by bank, left to right. Blocks in one bank are drawn
  // on a shared baseline but their tops still differ in the second decimal
  // (the packs' sRGB line lands on 162.6 in three columns and 162.7 in the
  // fourth), and a raw `top` comparison lets that noise reorder the row — so
  // the band is quantised to a line height first.
  const band = (block: ColorBlock): number => Math.round(block.top / lineHeight)
  return blocks.sort((a, b) => band(a) - band(b) || a.left - b.left)
}

/** The nearest small-font label to the left of a block, level with it. */
function roleFor(block: ColorBlock, labels: readonly Cell[], lineHeight: number): string {
  let best: Cell | null = null
  for (const label of labels) {
    const gap = block.left - boxRight(label.box)
    if (gap < 0 || gap > lineHeight * ROLE_GAP) continue
    const centre = boxCenter(label.box).y
    if (centre < block.top || centre > block.bottom) continue
    if (!best || boxRight(label.box) > boxRight(best.box)) best = label
  }
  return best?.text ?? ''
}

/** Which of a block's lines is the colour name — by content, not by position. */
function isColorName(text: string): boolean {
  if (CODE_LABEL.test(text)) return false
  if (/^S?RGB/i.test(text)) return false
  if (/^\d{2}-\d{4}/.test(text)) return false
  // A cross-reference to another page of the pack, not a colour. Storing it
  // would print a supplier instruction on the storefront.
  if (/^SEE\b/i.test(text)) return false
  // Matched DE-SPACED: pdf.js welds kerning pairs inside a letter-spaced run,
  // so `TCX NOT AVAILABLE` reaches us as `TCX NOT AVA I L A B L E` — every
  // token short enough to collapse except `AVA`. Ignoring the spacing makes
  // the test indifferent to where the weld happened to land.
  if (/NOTAVAILABLE/i.test(text.replace(/\s+/g, ''))) return false
  return true
}

function colorNameOf(block: ColorBlock): string {
  return block.cells.find((cell) => isColorName(cell.text))?.text ?? ''
}

export const parseColorwaySchedule: PageParser = (extract, ctx) => {
  const body = bodyText(extract, PAGE_BODY_TOP, COLORWAY_BODY_BOTTOM)

  // An unreadable page falls through to the "no roles" issue below rather
  // than returning silently: the page WAS classified as a colour schedule, so
  // producing nothing from it is a fact a reviewer needs.
  // The 1 only guards a degenerate page whose runs all report zero height —
  // the real pages give 6.0 here.
  const lineHeight = median(body.map((item) => item.box.h)) || 1
  const cellGap = lineHeight * CELL_GAP
  const isLabel = (item: PlacedText): boolean => item.box.h < lineHeight * ROLE_FONT

  const blocks = buildBlocks(cellsOf(body.filter((i) => !isLabel(i)), cellGap), lineHeight)
  const labels = cellsOf(body.filter(isLabel), cellGap)

  const roles: TechpackColorRole[] = blocks.map((block) => {
    const text = block.cells.map((cell) => cell.text).join(' | ')
    const role = roleFor(block, labels, lineHeight)
    if (!role) {
      ctx.addIssue({
        page: extract.page,
        path: 'colorways',
        code: 'colorway_role_unlabelled',
        severity: 'warn',
        message: `A colour block on this page carries no role label: ${text}`,
      })
    }
    return {
      role,
      roleKey: slugifyRole(role),
      colorName: colorNameOf(block),
      pantone: /PANTONE/i.test(text) ? parsePantoneCode(text) : '',
      coloro: /COLORO/i.test(text) ? parsePantoneCode(text) : '',
      hex: parseSrgbHex(text),
      swatchImageId: '',
    }
  })

  if (roles.length === 0) {
    ctx.addIssue({
      page: extract.page,
      path: 'colorways',
      code: 'colorway_no_roles',
      severity: 'warn',
      message: 'No colour roles could be read from this colorway schedule.',
    })
    return {}
  }

  const colorway: TechpackColorway = {
    index: parseColorwayIndex(extract),
    // The colorway is named after its MAIN colour — `MAIN`, `MAIN 1`, `MAIN
    // BODY`; the hyphen check keeps an unrelated role starting "main…" out.
    name:
      roles.find((r) => r.roleKey === 'main' || r.roleKey.startsWith('main-'))?.colorName ?? '',
    roles,
  }

  return { colorways: [colorway] }
}
