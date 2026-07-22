import {
  SIZE_TABLE_ROW_KEYS,
  SIZE_TABLE_SIZES,
  type CareItem,
  type CareProductEntry,
  type SizeProductEntry,
  type SizeTable,
  type SizeTableRow,
  type SizeTableRowKey,
} from './supportContent.zod'

/**
 * One-way legacy → structured converters used by the admin "Convert to
 * structured" actions. Both are conservative and NON-DESTRUCTIVE: they only
 * produce the new fields — callers keep the legacy `lines`/`columns`/`rows`
 * untouched on the stored entry.
 */

/** Map legacy free-text care lines to generic structured items (neutral icon). */
export function convertLegacyCareLines(entry: CareProductEntry): CareItem[] {
  return entry.lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line, index) => ({
      id: `care-converted-${index}`,
      icon: 'generic' as const,
      name: line,
      value: '',
      note: '',
    }))
}

/** Normalize a legacy size label onto a fixed structured column, or null. */
export function matchSizeColumn(size: string): (typeof SIZE_TABLE_SIZES)[number] | null {
  const s = size.trim().toUpperCase().replace(/\s+/g, '')
  if ((SIZE_TABLE_SIZES as readonly string[]).includes(s)) {
    return s as (typeof SIZE_TABLE_SIZES)[number]
  }
  // Common aliases only — anything else is left unmapped (be conservative).
  const aliases: Record<string, (typeof SIZE_TABLE_SIZES)[number]> = {
    'X-SMALL': 'XS',
    SMALL: 'S',
    MEDIUM: 'M',
    LARGE: 'L',
    'X-LARGE': 'XL',
    'XX-LARGE': 'XXL',
    '2XL': 'XXL',
  }
  return aliases[s] ?? null
}

/** Heuristic: legacy measurement column heading → structured row key, or null. */
export function matchMeasurementRow(column: string): SizeTableRowKey | null {
  const c = column.trim().toLowerCase()
  if (!c) return null
  if (/cuff/.test(c)) return 'cuff'
  if (/sleeve|arm/.test(c)) return 'sleeve'
  if (/collar|neck/.test(c)) return 'collar'
  if (/bottom|hem/.test(c)) return 'bottom'
  if (/waist/.test(c)) return 'waist'
  if (/chest|bust/.test(c)) return 'chest'
  if (/length|long/.test(c)) return 'length'
  return null
}

/**
 * Convert a legacy free-form size table (rows = sizes, columns = measurements)
 * into the fixed structured grid (rows = measurements, columns = XS–XXL).
 * Sizes that don't map to a fixed column and measurement columns that don't
 * match any heuristic are skipped — except that the FIRST unmappable
 * measurement column falls into the still-empty `length` row, so a
 * single-column legacy table always converts to something visible.
 */
export function convertLegacySizeEntry(entry: SizeProductEntry): SizeTable {
  const cells: Partial<Record<SizeTableRowKey, string[]>> = {}
  const blankRow = () => SIZE_TABLE_SIZES.map(() => '')

  // Resolve each legacy measurement column to a structured row key.
  const rowKeyByColumn: (SizeTableRowKey | null)[] = []
  let lengthClaimed = entry.columns.some((col) => matchMeasurementRow(col) === 'length')
  for (const column of entry.columns) {
    let key = matchMeasurementRow(column)
    if (key === null && !lengthClaimed) {
      key = 'length'
      lengthClaimed = true
    }
    rowKeyByColumn.push(key)
  }

  for (const row of entry.rows) {
    const size = matchSizeColumn(row.size)
    if (!size) continue
    const sizeIndex = SIZE_TABLE_SIZES.indexOf(size)
    rowKeyByColumn.forEach((rowKey, columnIndex) => {
      if (!rowKey) return
      const value = (row.values[columnIndex] ?? '').trim()
      if (!value) return
      const target = (cells[rowKey] ??= blankRow())
      if (!target[sizeIndex]) target[sizeIndex] = value
    })
  }

  const rows: SizeTableRow[] = SIZE_TABLE_ROW_KEYS.map((key) => ({
    key,
    values: cells[key] ?? blankRow(),
  }))
  return { rows, halfMeasurement: true }
}
