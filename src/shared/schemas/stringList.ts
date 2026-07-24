import { z } from 'zod'

/**
 * Split a legacy newline-joined string into trimmed, non-empty lines. Older CMS
 * blobs stored bullet lists as one `\n`-joined string; the structured list
 * editors now store a real `string[]`. This keeps those legacy blobs readable.
 */
export function splitLegacyLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

/**
 * An optional `string[]` schema that tolerantly accepts a legacy `\n`-joined
 * string: a stored string is split into trimmed non-empty lines on read, while
 * arrays pass straight through. Newly authored data always round-trips as an
 * array, so no author data is ever lost during the migration from the old
 * per-line textareas to the structured list editors.
 *
 * @param max Optional cap on the number of items (matches the field's UI limit).
 */
export function tolerantStringList(max?: number) {
  const base = max === undefined ? z.array(z.string()) : z.array(z.string()).max(max)
  return z
    .preprocess((value) => (typeof value === 'string' ? splitLegacyLines(value) : value), base)
    .optional()
}
