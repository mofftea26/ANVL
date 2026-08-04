import { boxRight, clusterRows, joinRow, toPlacedText, type PlacedText } from './geometry'
import { normalizeKey } from './normalize'
import type { TechpackPageExtract } from './pdfTypes'
import type { TechpackPageKind } from '../schema/techpack.zod'

/**
 * Page classification.
 *
 * Every techpack page prints its own kind as a large right-aligned title in
 * the header band ("BASIC SPECS", "SIZING GUIDE"). That title is the most
 * reliable signal on the page — far more stable than counting tables or
 * sniffing for keywords — so classification reads it and nothing else.
 *
 * The title is usually set across two lines ("COLORWAY" / "SCHEDULE"), so the
 * band is clustered into rows and joined before matching.
 *
 * This never throws and never guesses: an unrecognised page classifies as
 * `unknown`, which `buildDocument` counts. A pack from a different supplier
 * should fail loudly as "we could not read this", not quietly as a document
 * that happens to be mostly empty.
 */

interface TitlePattern {
  re: RegExp
  kind: TechpackPageKind
}

/**
 * Ordered: the first match wins, so more specific patterns come first.
 * `COLOU?R` spellings are accepted because the field is not consistent.
 */
const TITLE_PATTERNS: readonly TitlePattern[] = [
  { re: /COLOU?RWAY\s*SCHEDULE/, kind: 'colorway-schedule' },
  { re: /COLOU?R\s*SWATCHES/, kind: 'color-swatches' },
  { re: /SIZ(?:E|ING)\s*GUIDE/, kind: 'sizing-guide' },
  { re: /TECHNICAL\s*SHEET/, kind: 'technical-sheet' },
  { re: /BASIC\s*SPECS?/, kind: 'basic-specs' },
  { re: /BRANDING\s*ELEMENTS/, kind: 'branding-elements' },
  { re: /TRIMS?\s*(?:AND|&)?\s*NOTIONS/, kind: 'trims-and-notions' },
  { re: /(?:PATTERN\s*)?PRINTS?\s*(?:AND|&)?\s*GRAPHICS/, kind: 'pattern-prints' },
  { re: /(?:SEAMLESS\s*)?KNITS?\s*(?:AND|&)?\s*TEXTURES/, kind: 'seamless-knits' },
  { re: /PACKAGING\s*(?:AND|&)?\s*LABELS/, kind: 'packaging-and-labels' },
]

export interface PageClassification {
  kind: TechpackPageKind
  /** The joined title text the decision was made from — shown in review. */
  title: string
}

export interface ClassifyOptions {
  /** Fraction of page height treated as the header band. */
  bandHeight?: number
  /** A title's right edge must sit within this fraction of the page's right edge. */
  rightEdgeTolerance?: number
  /** A title must start beyond this fraction of the page width. */
  minLeftFraction?: number
}

/**
 * Text runs that look like the right-aligned page title.
 *
 * Two constraints together, because either alone lets the header block
 * through: the run must sit high on the page AND be pushed to the right
 * margin. The `PRODUCT:` / `FABRIC:` block occupies the same band but stops
 * around mid-width.
 */
export function titleBandItems(
  extract: TechpackPageExtract,
  options: ClassifyOptions = {},
): PlacedText[] {
  const { bandHeight = 0.2, rightEdgeTolerance = 0.12, minLeftFraction = 0.55 } = options
  const { width, height } = extract.viewport
  const bandBottom = height * bandHeight
  const rightLimit = width * (1 - rightEdgeTolerance)
  const leftLimit = width * minLeftFraction

  return toPlacedText(extract).filter(
    (item) =>
      item.box.y <= bandBottom && item.box.x >= leftLimit && boxRight(item.box) >= rightLimit,
  )
}

function matchKind(title: string): TechpackPageKind | null {
  for (const { re, kind } of TITLE_PATTERNS) {
    if (re.test(title)) return kind
  }
  return null
}

/**
 * Classify one page from its printed title.
 *
 * Falls back to scanning every row on the page when the band yields nothing
 * recognisable — some producers place the title slightly lower, and a page we
 * can read imperfectly is worth more than one we discard.
 */
export function classifyPage(
  extract: TechpackPageExtract,
  options: ClassifyOptions = {},
): PageClassification {
  const band = titleBandItems(extract, options)
  const bandTitle = normalizeKey(
    clusterRows(band)
      .map((row) => joinRow(row))
      .join(' '),
  )

  const bandKind = matchKind(bandTitle)
  if (bandKind) return { kind: bandKind, title: bandTitle }

  for (const row of clusterRows(toPlacedText(extract))) {
    const text = normalizeKey(joinRow(row))
    const kind = matchKind(text)
    if (kind) return { kind, title: text }
  }

  return { kind: 'unknown', title: bandTitle }
}
