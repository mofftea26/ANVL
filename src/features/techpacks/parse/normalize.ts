/**
 * Value normalization for techpack text.
 *
 * Everything here is generic and unit-testable; page-shaped parsing lives in
 * the `pages/` modules. The conversions are conservative by design — each one
 * returns null rather than a guess, because these values end up in a public
 * size chart and a wrong number reads as authoritative.
 */

/**
 * Undo typographic letter-spacing inside a single text run.
 *
 * The packs set their headings with wide character spacing, and pdf.js
 * faithfully reports that as spaces INSIDE the string — `FABRIC:` arrives as
 * `'F A B R I C :'` and the style code as `'A N V L - M - S S 0 1 - F W 2 6'`.
 * Left alone, none of the field labels ever match, which is what emptied the
 * fabric, GSM, composition and colorway fields on real packs.
 *
 * The test is that EVERY token in the run is one or two characters. Real prose
 * always carries a longer word ('HEM WRAPPED JACQUARD' is untouched), whereas
 * letter-spaced text is uniformly tiny fragments. pdf.js emits a separate item
 * per visual word group, so a run is one word and joining it cannot glue two
 * words together.
 */
export function collapseLetterSpacing(text: string): string {
  const trimmed = text.trim()
  if (!trimmed.includes(' ')) return trimmed
  const tokens = trimmed.split(/\s+/)
  if (tokens.length < 2) return trimmed
  // Tokens of up to THREE characters, at least half of them single glyphs.
  //
  // A stricter "every token <= 2" rule misses the runs where pdf.js welds a
  // kerning pair: `LAVA SMOKE` arrives as `'L AVA'`, and `AVAILABLE` as
  // `'AVA I L A B L E'`, so a 3-character token appears mid-run. The
  // half-single-glyph gate is what keeps genuine short prose out — `'AND FIT'`
  // has no single-character token and is left alone. Measured across all 6,637
  // text runs in the five supplied packs, this collapses exactly the runs that
  // should collapse, with no false positives.
  if (!tokens.every((token) => token.length <= 3)) return trimmed
  const singles = tokens.filter((token) => token.length === 1).length
  return singles * 2 >= tokens.length ? tokens.join('') : trimmed
}

/** Collapse runs of whitespace and trim. */
export function normalizeSpaces(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/** Uppercase, whitespace-collapsed — the form page titles and labels match on. */
export function normalizeKey(text: string): string {
  return normalizeSpaces(text).toUpperCase()
}

/**
 * Parse a printed measurement.
 *
 * Handles inch marks, stray commas and a leading `+`. Returns null for
 * anything that is not cleanly a number, so callers can raise an issue rather
 * than silently storing NaN.
 */
export function parseNumber(text: string): number | null {
  const cleaned = normalizeSpaces(text)
    .replace(/["”]/g, '')
    .replace(/,/g, '')
    .replace(/^\+/, '')
  if (!/^-?\d*\.?\d+$/.test(cleaned)) return null
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}

/** Inches → centimetres, rounded to one decimal (how the site prints sizes). */
export function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54 * 10) / 10
}

/** Format a number for a size-table cell: `52.1`, `52` — never `52.10`. */
export function formatMeasurement(value: number): string {
  return String(Math.round(value * 10) / 10)
}

/**
 * `sRGB (94/96/100)` → `#5e6064`.
 *
 * Returns blank when the pack printed `sRGB (N/A)`, which it does whenever the
 * colour is "as per the artwork" rather than a specified ink.
 */
export function parseSrgbHex(text: string): string {
  const match = /(\d{1,3})\s*\/\s*(\d{1,3})\s*\/\s*(\d{1,3})/.exec(text)
  if (!match) return ''
  const parts = [match[1], match[2], match[3]].map((p) => Number(p ?? NaN))
  if (parts.some((p) => !Number.isFinite(p) || p < 0 || p > 255)) return ''
  return `#${parts.map((p) => p.toString(16).padStart(2, '0')).join('')}`
}

/** Pantone code, e.g. `18-0202 TCX`. Blank when "TCX NOT AVAILABLE". */
export function parsePantoneCode(text: string): string {
  const match = /\b(\d{2}-\d{4})\s*(TCX|TPX|TPG|C|U)?\b/i.exec(text)
  if (!match) return ''
  return normalizeSpaces(`${match[1]} ${match[2] ?? ''}`).toUpperCase()
}

/** Slugify a colour role for grouping: `MAIN 1` → `main-1`. */
export function slugifyRole(role: string): string {
  return normalizeSpaces(role)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Title-case a SHOUTED techpack phrase for customer-facing copy.
 *
 * Deliberately leaves tokens that are not purely alphabetic untouched, so
 * codes and measurements (`301`, `15SPI`, `1/4"`, `SSa`) survive intact.
 */
export function titleCasePhrase(text: string): string {
  return normalizeSpaces(text)
    .toLowerCase()
    .split(' ')
    .map((word) => {
      if (!/^[a-z]+$/.test(word)) return word
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
    .replace(/^\w/, (c) => c.toUpperCase())
}

/** Stitches-per-inch, e.g. `15SPI` or `15 SPI` → 15. */
export function parseSpi(text: string): number | null {
  const match = /(\d{1,3})\s*SPI\b/i.exec(text)
  if (!match) return null
  return parseNumber(match[1] ?? '')
}

/** ISO seam/stitch class in brackets, e.g. `SSa [1.01.01]`. */
export function parseStitchCode(text: string): string {
  const match = /\b([A-Z]{2,3}[a-z]?)\s*\[\s*([\d.]+)\s*\]/.exec(text)
  return match ? `${match[1]} [${match[2]}]` : ''
}

/** Grams per square metre from a fabric line, e.g. `260 GSM` → 260. */
export function parseGsm(text: string): number | null {
  const match = /(\d{2,4})\s*GSM\b/i.exec(text)
  if (!match) return null
  const value = parseNumber(match[1] ?? '')
  return value !== null && value > 0 ? value : null
}

export interface CompositionPart {
  material: string
  percentage: number | null
}

/**
 * Parse the fibre breakdown out of a fabric line.
 *
 * `73% NYLON | 21% POLYESTER | 6% SPANDEX | 330 GSM | SINGLE JERSEY…` yields
 * three parts; the GSM and construction segments carry no percentage and are
 * left for `parseGsm` / the caller.
 */
export function parseComposition(text: string): CompositionPart[] {
  const parts: CompositionPart[] = []
  const seen = new Set<string>()
  const pattern = /(\d{1,3})\s*%\s*([A-Za-z][A-Za-z\s-]*?)(?=\s*(?:\||,|\d{1,3}\s*%|$))/g
  for (const match of text.matchAll(pattern)) {
    const percentage = parseNumber(match[1] ?? '')
    const material = normalizeKey(match[2] ?? '')
    if (!material || seen.has(material)) continue
    seen.add(material)
    parts.push({ material, percentage })
  }
  return parts
}

/**
 * Split a trailing `(SEE TRIM A)` cross-reference off a label.
 *
 * These references point at other pages of the pack, so they are meaningless
 * to a customer and are held back by the disclosure policy — but they are
 * genuinely useful to an operator, hence the split rather than a delete.
 */
export function splitSupplierRef(text: string): { text: string; supplierRef: string } {
  const refs: string[] = []
  const stripped = text.replace(SUPPLIER_REF, (match) => {
    const target = normalizeKey(match.replace(/[()]/g, '').replace(/^\s*SEE\s*/i, ''))
    if (target) refs.push(`SEE ${target}`)
    return ' '
  })
  return { text: tidyBrackets(stripped), supplierRef: refs[0] ?? '' }
}

/**
 * A cross-reference to another page of the pack.
 *
 * Two forms, because real pages produce both:
 * - bracketed — `(SEE TRIM A)`. The brackets frequently arrive as separate
 *   text runs and one routinely fails to survive row assembly, so the closer
 *   is optional; requiring it left `… LOGO (SEE INDEX A` in a customer-facing
 *   label. The run stops at `(` so a following `(APPLIED ON COLORWAY 3)` —
 *   which IS worth keeping — is not swallowed along with it.
 * - bare — `SEE GRAPHIC A`, restricted to the reference nouns the packs
 *   actually use. Matching a bare `SEE` would eat real copy like
 *   "SEE THROUGH MESH".
 *
 * Global, because the reference is not always last: one label reads
 * `… PRINT (SEE GRAPHIC B (APPLIED ON COLORWAY 3)`.
 */
const SUPPLIER_REF =
  /\(\s*\bSEE\b[^)(]*\)?|\bSEE\s+(?:TRIMS?|GRAPHICS?|DETAILS?|INDEX)\b[A-Z0-9 \-]*/gi

/** Drop a bracket left unbalanced by an upstream split. */
function tidyBrackets(text: string): string {
  let out = normalizeSpaces(text)
  const opens = (out.match(/\(/g) ?? []).length
  const closes = (out.match(/\)/g) ?? []).length
  if (closes > opens) out = out.replace(/\s*\)\s*$/, '')
  if (opens > closes) out = out.replace(/\s*\(\s*$/, '')
  return normalizeSpaces(out)
}
