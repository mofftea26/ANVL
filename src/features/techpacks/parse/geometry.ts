import { collapseLetterSpacing } from './normalize'
import type { ImagePlacement, TechpackPageExtract, TextItem } from './pdfTypes'

/**
 * Spatial primitives for the techpack parsers.
 *
 * A techpack page is a drawing, not a document: the same information appears
 * as a table, a callout beside a leader line, or a letter dropped onto an
 * illustration. Reading it by text order produces nonsense — the supplied
 * sizing tables literally drift a row that way. So every parser works from
 * coordinates, and this module owns the coordinate vocabulary.
 *
 * One rule underpins all of it: **convert to top-left space immediately.**
 * PDF user space has y growing upward; every parser here assumes CSS-style
 * top-left. Doing the flip once, at the boundary, removes an entire class of
 * silently-inverted-geometry bugs.
 */

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** Anything the clustering helpers can position. */
export interface Placed {
  readonly box: Box
}

/** A text run in top-left page space — the parsers' working unit. */
export interface PlacedText extends Placed {
  text: string
  fontSize: number
}

export interface Point {
  x: number
  y: number
}

/* --------------------------------------------------------------------------- *
 * Conversion
 * --------------------------------------------------------------------------- */

/**
 * Convert a pdf.js text item to a top-left box.
 *
 * `transform[4]`/`[5]` are the origin, but `[5]` is the BASELINE measured from
 * the page bottom, so the flip subtracts both the baseline and the glyph
 * height. Height falls back through `|d|` → reported height → `|a|` because
 * some producers leave one of them at zero.
 */
export function itemBox(item: TextItem, viewportHeight: number): Box {
  const [a, , , d, e, f] = item.transform
  const h = Math.abs(d) || item.height || Math.abs(a) || 0
  return { x: e, y: viewportHeight - f - h, w: item.width, h }
}

/**
 * Placement box of an image XObject in top-left page space.
 *
 * The scale factors may be NEGATIVE — images are routinely placed with a
 * flipped vertical axis, which is how a producer maps a top-down bitmap into
 * bottom-up user space. Taking `e`/`f` as the corner would then locate the box
 * a full image-height away, so the origin is derived from whichever edge is
 * actually lower.
 */
export function imagePlacementBox(placement: ImagePlacement, viewportHeight: number): Box {
  const [a, , , d, e, f] = placement.ctm
  const w = Math.abs(a)
  const h = Math.abs(d)
  const left = Math.min(e, e + a)
  const bottomInPdfSpace = Math.min(f, f + d)
  return { x: left, y: viewportHeight - bottomInPdfSpace - h, w, h }
}

/** True when the matrix has no rotation or skew, so a box fully describes it. */
export function isAxisAligned(placement: ImagePlacement, epsilon = 1e-6): boolean {
  const [, b, c] = placement.ctm
  return Math.abs(b) < epsilon && Math.abs(c) < epsilon
}

/**
 * The page body — everything except the header block and the footer.
 *
 * Every techpack page repeats the same `PRODUCT / CONTRAST / STYLE / FABRIC`
 * header and a `CLIENT:` footer. Those are already parsed once, centrally, by
 * `header.ts`, and leaving them in the working set actively causes wrong
 * results: the FABRIC line reads as a construction callout (it contains the
 * word "KNIT"), and it is wide enough to form a text column down the middle of
 * the page and so "explain" markers sitting on the garment.
 *
 * Every page parser therefore works from the body, not the whole page.
 */
export const PAGE_BODY_TOP = 0.12
/**
 * 0.88, not 0.92. Measured over all 65 pages of the five supplied packs: the
 * `CLIENT:` footer label's box top sits at 0.9100 and its value at 0.9382,
 * while the lowest real body content anywhere tops out at 0.8653. A 0.92 floor
 * therefore keeps the label, and `CLIENT` leaked into sizing row labels,
 * blueprint feature labels, branding descriptions and a seam string.
 */
export const PAGE_BODY_BOTTOM = 0.88

/**
 * The header band is excluded outright.
 *
 * One page kind genuinely carries content up there — the TECHNICAL SHEET, whose
 * callouts ring the drawing to the page top, with an ISO class at y=28.4 sitting
 * ABOVE the header's own FABRIC line at y=44.8. No horizontal cutoff can
 * separate those two: the header block ends at 0.4952 W and the leftmost
 * callout starts at 0.5032 W, 0.008 W apart. Telling them apart needs a second
 * signal (the header is set in a much larger face), which is page-specific
 * knowledge and lives in that page's own reader — see `pages/technicalSheet.ts`.
 * Measured across all five supplied packs, the technical sheet is the ONLY page
 * with any content in the band, so this stays a plain band.
 */
export function bodyText(
  extract: TechpackPageExtract,
  top = PAGE_BODY_TOP,
  bottom = PAGE_BODY_BOTTOM,
): PlacedText[] {
  const { height } = extract.viewport
  return toPlacedText(extract).filter(
    (item) => item.box.y > height * top && item.box.y < height * bottom,
  )
}

/** Normalize a page's text items into top-left `PlacedText`, dropping blanks. */
export function toPlacedText(extract: TechpackPageExtract): PlacedText[] {
  const out: PlacedText[] = []
  for (const item of extract.items) {
    // Undo the packs' letter-spacing here, once, so every parser downstream
    // sees `FABRIC:` rather than `F A B R I C :`.
    const text = collapseLetterSpacing(item.str.replace(/\s+/g, ' '))
    if (!text) continue
    const box = itemBox(item, extract.viewport.height)
    out.push({ text, box, fontSize: box.h || Math.abs(item.transform[0]) || 0 })
  }
  return out
}

/* --------------------------------------------------------------------------- *
 * Box maths
 * --------------------------------------------------------------------------- */

export const boxRight = (b: Box): number => b.x + b.w
export const boxBottom = (b: Box): number => b.y + b.h
export const boxArea = (b: Box): number => Math.max(0, b.w) * Math.max(0, b.h)
export const boxCenter = (b: Box): Point => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 })

export function inflateBox(b: Box, padX: number, padY = padX): Box {
  return { x: b.x - padX, y: b.y - padY, w: b.w + padX * 2, h: b.h + padY * 2 }
}

export function boxContainsPoint(b: Box, p: Point): boolean {
  return p.x >= b.x && p.x <= boxRight(b) && p.y >= b.y && p.y <= boxBottom(b)
}

export function unionBox(boxes: readonly Box[]): Box | null {
  if (boxes.length === 0) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const b of boxes) {
    minX = Math.min(minX, b.x)
    minY = Math.min(minY, b.y)
    maxX = Math.max(maxX, boxRight(b))
    maxY = Math.max(maxY, boxBottom(b))
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

export function median(values: readonly number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2 : (sorted[mid] ?? 0)
}

/**
 * Convert a page-space point to a PERCENT of a sub-box (0–100).
 *
 * This is what makes a hotspot survive being cropped out of its page: the
 * blueprint flat is extracted and displayed on its own, so a page-relative
 * coordinate would be wrong the moment it is shown.
 */
export function pageBoxToImagePercent(p: Point, flatBox: Box): Point {
  const clamp = (v: number): number => Math.min(100, Math.max(0, v))
  if (flatBox.w <= 0 || flatBox.h <= 0) return { x: 50, y: 50 }
  return {
    x: clamp(((p.x - flatBox.x) / flatBox.w) * 100),
    y: clamp(((p.y - flatBox.y) / flatBox.h) * 100),
  }
}

/* --------------------------------------------------------------------------- *
 * Row clustering
 * --------------------------------------------------------------------------- */

/**
 * Group items into visual rows by vertical position.
 *
 * Two details matter and both were chosen against real failure modes:
 * - tolerance derives from the MEDIAN height, so one oversized page title
 *   cannot widen the threshold for the whole page;
 * - the running comparison is against the cluster MEAN, not its first member,
 *   so a slightly taller cell mid-row does not split the row in two. That
 *   split is precisely what corrupts a sizing table.
 *
 * Rows come back top-to-bottom, each sorted left-to-right.
 */
export function clusterRows<T extends Placed>(
  items: readonly T[],
  toleranceFactor = 0.6,
): T[][] {
  if (items.length === 0) return []

  const heights = items.map((i) => i.box.h).filter((h) => h > 0)
  const tolerance = (median(heights) || 1) * toleranceFactor

  const sorted = [...items].sort((a, b) => boxCenter(a.box).y - boxCenter(b.box).y)

  const rows: T[][] = []
  let current: T[] = []
  let sum = 0

  for (const item of sorted) {
    const cy = boxCenter(item.box).y
    if (current.length > 0 && Math.abs(cy - sum / current.length) > tolerance) {
      rows.push(current)
      current = []
      sum = 0
    }
    current.push(item)
    sum += cy
  }
  if (current.length > 0) rows.push(current)

  return rows.map((row) => [...row].sort((a, b) => a.box.x - b.box.x))
}

/* --------------------------------------------------------------------------- *
 * Column assignment
 * --------------------------------------------------------------------------- */

export interface ColumnGrid {
  /** Horizontal centre of each column, left to right. */
  centers: number[]
  /** Representative column width, used to bound acceptable drift. */
  width: number
}

/** Build a column grid from the header cells of a table. */
export function buildColumnGrid(headers: readonly Placed[]): ColumnGrid {
  const centers = headers.map((h) => boxCenter(h.box).x).sort((a, b) => a - b)
  if (centers.length < 2) {
    const only = headers[0]
    return { centers, width: only ? only.box.w : 0 }
  }
  const gaps: number[] = []
  for (let i = 1; i < centers.length; i += 1) {
    gaps.push((centers[i] ?? 0) - (centers[i - 1] ?? 0))
  }
  return { centers, width: median(gaps) }
}

/**
 * Which column does this cell belong to?
 *
 * Returns null when the nearest column is further than `maxDriftFactor` of a
 * column width away. Refusing to place a cell is the point: a guessed
 * assignment writes a wrong number into a size chart, and nobody would notice.
 *
 * The default is 0.35, not 0.5. In an evenly spaced grid the furthest any
 * point can be from its nearest centre is exactly half a column, so a factor
 * of 0.5 can never reject anything — the guard would look present and do
 * nothing. Real table cells sit close to their centre; a value adrift by more
 * than a third of a column is a stray annotation, not data.
 */
export function assignToColumn(
  box: Box,
  grid: ColumnGrid,
  maxDriftFactor = 0.35,
): number | null {
  if (grid.centers.length === 0) return null
  const cx = boxCenter(box).x
  let best = 0
  let bestDelta = Infinity
  grid.centers.forEach((center, i) => {
    const delta = Math.abs(cx - center)
    if (delta < bestDelta) {
      bestDelta = delta
      best = i
    }
  })
  const limit = (grid.width || box.w || 1) * maxDriftFactor
  return bestDelta > limit ? null : best
}

/* --------------------------------------------------------------------------- *
 * Text joining
 * --------------------------------------------------------------------------- */

/**
 * Advance width of one character in a run — the yardstick a gap is judged by.
 *
 * Height is the wrong ruler. Across the five supplied packs one character
 * advances ~0.66–0.70 × height in body text but ~0.99 × height in a
 * letter-spaced heading, so a height-pegged threshold is half as strict in one
 * context as the other. The run's own width over its character count IS that
 * advance, measured rather than assumed, and it absorbs the face and the
 * tracking for free. The fallback only fires for a run reporting no width at
 * all (none do in the supplied packs).
 */
function charAdvance(item: PlacedText): number {
  if (item.box.w > 0 && item.text.length > 0) return item.box.w / item.text.length
  return (item.fontSize || 1) * 0.7
}

/**
 * Join a row of text runs into one string, inserting a space only where the
 * horizontal gap warrants it.
 *
 * Techpack headings are heavily letter-spaced (`C O L O R W A Y S`), which
 * naive whitespace-joining turns into unmatchable noise. Deciding from the
 * measured gap instead of the token content reads the page the way an eye
 * does, and needs no special-casing per label.
 *
 * `spaceFactor` is a fraction of a CHARACTER ADVANCE, not of the font height.
 * Measured over all 4,883 adjacent in-row run pairs in the five supplied packs,
 * the two populations are cleanly separated and the band between them is empty:
 *
 * - runs that must stay welded — a closing bracket hugging its label, e.g.
 *   `GRAPHIC B` + `)` — sit at 0.000–0.028 advances (0–0.1 pt);
 * - runs that must be separated — `(SEE` + `GRAPHIC B`, `APPLICATION (SEE` +
 *   `TRIM A`, `WIDTH` + `- G`, `NOTE:` + `ALL MEASUREMENTS ARE…` — start at
 *   0.354 advances (1.2 pt) and run up from there.
 *
 * 0.25 sits inside that band — 9× above the widest weld, 1.4× below the
 * narrowest word gap, and roughly two thirds of a printed word space. The old
 * default, 0.32 of the font HEIGHT, landed above four real word gaps (0.233,
 * 0.275, 0.287, 0.305 of height) and welded them shut — that is what turned
 * `(SEE GRAPHIC B)` into `(seegraphic B)` and so leaked an internal
 * cross-reference into the customer-facing label, because `splitSupplierRef`
 * could no longer see it.
 *
 * The band's lower half is reserved for producers that emit letter-spaced
 * headings one glyph per run rather than one word per run: the fixtures put
 * that tracking at 0.17–0.18 advances, and it must stay UNDER the threshold or
 * page classification loses every title.
 */
export function joinRow(items: readonly PlacedText[], spaceFactor = 0.25): string {
  const sorted = [...items].sort((a, b) => a.box.x - b.box.x)
  let out = ''
  let prev: PlacedText | null = null
  for (const item of sorted) {
    if (prev) {
      const gap = item.box.x - boxRight(prev.box)
      // The narrower of the two runs sets the scale: a wide run next to a
      // single narrow glyph must not have its own advance mask the boundary.
      const threshold = Math.min(charAdvance(prev), charAdvance(item)) * spaceFactor
      if (gap > threshold) out += ' '
    }
    out += item.text
    prev = item
  }
  return out.replace(/\s+/g, ' ').trim()
}
