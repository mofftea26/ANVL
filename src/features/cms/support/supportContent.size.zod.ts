import { z } from 'zod'

import { obj, pickKeys, pickStringArray } from './parseUtils'

/**
 * Size guide schemas — global intro/note + "Where we measure" points + the
 * per-product measurement tables (keyed by slug). Split out of
 * `supportContent.zod.ts` (Task 4 of the guides-cms-nav-particles plan)
 * purely to keep that file under the 300/500-line size limits; behavior is
 * unchanged. Depends only on `parseUtils` — never on the care-guide module
 * or the root file, so the dependency graph stays acyclic.
 *
 * Two authoring generations coexist for per-product tables (ADDITIVE — old
 * blobs stay valid):
 * - legacy free-form `columns` + `rows` (row = one size, values per column)
 * - structured `table` (fixed size columns XS–XXL, fixed measurement rows)
 * `resolveSizeTable` in `resolveSupportContent.ts` prefers `table` when any
 * cell is filled and falls back to the legacy shape otherwise.
 */
export const sizeRowSchema = z
  .object({
    id: z.string().catch(''),
    size: z.string().catch(''),
    values: z.array(z.string()).catch([]),
  })
  .strict()
export type SizeRow = z.infer<typeof sizeRowSchema>

/** Fixed size columns of the structured table — one value slot per size. */
export const SIZE_TABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const
export type SizeTableSize = (typeof SIZE_TABLE_SIZES)[number]

/** Fixed measurement rows of the structured table, in display order. */
export const SIZE_TABLE_ROW_KEYS = [
  'length',
  'chest',
  'waist',
  'bottom',
  'collar',
  'sleeve',
  'cuff',
] as const
export type SizeTableRowKey = (typeof SIZE_TABLE_ROW_KEYS)[number]

export const SIZE_TABLE_ROW_LABELS: Record<SizeTableRowKey, string> = {
  length: 'Body length',
  chest: 'Chest',
  waist: 'Waist',
  bottom: 'Hem',
  collar: 'Neck opening',
  sleeve: 'Sleeve length',
  cuff: 'Cuff opening',
}

/* --------------------------------------------------------------------------- *
 * "Where we measure" — CMS-editable measurement points, grouped per garment
 * type (a stringer has no sleeve/cuff; joggers have no chest/collar). Point
 * geometry is code-owned (`supportContent.defaults.ts`) — CMS edits copy only.
 * --------------------------------------------------------------------------- */
export const GARMENT_TYPE_KEYS = ['tee', 'stringer', 'hoodie', 'joggers', 'shorts'] as const
export type GarmentTypeKey = (typeof GARMENT_TYPE_KEYS)[number]

export const measurePointSchema = z
  .object({
    key: z.enum(SIZE_TABLE_ROW_KEYS),
    letter: z.string().catch(''),
    label: z.string().catch(''),
    description: z.string().catch(''),
  })
  .strict()
export type MeasurePoint = z.infer<typeof measurePointSchema>

export const garmentTypeContentSchema = z
  .object({
    key: z.enum(GARMENT_TYPE_KEYS),
    label: z.string().catch(''),
    points: z.array(measurePointSchema).catch([]),
  })
  .strict()
export type GarmentTypeContent = z.infer<typeof garmentTypeContentSchema>

export const sizeMeasureSchema = z
  .object({
    heading: z.string().catch(''),
    intro: z.string().catch(''),
    footnote: z.string().catch(''),
    garmentTypes: z.array(garmentTypeContentSchema).catch([]),
  })
  .strict()
export type SizeMeasure = z.infer<typeof sizeMeasureSchema>

export const sizeTableRowSchema = z
  .object({
    key: z.enum(SIZE_TABLE_ROW_KEYS),
    /** One value per size in {@link SIZE_TABLE_SIZES}; '' = size not offered. */
    values: z.array(z.string()).catch([]),
  })
  .strict()
export type SizeTableRow = z.infer<typeof sizeTableRowSchema>

export const sizeTableSchema = z
  .object({
    rows: z.array(sizeTableRowSchema).catch([]),
    /** Widths are HALF measurements (garment laid flat) when true. */
    halfMeasurement: z.boolean().catch(true),
  })
  .strict()
export type SizeTable = z.infer<typeof sizeTableSchema>

export const sizeProductEntrySchema = z
  .object({
    note: z.string().catch(''),
    /** Legacy free-form table — kept forever for backward compat. */
    columns: z.array(z.string()).catch([]),
    rows: z.array(sizeRowSchema).catch([]),
    /** Structured fixed-grid table — preferred at resolve time when filled. */
    table: sizeTableSchema.optional(),
    /** Which garment type's "Where we measure" point set applies. Absent/invalid → 'tee'. */
    garmentType: z.enum(GARMENT_TYPE_KEYS).optional(),
  })
  .strict()
export type SizeProductEntry = z.infer<typeof sizeProductEntrySchema>

export const supportSizeGuideSchema = z
  .object({
    intro: z.string().catch(''),
    note: z.string().catch(''),
    measure: sizeMeasureSchema,
    perProduct: z.record(z.string(), sizeProductEntrySchema).catch({}),
  })
  .strict()

/* --------------------------------------------------------------------------- *
 * Tolerant deep-pick parse helpers for the size guide block.
 * --------------------------------------------------------------------------- */

const SIZE_ROW_KEY_SET: ReadonlySet<string> = new Set(SIZE_TABLE_ROW_KEYS)
const GARMENT_TYPE_KEY_SET: ReadonlySet<string> = new Set(GARMENT_TYPE_KEYS)

/** Pick one measurement point; a point with an invalid/missing `key` is dropped
 * entirely (its key is what makes it addressable at resolve time). */
function pickMeasurePoint(raw: unknown): Record<string, unknown> | null {
  const v = obj(raw)
  if (typeof v.key !== 'string' || !SIZE_ROW_KEY_SET.has(v.key)) return null
  return {
    key: v.key,
    letter: '',
    label: '',
    description: '',
    ...pickKeys(v, ['letter', 'label', 'description']),
  }
}

function pickMeasurePoints(raw: unknown): Record<string, unknown>[] {
  if (!Array.isArray(raw)) return []
  return raw.map(pickMeasurePoint).filter((p): p is Record<string, unknown> => p !== null)
}

/** Pick one garment-type content block; a block with an invalid/missing `key`
 * is dropped entirely (mirrors `pickMeasurePoint`). */
function pickGarmentType(raw: unknown): Record<string, unknown> | null {
  const v = obj(raw)
  if (typeof v.key !== 'string' || !GARMENT_TYPE_KEY_SET.has(v.key)) return null
  return {
    key: v.key,
    label: '',
    ...pickKeys(v, ['label']),
    points: pickMeasurePoints(v.points),
  }
}

function pickGarmentTypes(raw: unknown): Record<string, unknown>[] {
  if (!Array.isArray(raw)) return []
  return raw.map(pickGarmentType).filter((g): g is Record<string, unknown> => g !== null)
}

function pickSizeMeasure(raw: unknown): Record<string, unknown> {
  const v = obj(raw)
  return {
    heading: '',
    intro: '',
    footnote: '',
    ...pickKeys(v, ['heading', 'intro', 'footnote']),
    garmentTypes: pickGarmentTypes(v.garmentTypes),
  }
}

/** Pick a structured size table (rows with invalid keys are dropped, values
 * padded/truncated to one slot per fixed size column). `undefined` when absent. */
function pickSizeTable(raw: unknown): Record<string, unknown> | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const v = raw as Record<string, unknown>
  const rows = Array.isArray(v.rows)
    ? v.rows
        .filter((row) => {
          const rowObj = obj(row)
          return typeof rowObj.key === 'string' && SIZE_ROW_KEY_SET.has(rowObj.key)
        })
        .map((row) => {
          const rowObj = obj(row)
          const values = pickStringArray(rowObj.values).slice(0, SIZE_TABLE_SIZES.length)
          while (values.length < SIZE_TABLE_SIZES.length) values.push('')
          return { key: rowObj.key, values }
        })
    : []
  return {
    rows,
    halfMeasurement: 'halfMeasurement' in v ? v.halfMeasurement : true,
  }
}

function pickSizePerProduct(raw: unknown): Record<string, unknown> {
  const r = obj(raw)
  const out: Record<string, unknown> = {}
  for (const [slug, value] of Object.entries(r)) {
    if (!slug.trim()) continue
    const v = obj(value)
    const rows = Array.isArray(v.rows)
      ? v.rows.map((row) => {
          const rowObj = obj(row)
          return {
            id: 'id' in rowObj ? rowObj.id : '',
            size: 'size' in rowObj ? rowObj.size : '',
            values: pickStringArray(rowObj.values),
          }
        })
      : []
    const table = pickSizeTable(v.table)
    const garmentType =
      typeof v.garmentType === 'string' && GARMENT_TYPE_KEY_SET.has(v.garmentType)
        ? v.garmentType
        : undefined
    out[slug] = {
      note: 'note' in v ? v.note : '',
      columns: pickStringArray(v.columns),
      rows,
      ...(table ? { table } : {}),
      ...(garmentType ? { garmentType } : {}),
    }
  }
  return out
}

/**
 * Deep-pick a whole raw `sizeGuide` blob into a schema-ready shape. The
 * caller (`parseSupportContent`) still spreads the blank defaults underneath
 * — this only fills in keys that are actually present in `raw`, plus the
 * always-computed `measure`/`perProduct` blocks.
 */
export function pickSizeGuide(raw: unknown): Record<string, unknown> {
  const v = obj(raw)
  return {
    ...pickKeys(v, ['intro', 'note']),
    measure: pickSizeMeasure(v.measure),
    perProduct: pickSizePerProduct(v.perProduct),
  }
}
