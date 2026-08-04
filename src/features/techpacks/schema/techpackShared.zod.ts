import { z } from 'zod'

/**
 * Shared techpack leaves — page kinds, parse issues, hotspots, document meta,
 * and the header block that repeats on every techpack page.
 *
 * Split out of `techpack.zod.ts` so the page/blueprint/image modules can all
 * depend on it without depending on each other (same acyclic-family pattern as
 * `supportContent.shared.zod.ts`). The root file re-exports everything.
 *
 * Every field carries `.catch()`: a techpack is machine-extracted from a
 * third-party PDF, so a malformed value must degrade to blank and surface as an
 * {@link techpackIssueSchema}, never throw and lose the whole document.
 */

/**
 * Page kinds, keyed to the right-aligned title printed in each page's header
 * band. `unknown` is a real outcome, not a failure — a pack from a different
 * supplier will produce them, and `buildDocument` escalates when too many do.
 */
export const TECHPACK_PAGE_KINDS = [
  'colorway-schedule',
  'sizing-guide',
  'technical-sheet',
  'basic-specs',
  'branding-elements',
  'trims-and-notions',
  'pattern-prints',
  'seamless-knits',
  'color-swatches',
  'packaging-and-labels',
  'unknown',
] as const
export type TechpackPageKind = (typeof TECHPACK_PAGE_KINDS)[number]

export const TECHPACK_ISSUE_SEVERITIES = ['error', 'warn', 'info'] as const
export type TechpackIssueSeverity = (typeof TECHPACK_ISSUE_SEVERITIES)[number]

/**
 * The parser's honesty channel and the admin's review queue.
 *
 * Deliberately chosen over per-field confidence wrappers: those double the
 * schema surface and make every consumer unwrap. A flat issue list keyed by
 * `path` gives the same information, stays cheap to render, and lets
 * `techpacks.issue_count` sort the admin list by "needs a human".
 */
export const techpackIssueSchema = z.object({
  /** 1-based PDF page the issue came from; 0 when document-wide. */
  page: z.number().int().min(0).catch(0),
  /** Dotted path into the document, e.g. `sizing.rows.chest.M`. */
  path: z.string().catch(''),
  severity: z.enum(TECHPACK_ISSUE_SEVERITIES).catch('warn'),
  /** Stable machine code, e.g. `sizing_row_not_monotonic`. */
  code: z.string().catch(''),
  message: z.string().catch(''),
})
export type TechpackIssue = z.infer<typeof techpackIssueSchema>

/**
 * A marker position as a PERCENT OF THE FLAT IMAGE BOX (0–100) — never a
 * percent of the PDF page, and never a pixel.
 *
 * The flat is cropped out of the page, so page-relative coordinates would be
 * wrong the moment it is displayed on its own. Percentages of the image also
 * survive any render size. See `pageBoxToImagePercent` in `parse/geometry.ts`.
 */
export const techpackHotspotSchema = z.object({
  x: z.number().min(0).max(100).catch(50),
  y: z.number().min(0).max(100).catch(50),
})
export type TechpackHotspot = z.infer<typeof techpackHotspotSchema>

/** One fibre in the fabric composition, e.g. `{ material: 'COTTON', percentage: 100 }`. */
export const techpackCompositionPartSchema = z.object({
  material: z.string().catch(''),
  /** Null when the pack printed a fibre without a share. */
  percentage: z.number().min(0).max(100).nullable().catch(null),
})
export type TechpackCompositionPart = z.infer<typeof techpackCompositionPartSchema>

/**
 * The header block repeated on every page. Parsed per page, then reduced to the
 * modal value across pages so one mis-read page cannot rewrite the document.
 */
export const techpackHeaderSchema = z.object({
  /** e.g. `MENS OVERSIZED TEE`. */
  product: z.string().catch(''),
  /** e.g. `SOLID (NONE)` or `DOUBLE DYED`. */
  contrast: z.string().catch(''),
  /** e.g. `ANVL-M-SS01-FW26`. */
  style: z.string().catch(''),
  /** The `m` in `COLORWAYS: n OF m`. */
  colorwayCount: z.number().int().min(0).catch(0),
  fabric: z
    .object({
      /** The raw FABRIC line, kept verbatim for audit. */
      raw: z.string().catch(''),
      composition: z.array(techpackCompositionPartSchema).catch([]),
      gsm: z.number().positive().nullable().catch(null),
      /** e.g. `SINGLE JERSEY WEFT KNIT`. */
      construction: z.string().catch(''),
    })
    .catch({ raw: '', composition: [], gsm: null, construction: '' }),
  /** Footer `CLIENT:` value. */
  client: z.string().catch(''),
})
export type TechpackHeader = z.infer<typeof techpackHeaderSchema>

/** Provenance for the parse run itself. */
export const techpackMetaSchema = z.object({
  /** Supplier name is stripped before this is stored — see `parse/strip.ts`. */
  sourceFilename: z.string().catch(''),
  pageCount: z.number().int().min(0).catch(0),
  parserVersion: z.string().catch(''),
  parsedAt: z.string().catch(''),
})
export type TechpackMeta = z.infer<typeof techpackMetaSchema>

/** Classification audit trail — one row per PDF page. */
export const techpackPageRecordSchema = z.object({
  page: z.number().int().min(0).catch(0),
  kind: z.enum(TECHPACK_PAGE_KINDS).catch('unknown'),
  /** The raw title text that drove classification. */
  title: z.string().catch(''),
})
export type TechpackPageRecord = z.infer<typeof techpackPageRecordSchema>
