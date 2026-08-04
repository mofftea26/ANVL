import {
  SIZE_TABLE_SIZES,
  type SizeTable,
  type SizeTableRow,
  type SizeTableSize,
} from '@/features/cms/support/supportContent.zod'
import { GARMENT_TYPE_KEYS, type GarmentTypeKey } from '@/features/cms/support/supportContent.size.zod'
import { formatMeasurement, inchesToCm } from '@/features/techpacks/parse/normalize'
import type { TechpackHeader, TechpackSizing } from '@/features/techpacks/schema/techpack.zod'

/**
 * Techpack sizing table → the site's structured size table.
 *
 * The row vocabularies line up exactly — the packs print CB Length, Chest,
 * Waist, Bottom, Collar, Sleeve and Cuff, and the site's `SIZE_TABLE_ROW_KEYS`
 * are those same seven — which is what makes this import trustworthy rather
 * than a mapping exercise.
 *
 * The unit does NOT line up, and that is the single highest-risk fact in this
 * whole feature. Packs are in INCHES; the storefront renders "Measurement (cm)"
 * and the admin editor says "Values in centimetres". Importing the printed
 * numbers unconverted would make every customer size wrong, and nothing in the
 * system would look broken. Hence the conversion here and the plausibility
 * guard below it.
 */

/** Plausible garment measurements in CENTIMETRES, after conversion. */
const MIN_PLAUSIBLE_CM = 8
const MAX_PLAUSIBLE_CM = 180

/** Printed size heading → the site's fixed size column. */
const SIZE_ALIASES: ReadonlyArray<{ re: RegExp; size: SizeTableSize }> = [
  { re: /^(?:XXS|2XS)$/i, size: 'XS' },
  { re: /^(?:XS|X-?\s*SMALL|EXTRA\s*SMALL)$/i, size: 'XS' },
  { re: /^(?:S|SMALL)$/i, size: 'S' },
  { re: /^(?:M|MED|MEDIUM)$/i, size: 'M' },
  { re: /^(?:L|LARGE)$/i, size: 'L' },
  { re: /^(?:XL|X-?\s*LARGE|EXTRA\s*LARGE)$/i, size: 'XL' },
  { re: /^(?:XXL|2XL|XX-?\s*LARGE)$/i, size: 'XXL' },
]

function resolveSizeColumn(printed: string): SizeTableSize | null {
  const text = printed.trim()
  for (const { re, size } of SIZE_ALIASES) {
    if (re.test(text)) return size
  }
  return null
}

/** Garment type from the pack's product name, defaulting to the commonest cut. */
export function resolveGarmentType(header: TechpackHeader): GarmentTypeKey {
  const product = header.product.toUpperCase()
  const guesses: ReadonlyArray<{ re: RegExp; key: GarmentTypeKey }> = [
    { re: /STRINGER|TANK|VEST/, key: 'stringer' },
    { re: /HOOD|SWEAT|CREW\s*NECK/, key: 'hoodie' },
    { re: /JOGGER|PANT|TROUSER|LEGGING/, key: 'joggers' },
    { re: /SHORT/, key: 'shorts' },
    { re: /TEE|T-?SHIRT|SHIRT|TOP/, key: 'tee' },
  ]
  for (const { re, key } of guesses) {
    if (re.test(product)) return key
  }
  return GARMENT_TYPE_KEYS[0]
}

export interface SizeTableConversion {
  table: SizeTable
  /** Printed rows with no matching site row — reported, never guessed at. */
  unmapped: string[]
  /** Anything an operator should see before accepting the import. */
  warnings: string[]
}

/**
 * Build the site's size table from a techpack's sizing page.
 *
 * Values are converted to centimetres and every converted number is bounds-
 * checked. A value outside the plausible range almost always means the
 * conversion did not happen — which is exactly the failure that is invisible
 * downstream — so it is surfaced rather than written.
 */
export function techpackToSizeTable(sizing: TechpackSizing): SizeTableConversion {
  const warnings: string[] = []
  const unmapped: string[] = []

  // Printed column index → index in the site's fixed XS…XXL grid.
  const columnToSlot = sizing.sizes.map((printed) => {
    const size = resolveSizeColumn(printed)
    if (!size) {
      warnings.push(`Size column "${printed}" is not one of ${SIZE_TABLE_SIZES.join(', ')}.`)
      return -1
    }
    return SIZE_TABLE_SIZES.indexOf(size)
  })

  const rows: SizeTableRow[] = []

  for (const row of sizing.rows) {
    if (!row.rowKey) {
      unmapped.push(row.label)
      continue
    }

    // Always exactly one slot per site size; unoffered sizes stay blank.
    const values: string[] = SIZE_TABLE_SIZES.map(() => '')

    row.values.forEach((raw, columnIndex) => {
      const slot = columnToSlot[columnIndex] ?? -1
      if (slot < 0 || raw === null) return

      const centimetres = sizing.unit === 'in' ? inchesToCm(raw) : raw
      if (centimetres < MIN_PLAUSIBLE_CM || centimetres > MAX_PLAUSIBLE_CM) {
        warnings.push(
          `"${row.label}" ${SIZE_TABLE_SIZES[slot]} converts to ${centimetres}cm, which is outside the plausible range — check the source unit.`,
        )
        return
      }
      values[slot] = formatMeasurement(centimetres)
    })

    rows.push({ key: row.rowKey, values })
  }

  return {
    table: {
      rows,
      // The packs measure half-widths on a garment laid flat, which is what
      // this flag means on the storefront table.
      halfMeasurement: sizing.rows.some((row) => row.isHalf),
    },
    unmapped,
    warnings,
  }
}

/**
 * The `fit.measurements` lines the passport shows — `"Chest|61 cm"`.
 *
 * Uses the middle size as the reference, because a single printed figure is
 * only meaningful if the reader knows which size it describes, and the middle
 * of a graded run is the least misleading choice.
 */
export function techpackToFitMeasurements(sizing: TechpackSizing): {
  lines: string[]
  referenceSize: string
} {
  const columnIndex = Math.floor(Math.max(0, sizing.sizes.length - 1) / 2)
  const referenceSize = sizing.sizes[columnIndex] ?? ''

  const lines: string[] = []
  for (const row of sizing.rows) {
    const raw = row.values[columnIndex]
    if (raw === null || raw === undefined) continue
    const centimetres = sizing.unit === 'in' ? inchesToCm(raw) : raw
    if (centimetres < MIN_PLAUSIBLE_CM || centimetres > MAX_PLAUSIBLE_CM) continue
    const label = row.label
      .replace(/\s*1\s*\/\s*2\s*/g, ' ')
      .replace(/\bWIDTH\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
    lines.push(`${titleCase(label)}|${formatMeasurement(centimetres)} cm`)
  }

  return { lines, referenceSize }
}

function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ')
    .trim()
}

/** Printed size headings → the site's size keys, for `fit.sizeEquivalence`. */
export function techpackToSizeEquivalence(sizing: TechpackSizing): Record<string, string> {
  const out: Record<string, string> = {}
  for (const printed of sizing.sizes) {
    const size = resolveSizeColumn(printed)
    if (size) out[printed] = size
  }
  return out
}
