import type { TechpackDocument } from './techpack.zod'

/**
 * The disclosure boundary, in one auditable place.
 *
 * Parsers stay deliberately dumb — they extract everything the PDF contains,
 * because an operator reviewing a pack needs to see all of it. What may reach
 * a customer is a separate, narrower question, and answering it here (rather
 * than smearing the rule across nine parsers) means the policy can be read,
 * reviewed and tested as a single list.
 *
 * The split is FIELD-level, not page-level. The technical sheet is the clear
 * case: its seam types, stitch classes and SPI are exactly the transparency
 * story worth telling, while its dimensioned pattern pieces are close enough
 * to a reproducible pattern to hold back.
 *
 * Two consumers share this predicate, which is the point:
 * - the import plan blocks any proposal that READS one of these paths. Note
 *   what that does and does not cover: a proposal declares its own
 *   `sourcePaths` (`importProposal.ts`), so the gate is only as good as that
 *   declaration. The first line of defence remains the mappers, which drop
 *   internal fields by hand — this catches a mapper that starts reading one.
 *   (Until 2026-07-30 the gate tested a proposal's DESTINATION path in the CMS
 *   blob against this list of DOCUMENT paths, so it could never match at all.)
 * - the AI edge function is only ever sent `redactTechpackDocument(doc)`.
 */

/**
 * Dotted paths that must never leave the admin. `*` matches exactly one
 * segment (an array index or an object key).
 */
export const INTERNAL_ONLY_PATHS: readonly string[] = [
  /** Supplier name commonly survives in the filename. */
  'meta.sourceFilename',
  /** Dimensioned flat — approaches a reproducible pattern. */
  'technical.patternPieces',
  'technical.notes',
  /** `SEE DETAIL K`-style cross-references: meaningless outside the pack. */
  'technical.seams.*.supplierRef',
  'blueprint.*.features.*.supplierRef',
  'trims.*.supplierCode',
  'trims.*.vendor',
  /** Exact placement offsets for branding application. */
  'branding.*.dimensions',
]

declare const redactedBrand: unique symbol

/**
 * A document with every {@link INTERNAL_ONLY_PATHS} field emptied.
 *
 * Branded so it cannot be confused with a raw {@link TechpackDocument} — the
 * edge-function client accepts only this type, which makes "we forgot to
 * redact before sending" a compile error rather than a leak.
 */
export type TechpackDisclosableDocument = TechpackDocument & {
  readonly [redactedBrand]: true
}

function segmentsMatch(pattern: readonly string[], path: readonly string[]): boolean {
  if (pattern.length !== path.length) return false
  return pattern.every((seg, i) => seg === '*' || seg === path[i])
}

const SPLIT_PATHS: readonly (readonly string[])[] = INTERNAL_ONLY_PATHS.map((p) => p.split('.'))

/**
 * Is this dotted path internal-only?
 *
 * Concrete array indices are normalized to `*` before matching, so
 * `blueprint.0.features.3.supplierRef` matches the declared pattern.
 */
export function isInternalPath(path: string): boolean {
  const segments = path.split('.').map((seg) => (/^\d+$/.test(seg) ? '*' : seg))
  return SPLIT_PATHS.some((pattern) => segmentsMatch(pattern, segments))
}

/** Empty value of the same shape, so consumers never hit an unexpected type. */
function emptyLike(value: unknown): unknown {
  if (Array.isArray(value)) return []
  if (typeof value === 'string') return ''
  if (typeof value === 'number') return null
  if (typeof value === 'boolean') return false
  if (value && typeof value === 'object') return {}
  return null
}

function redactValue(value: unknown, path: readonly string[]): unknown {
  if (path.length > 0 && isInternalPath(path.join('.'))) {
    return emptyLike(value)
  }
  if (Array.isArray(value)) {
    return value.map((entry, i) => redactValue(entry, [...path, String(i)]))
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      out[key] = redactValue(entry, [...path, key])
    }
    return out
  }
  return value
}

/**
 * Strip every internal-only field, returning a document safe to send outside
 * the admin. Structural shape is preserved — fields are emptied, not deleted —
 * so the result still parses as a `TechpackDocument`.
 */
export function redactTechpackDocument(doc: TechpackDocument): TechpackDisclosableDocument {
  // The walk only ever replaces values with empties of the same kind, so the
  // shape is unchanged; the brand is the whole point of the cast.
  return redactValue(doc, []) as TechpackDisclosableDocument
}
