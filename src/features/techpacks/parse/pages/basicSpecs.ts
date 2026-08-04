import {
  boxCenter,
  clusterRows,
  imagePlacementBox,
  inflateBox,
  isAxisAligned,
  joinRow,
  median,
  bodyText,
  unionBox,
  type Box,
  type PlacedText,
} from '../geometry'
import { normalizeKey, splitSupplierRef, titleCasePhrase } from '../normalize'
import { rankGarmentFlat } from '../pdfImages'
import type { PageParser } from '../parserContext'
import type { TechpackBlueprint, TechpackBlueprintFeature } from '../../schema/techpack.zod'

/**
 * The BASIC SPECS page — the blueprint, and the reason this feature exists.
 *
 * Layout: a garment drawing in the middle of the page with lowercase letter
 * markers dropped onto it, ringed by a grid of labelled feature cards keyed to
 * those same letters. What this parser takes is the CARDS: label, detail, and
 * the supplier cross-reference held back from customers.
 *
 * The drawing itself is NOT extracted. It is not an image XObject — measured
 * across all five supplied packs (10 blueprint pages) it is a wide bitmap strip
 * clipped to two narrow windows, front and back, with vector callouts and the
 * markers painted over it — and the page crop we rendered instead was a
 * supplier render carrying its own annotation pins. The passport renders these
 * callouts as cards now, so the drawing has no consumer.
 *
 * The one real difficulty left is telling the two populations of letters apart:
 * the key printed above a perimeter card looks identical to a marker sitting on
 * the garment. Type size settles it where the packs make the distinction;
 * `isPerimeterKey` is the geometric fallback where they do not. Only the keys
 * become features; the markers exist purely to be excluded.
 */

/** A marker key: one lowercase letter, optionally with a trailing dot/paren. */
const MARKER = /^([a-z])[.)]?$/

/** How far outside the flat's box a letter must sit to count as a perimeter key. */
const FLAT_INFLATE_FRACTION = 0.02
/** A card's text must sit within this fraction of the page height of its key. */
const COLUMN_REACH_FRACTION = 0.4
/** Text runs at least this many characters long count as a card label, not a stray. */
const MIN_LABEL_CHARS = 4
/** How close a key must sit to a card column's centre, as a share of label width. */
const COLUMN_TOLERANCE_FACTOR = 0.6

interface LetterItem {
  code: string
  item: PlacedText
}

function letterItems(placed: readonly PlacedText[]): LetterItem[] {
  const out: LetterItem[] = []
  for (const item of placed) {
    const match = MARKER.exec(item.text)
    if (match?.[1]) out.push({ code: match[1], item })
  }
  return out
}

/**
 * A rough box for the drawing, used ONLY to tell card keys from markers.
 *
 * The GEOMETRIC classification fallback needs some notion of "the middle of the
 * page" before markers are known, so it cannot be derived from the markers
 * without circularity. The largest page image is a serviceable stand-in: even
 * the wrong image is roughly where the drawing is, and a wrong answer here
 * only costs the fallback.
 */
function classificationHintBox(
  extract: Parameters<PageParser>[0],
  letters: readonly LetterItem[],
): Box | null {
  const imageKey = rankGarmentFlat(extract.images, extract.viewport)
  const placement = extract.images.find((i) => i.objectKey === imageKey)
  if (placement && isAxisAligned(placement)) {
    return imagePlacementBox(placement, extract.viewport.height)
  }
  // Nothing usable on the page: the letters are all there is to go on.
  return unionBox(letters.map((l) => l.item.box))
}

/** Type sizes must differ by at least this ratio to be a deliberate distinction. */
const TYPE_SIZE_SPLIT_RATIO = 1.25

/**
 * Split the letters by TYPE SIZE — the primary rule.
 *
 * The packs set perimeter card keys noticeably larger than the markers dropped
 * on the drawing (12pt vs 7.8pt in every supplied pack, both products, every
 * blueprint page). That is a deliberate typographic distinction by whoever drew
 * the template, and it separates the two populations perfectly where geometry
 * only approximates: a key can sit inside the flat's bounding box, and a marker
 * can sit near a card, but a marker is never set in the card size.
 *
 * Returns null when there is no clear separation — a pack that sets both at one
 * size falls back to the geometric rule rather than splitting at random.
 */
function splitByTypeSize(
  letters: readonly LetterItem[],
): { keys: LetterItem[]; markers: LetterItem[] } | null {
  const heights = letters.map((l) => l.item.box.h).filter((h) => h > 0)
  if (heights.length < 2) return null

  const min = Math.min(...heights)
  const max = Math.max(...heights)
  if (min <= 0 || max / min < TYPE_SIZE_SPLIT_RATIO) return null

  const midpoint = (min + max) / 2
  const keys = letters.filter((l) => l.item.box.h >= midpoint)
  const markers = letters.filter((l) => l.item.box.h < midpoint)
  if (keys.length === 0 || markers.length === 0) return null

  return { keys, markers }
}

interface LabelColumn {
  centre: number
  items: PlacedText[]
}

/**
 * The columns the feature cards are set in.
 *
 * Derived from where the card TEXT actually sits rather than assumed, because
 * the whole classification below hinges on the tolerance being tight. A guess
 * at "roughly a column wide" is easily wide enough to reach from the middle of
 * the drawing to the nearest card, at which point every marker on the garment
 * gets promoted to a feature.
 */
function buildLabelColumns(placed: readonly PlacedText[]): {
  columns: LabelColumn[]
  tolerance: number
} {
  const runs = placed.filter((i) => i.text.length >= MIN_LABEL_CHARS)
  if (runs.length === 0) return { columns: [], tolerance: 0 }

  const tolerance = (median(runs.map((i) => i.box.w)) || 1) * COLUMN_TOLERANCE_FACTOR
  const sorted = [...runs].sort((a, b) => boxCenter(a.box).x - boxCenter(b.box).x)

  const columns: LabelColumn[] = []
  for (const item of sorted) {
    const centre = boxCenter(item.box).x
    const last = columns[columns.length - 1]
    if (last && centre - last.centre <= tolerance) {
      last.items.push(item)
    } else {
      columns.push({ centre, items: [item] })
    }
  }

  return { columns, tolerance }
}

/**
 * Is this letter a perimeter card key rather than a marker on the garment?
 *
 * Both populations are single lowercase letters and identical in the text
 * layer, so the distinction has to come from what surrounds them.
 *
 * Rule (a), which does most of the work — the letter sits outside the flat's
 * bounding box. Cards ring the page edges; the drawing occupies the middle.
 *
 * Rule (b), the refinement — a letter INSIDE that box is still a key if it is
 * ALIGNED TO A CARD COLUMN that carries text off the drawing. A garment is not
 * a rectangle, so the flat's bounding box swallows a lot of empty corner and a
 * card key can legitimately fall inside it.
 *
 * The signal in both cases is the same: a card key announces a block of text
 * in its column; a marker on the garment is isolated, with nothing near it but
 * the drawing.
 */
function isPerimeterKey(
  letter: LetterItem,
  flatBox: Box | null,
  columns: readonly LabelColumn[],
  tolerance: number,
  inflatePad: number,
  pageHeight: number,
): boolean {
  const centre = boxCenter(letter.item.box)

  if (flatBox) {
    const inflated = inflateBox(flatBox, inflatePad)
    const outside =
      centre.x < inflated.x ||
      centre.x > inflated.x + inflated.w ||
      centre.y < inflated.y ||
      centre.y > inflated.y + inflated.h
    if (outside) return true
  }

  const reach = pageHeight * COLUMN_REACH_FRACTION
  for (const column of columns) {
    if (Math.abs(column.centre - centre.x) > tolerance) continue
    for (const item of column.items) {
      const itemCentre = boxCenter(item.box)
      if (Math.abs(itemCentre.y - centre.y) > reach) continue
      if (flatBox) {
        const insideDrawing =
          itemCentre.x >= flatBox.x &&
          itemCentre.x <= flatBox.x + flatBox.w &&
          itemCentre.y >= flatBox.y &&
          itemCentre.y <= flatBox.y + flatBox.h
        if (insideDrawing) continue
      }
      return true
    }
  }
  return false
}

/**
 * The card text belonging to a perimeter key.
 *
 * Cards stack in columns, so a card's text is whatever sits in the same column
 * between this key and the next key below it.
 */
function cardTextFor(
  key: LetterItem,
  keys: readonly LetterItem[],
  placed: readonly PlacedText[],
  columnWidth: number,
): string {
  const keyCentre = boxCenter(key.item.box)

  const nextKeyBelow = keys
    .filter(
      (other) =>
        other !== key &&
        Math.abs(boxCenter(other.item.box).x - keyCentre.x) < columnWidth &&
        other.item.box.y > key.item.box.y + key.item.box.h,
    )
    .sort((a, b) => a.item.box.y - b.item.box.y)[0]

  const bandBottom = nextKeyBelow ? nextKeyBelow.item.box.y : Infinity

  const cardItems = placed.filter((item) => {
    // A key never describes itself, and a lone letter is another key/marker.
    // Punctuation is exempt: the closing bracket of `(SEE TRIM A)` is often its
    // own run, and dropping it leaves the reference unclosed — which stops
    // `splitSupplierRef` from firing and leaks an internal cross-reference into
    // the customer-facing label.
    if (item === key.item) return false
    if (item.text.length < 2 && /[a-z0-9]/i.test(item.text)) return false
    if (Math.abs(boxCenter(item.box).x - keyCentre.x) > columnWidth) return false
    return item.box.y >= key.item.box.y - key.item.box.h && item.box.y < bandBottom
  })

  return normalizeKey(
    clusterRows(cardItems)
      .map((row) => joinRow(row))
      .join(' '),
  )
}

export const parseBasicSpecs: PageParser = (extract, ctx) => {
  // Body only. The repeated page header is a long text run like any other, and
  // its FABRIC line is wide enough to form a column right down the middle of
  // the page — which would then "explain" markers sitting on the garment and
  // promote them to features.
  const placed = bodyText(extract)
  const letters = letterItems(placed)

  if (letters.length === 0) {
    ctx.addIssue({
      page: extract.page,
      path: 'blueprint',
      code: 'blueprint_no_markers',
      severity: 'warn',
      message: 'No lettered markers were found on this specs page.',
    })
    return {}
  }

  const { columns, tolerance } = buildLabelColumns(placed)
  const columnWidth = tolerance || (median(placed.map((i) => i.box.w)) || 20) * 6

  // Type size first — it is exact where geometry is only approximate. Geometry
  // remains the fallback for a pack that does not make the distinction.
  const byTypeSize = splitByTypeSize(letters)
  const keys: LetterItem[] = byTypeSize?.keys ?? []
  const markers: LetterItem[] = byTypeSize?.markers ?? []

  if (!byTypeSize) {
    const hintBox = classificationHintBox(extract, letters)
    const inflatePad = extract.viewport.width * FLAT_INFLATE_FRACTION
    for (const letter of letters) {
      const isKey = isPerimeterKey(
        letter,
        hintBox,
        columns,
        tolerance,
        inflatePad,
        extract.viewport.height,
      )
      if (isKey) keys.push(letter)
      else markers.push(letter)
    }
  }

  // One feature per distinct key letter; the first key wins if a letter is
  // printed twice in the perimeter (packs occasionally repeat a card).
  const features = new Map<string, TechpackBlueprintFeature>()
  for (const key of keys) {
    if (features.has(key.code)) continue
    const raw = cardTextFor(key, keys, placed, columnWidth)
    if (!raw) continue
    const { text, supplierRef } = splitSupplierRef(raw)
    const [first = '', ...rest] = text.split(/\s{2,}|(?<=\.)\s/)
    features.set(key.code, {
      code: key.code,
      label: titleCasePhrase(first || text),
      detail: titleCasePhrase(rest.join(' ')),
      supplierRef,
      positions: [],
    })
  }

  // A marker with no card is still worth reporting: it means the parser read
  // the page's two letter populations differently from how the pack meant them,
  // and a card is probably missing from the feature list.
  for (const marker of markers) {
    if (features.has(marker.code)) continue
    ctx.addIssue({
      page: extract.page,
      path: `blueprint.features.${marker.code}`,
      code: 'blueprint_marker_without_label',
      severity: 'warn',
      message: `Marker "${marker.code}" sits on the garment but has no labelled card.`,
    })
  }

  const blueprint: TechpackBlueprint = {
    page: extract.page,
    view: '',
    features: [...features.values()].sort((a, b) => a.code.localeCompare(b.code)),
  }

  if (blueprint.features.length === 0) {
    ctx.addIssue({
      page: extract.page,
      path: 'blueprint.features',
      code: 'blueprint_no_features',
      severity: 'warn',
      message: 'Markers were found but none could be matched to a labelled card.',
    })
  }

  return { blueprint }
}
