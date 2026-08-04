/**
 * Supplier and production-artefact stripping.
 *
 * A techpack is somebody else's document. It carries the design house's name,
 * its liability disclaimers, and working notes to the factory — none of which
 * belong anywhere near a customer, and one leak of which is a brand incident
 * rather than a bug.
 *
 * Stripping therefore runs at THREE gates, cheaply, rather than once:
 *
 * 1. `pdfExtract` drops matching text items, so a disclaimer can never become
 *    a label or a table cell in the first place.
 * 2. `buildDocument` walks the assembled document — a phrase split across
 *    three text runs matches none of them individually but matches once
 *    joined, so gate 1 alone is not sufficient.
 * 3. the import mappers refuse to write a matching string into CMS content,
 *    which also covers anything an operator pasted in by hand.
 *
 * Each pass costs microseconds. Being wrong costs considerably more.
 */

/**
 * The design house's name, spelled defensively.
 *
 * The PDFs letter-space their headings, so the name can arrive as `FITTDESIGN`,
 * `FITT DESIGN`, or glyph by glyph as `F I T T D E S I G N`.
 */
const SUPPLIER_NAME = /F\s*I\s*T\s*T\s*D\s*E\s*S\s*I\s*G\s*N/gi

/**
 * Patterns that must never survive into stored content.
 *
 * Most of these consume `[^.)]*` — the rest of the sentence — rather than just
 * the phrase they match. Removing only the matched words leaves residue like
 * "FOR FLAWED SIZING", which is both meaningless and still recognisably part
 * of somebody else's disclaimer. Consuming to the sentence boundary keeps
 * neighbouring content (the genuine "measured seam to seam" note sits in the
 * same block) while taking the whole disclaimer.
 *
 * The run stops at `)` as well as `.` so a parenthesised disclaimer leaves a
 * balanced `()` for `tidyResidue` to clear, rather than an orphan bracket.
 */
export const STRIP_PATTERNS: readonly RegExp[] = [
  /F\s*I\s*T\s*T\s*D\s*E\s*S\s*I\s*G\s*N[^.)]*/i,
  /DISCLAIMER\s*:[^.)]*/i,
  /PLEASE\s+SAMPLE\s+THESE\s+SIZES[^.)]*/i,
  /\b(?:IS\s+NOT|CANNOT(?:\s+NOT)?\s+BE\s+HELD)\s+LIABLE[^.)]*/i,
  /^\s*DELETE\s*$/i,
  /REFERENCE\s+IMAGE/i,
  /ARTWORK\s+BOUNDARY\s*:?/i,
]

/** Does this string contain anything that must not be disclosed or stored? */
export function isStrippedText(text: string): boolean {
  if (!text) return false
  return STRIP_PATTERNS.some((pattern) => pattern.test(text))
}

/** Clear the punctuation a removal leaves behind: `HEM ()` → `HEM`. */
function tidyResidue(text: string): string {
  return text
    .replace(/\(\s*\)/g, '')
    .replace(/\[\s*\]/g, '')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.;:\-–—]+|[\s,.;:\-–—]+$/g, '')
    .trim()
}

/**
 * Remove offending phrases from a string, keeping whatever else it carried.
 *
 * Blanking the whole string would discard legitimate content that shares a
 * block with a disclaimer — exactly the case on the sizing page, where the
 * note about measuring the garment flat sits directly above the liability
 * text.
 */
export function stripText(text: string): string {
  if (!text) return ''
  let out = text
  for (const pattern of STRIP_PATTERNS) {
    const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`
    out = out.replace(new RegExp(pattern.source, flags), ' ')
  }
  return tidyResidue(out)
}

/**
 * Deep-strip every string in a parsed structure (gate 2).
 *
 * Returns a new value; the input is not mutated.
 *
 * The three `as unknown as T` casts below are the standard price of a
 * structure-preserving generic map: each branch rebuilds the *same shape* it
 * matched (string → string, array → array, object → object with identical
 * keys), so `T` is genuinely preserved at runtime — but TypeScript cannot
 * narrow `T` itself from a `typeof`/`Array.isArray` check on `value`, so it
 * sees only the widened branch type. Documented per CLAUDE.md's rule on
 * undocumented casts.
 */
export function stripDeep<T>(value: T): T {
  if (typeof value === 'string') return stripText(value) as unknown as T
  if (Array.isArray(value)) return value.map((entry) => stripDeep(entry)) as unknown as T
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      out[key] = stripDeep(entry)
    }
    return out as unknown as T
  }
  return value
}

/**
 * Clean a source filename before it becomes a storage path.
 *
 * Object paths show up in signed URLs and in the media library, so a supplier
 * name in the filename would outlive every other gate.
 */
export function stripFilename(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  const stem = lastDot > 0 ? filename.slice(0, lastDot) : filename
  const ext = lastDot > 0 ? filename.slice(lastDot) : ''

  // Filenames get the NAME-only pattern, not the sentence-consuming ones: a
  // filename has no sentence boundary, so `[^.]*` would swallow the product
  // name too and every pack would land as `techpack.pdf`.
  const cleanedStem = stem
    .replace(/[_-]+/g, ' ')
    .replace(SUPPLIER_NAME, ' ')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

  return `${cleanedStem || 'techpack'}${ext.toLowerCase()}`
}
