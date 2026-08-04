import {
  bodyText,
  boxCenter,
  boxRight,
  clusterRows,
  imagePlacementBox,
  joinRow,
  type PlacedText,
} from '../geometry'
import { normalizeSpaces } from '../normalize'
import { rankGarmentFlat } from '../pdfImages'
import { colorGroups, readColorCell } from './colorCell'
import type { PageParser } from '../parserContext'
import type { ImagePlacement, TechpackPageExtract } from '../pdfTypes'
import type { TechpackArtwork, TechpackBranding, TechpackTrim } from '../../schema/techpack.zod'

/**
 * The reference pages — branding elements, trims and artwork.
 *
 * All three share one shape: a lettered code (`INDEX A`, `TRIM A`, `GRAPHIC B`)
 * introducing a block of prose, a printed size, and a reference image. One
 * module covers them because splitting near-identical parsers across three
 * files would multiply the maintenance without adding clarity. The page those
 * codes point at, COLOR SWATCHES, is a table rather than a block and lives in
 * `colorSwatches.ts`; it is re-exported here so the registry sees one module
 * per page family.
 */

export { parseColorSwatches } from './colorSwatches'

/** Sizes are printed with typographic quotes (`1.00”X1.00”`), never ASCII. */
const SIZE_LINE = /(\d+(?:\.\d+)?\s*["”″]\s*[xX×]\s*\d+(?:\.\d+)?\s*["”″])/
const MEASUREMENT = /\d+(?:\.\d+)?\s*["”″]/g
/** Yarn refs printed in the knit tile legend, e.g. `WALE (ELEVATED) (MAIN 1)`. */
const YARN_REFERENCE = /\bMAIN\s+\d+\b/g

/**
 * The marker naming a reference block.
 *
 * Two printed forms, both real and both required: a bare heading (`INDEX A:`)
 * on the branding pages, and a SUFFIX marker everywhere else —
 * `CUSTOM GRAPHIC PRINT (GRAPHIC A):`, `SEAMLESS KNIT TEXTURE (GRAPHIC B):`,
 * `…W/ WOVEN BRANDING (TRIM A):`. A prefix-only pattern matches neither trims
 * nor artwork, and a trailing `)` left inside the captured code turns it into
 * `GRAPHIC A)`.
 */
const CODE_MARKER = /\(?\s*(INDEX|TRIM|GRAPHIC)\s+([A-Z])\s*\)?\s*:/i

type ReferenceKind = 'INDEX' | 'TRIM' | 'GRAPHIC'

interface MarkerMatch {
  kind: ReferenceKind
  code: string
  index: number
  length: number
}

function matchMarker(line: string): MarkerMatch | null {
  const match = CODE_MARKER.exec(line)
  const word = match?.[1]?.toUpperCase()
  const letter = match?.[2]?.toUpperCase()
  if (!match || !letter) return null
  if (word !== 'INDEX' && word !== 'TRIM' && word !== 'GRAPHIC') return null
  return { kind: word, code: `${word} ${letter}`, index: match.index, length: match[0].length }
}

/**
 * Prose is set at the block's own first-line size; annotations are smaller.
 *
 * Measured across the five packs: every block opens with 10pt prose, while the
 * leader labels and callouts under it run 3.3pt (screen markers), 5pt (sew/fold
 * notes), 6pt (colour lines) and 7pt (dimensions). Calibrating on the block's
 * first line rather than an absolute size means a pack that sets its prose
 * smaller still reads; 0.75 sits between 7/10 and 1.
 */
const PROSE_HEIGHT_FLOOR = 0.75

/** Belt-and-braces: annotation headings that would survive an equal-size pack. */
const ANNOTATION_HEAD = /^TILE\s+AREA\b|^(PANTONE|COLORO)\s+COLOU?R\s+CODE\b/i

interface ReferenceBlock {
  code: string
  /** Prose printed on the heading row itself, marker removed. */
  title: string
  /** Every line under the heading, diagram callouts included. */
  lines: string[]
  /** The leading run of prose lines, stopping where annotations begin. */
  prose: string[]
  /** Horizontal slice of the page this block owns; picks its image. */
  band: { start: number; end: number }
}

/**
 * Where the page's content columns begin.
 *
 * The compression pack sets two blocks side by side — `SEAMLESS KNIT TEXTURE
 * (GRAPHIC A):` at x=17.9 and `(GRAPHIC B):` at x=428.9 on an 841.9pt page.
 * Reading such a page row-wise welds the columns into single lines, which is
 * how four SEAMLESS KNITS pages collapsed into four blocks carrying both
 * columns' prose and lost GRAPHIC B, D and F outright.
 *
 * The split lands MIDWAY between one heading's right edge and the next
 * heading's left, not on the heading edge itself: on page 9 the right heading
 * starts at x=429.0 while its own prose starts at x=428.9, so an edge-exact
 * boundary files that column's text under the left block. The midpoint clears
 * the left column's widest line (right edge 342.3) by 38.6pt and the right
 * column's first line by 48pt.
 */
function columnStarts(headings: readonly PlacedText[]): number[] {
  let widest: PlacedText[] = []
  for (const row of clusterRows(headings)) {
    if (row.length > widest.length) widest = row
  }
  if (widest.length < 2) return [-Infinity]
  const ordered = [...widest].sort((a, b) => a.box.x - b.box.x)
  return ordered.map((heading, i) => {
    const previous = ordered[i - 1]
    return previous ? (boxRight(previous.box) + heading.box.x) / 2 : -Infinity
  })
}

function proseOf(lines: readonly string[], heights: readonly number[]): string[] {
  const first = heights[0]
  if (first === undefined) return []
  const floor = first * PROSE_HEIGHT_FLOOR
  const out: string[] = []
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? ''
    if ((heights[i] ?? 0) < floor || ANNOTATION_HEAD.test(line)) break
    out.push(line)
  }
  return out
}

function collectBlocks(extract: TechpackPageExtract, kind: ReferenceKind): ReferenceBlock[] {
  const body = bodyText(extract)
  const headings = body.filter((item) => matchMarker(item.text)?.kind === kind)
  if (headings.length === 0) return []

  const starts = columnStarts(headings)
  const blocks: ReferenceBlock[] = []

  starts.forEach((start, i) => {
    const end = starts[i + 1] ?? Infinity
    const rows = clusterRows(body.filter((item) => item.box.x >= start && item.box.x < end))

    let lines: string[] = []
    let heights: number[] = []
    let current: ReferenceBlock | null = null

    for (const row of rows) {
      const line = normalizeSpaces(joinRow(row))
      if (!line) continue
      const marker = matchMarker(line)
      if (marker && marker.kind === kind) {
        if (current) current.prose = proseOf(lines, heights)
        const head = line.slice(0, marker.index).replace(/[(\s]+$/, '')
        const tail = line.slice(marker.index + marker.length)
        current = {
          code: marker.code,
          title: normalizeSpaces(`${head} ${tail}`),
          lines: [],
          prose: [],
          band: { start, end },
        }
        blocks.push(current)
        lines = current.lines
        heights = []
        continue
      }
      if (!current) continue
      lines.push(line)
      heights.push(Math.max(...row.map((item) => item.box.h)))
    }
    if (current) current.prose = proseOf(lines, heights)
  })

  return blocks
}

/**
 * The reference image for a block: the best placement inside its column band,
 * falling back to the best on the whole page.
 *
 * The fallback is not cosmetic. The knit pages paint their tiles as heavily
 * over-sized placements that a clip path trims down — `g_d0_img_p1_2` on page 7
 * is placed 543.6pt wide across an 841.9pt page — so a placement's centre can
 * land on the far side of a boundary from the tile a reader actually sees.
 * Where the band is inconclusive, one shared page image beats none: the admin
 * offers a manual override, but only for an image it can show.
 */
function blockImageKey(
  extract: TechpackPageExtract,
  band: ReferenceBlock['band'],
): string | null {
  const inBand: ImagePlacement[] = extract.images.filter((placement) => {
    const cx = boxCenter(imagePlacementBox(placement, extract.viewport.height)).x
    return cx >= band.start && cx < band.end
  })
  return (
    rankGarmentFlat(inBand, extract.viewport) ??
    rankGarmentFlat(extract.images, extract.viewport) ??
    largestPlacement(inBand.length > 0 ? inBand : extract.images, extract.viewport)
  )
}

/**
 * Last resort when the garment-flat ranker finds nothing.
 *
 * That ranker is tuned for a BASIC SPECS page and requires a placement at least
 * a quarter of the page wide. A reference page's subject is often smaller — the
 * oversized pack's woven-label drawing is 205pt on an 841.9pt page, 0.244 of it
 * — so the ranker rejects the one image the page exists to show. Here the field
 * is narrow enough that "the biggest drawing" is simply correct.
 */
function largestPlacement(
  placements: readonly ImagePlacement[],
  viewport: { width: number; height: number },
): string | null {
  let bestKey: string | null = null
  let bestArea = 0
  for (const placement of placements) {
    const box = imagePlacementBox(placement, viewport.height)
    const area = box.w * box.h
    if (area > bestArea) {
      bestArea = area
      bestKey = placement.objectKey
    }
  }
  return bestKey
}

/* --------------------------------------------------------------------------- *
 * Branding, trims, artwork
 * --------------------------------------------------------------------------- */

/** `INDEX A:` — logo placement prose plus its exact offsets (internal-only). */
export const parseBrandingElements: PageParser = (extract, ctx) => {
  const branding: TechpackBranding[] = collectBlocks(extract, 'INDEX').map((block) => {
    const description = normalizeSpaces([block.title, ...block.prose].join(' '))
    const flat = blockImageKey(extract, block.band)
    return {
      code: block.code,
      description,
      // The offsets are printed inside the prose ("PLACED 2.50” BELOW FRONT
      // NECKLINE"), never on a line of their own, so they are lifted out rather
      // than filtered off a line.
      dimensions: description.match(MEASUREMENT)?.map((m) => normalizeSpaces(m)) ?? [],
      imageId: flat ? ctx.imageId(extract.page, flat) : '',
    }
  })

  return branding.length > 0 ? { branding } : {}
}

/** `(TRIM A):` — a woven label or tape, with its visible size. */
export const parseTrims: PageParser = (extract, ctx) => {
  const trims: TechpackTrim[] = collectBlocks(extract, 'TRIM').map((block) => {
    const prose = normalizeSpaces(block.prose.join(' '))
    const flat = blockImageKey(extract, block.band)
    return {
      code: block.code,
      name: block.title,
      description: normalizeSpaces(`${block.title} ${prose}`),
      visibleSize: SIZE_LINE.exec(prose)?.[1] ?? '',
      // Left blank by design: the pack does not print a vendor part number,
      // and these fields are internal-only if they ever appear.
      supplierCode: '',
      vendor: '',
      imageId: flat ? ctx.imageId(extract.page, flat) : '',
    }
  })

  return trims.length > 0 ? { trims } : {}
}

function parseArtworkBlocks(
  extract: TechpackPageExtract,
  ctx: Parameters<PageParser>[1],
  kind: 'print' | 'knit',
): TechpackArtwork[] {
  return collectBlocks(extract, 'GRAPHIC').map((block) => {
    const prose = normalizeSpaces(block.prose.join(' '))
    const flat = blockImageKey(extract, block.band)
    // A screen with neither a code nor an sRGB value is the pack saying "as per
    // the artwork" — a note, not a specified colour.
    const named = colorGroups(block.lines)
      .map((group) => readColorCell(group))
      .filter((cell) => cell.pantone || cell.hex)
      .map((cell) => cell.colorName)
      .filter(Boolean)
    // Knit pages name their yarns in the tile legend ("WALE (ELEVATED)
    // (MAIN 1)") instead of in Pantone blocks, so fall back to those.
    const yarns = block.lines.join(' ').match(YARN_REFERENCE) ?? []
    return {
      code: block.code,
      kind,
      description: normalizeSpaces(`${block.title} ${prose}`),
      size: SIZE_LINE.exec(prose)?.[1] ?? '',
      colors: [...new Set(named.length > 0 ? named : yarns)],
      imageId: flat ? ctx.imageId(extract.page, flat) : '',
    }
  })
}

/** PATTERN PRINTS AND GRAPHICS — the printed artwork. */
export const parsePatternPrints: PageParser = (extract, ctx) => {
  const prints = parseArtworkBlocks(extract, ctx, 'print')
  return prints.length > 0 ? { prints } : {}
}

/** SEAMLESS KNITS AND TEXTURES — knitted-in tile patterns (compression packs). */
export const parseSeamlessKnits: PageParser = (extract, ctx) => {
  const knits = parseArtworkBlocks(extract, ctx, 'knit')
  return knits.length > 0 ? { knits } : {}
}
