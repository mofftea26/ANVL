import { useRef, type KeyboardEvent } from 'react'
import {
  SIZE_TABLE_ROW_KEYS,
  SIZE_TABLE_ROW_LABELS,
  SIZE_TABLE_SIZES,
  type SizeTable,
  type SizeTableRow,
} from '@/features/cms/support/supportContent.zod'
import { Switch } from '@/shared/components/ui/Switch'
import { cn } from '@/shared/lib/cn'

/** Decimals only (dot or comma), possibly still being typed — or empty. */
const CELL_PATTERN = /^\d*(?:[.,]\d*)?$/

export const EMPTY_SIZE_TABLE: SizeTable = {
  rows: SIZE_TABLE_ROW_KEYS.map((key) => ({
    key,
    values: SIZE_TABLE_SIZES.map(() => ''),
  })),
  halfMeasurement: true,
}

/** Full canonical grid — every fixed row present, values padded to 6 slots. */
function normalizeTable(value: SizeTable | undefined): SizeTable {
  if (!value) return structuredClone(EMPTY_SIZE_TABLE)
  const rows: SizeTableRow[] = SIZE_TABLE_ROW_KEYS.map((key) => {
    const existing = value.rows.find((row) => row.key === key)
    const values = (existing?.values ?? []).slice(0, SIZE_TABLE_SIZES.length)
    while (values.length < SIZE_TABLE_SIZES.length) values.push('')
    return { key, values }
  })
  return { rows, halfMeasurement: value.halfMeasurement }
}

interface SizeGuideTableProps {
  value: SizeTable | undefined
  onChange: (next: SizeTable) => void
}

/**
 * Fixed-grid measurement editor: 7 measurement rows × 6 size columns (XS–XXL)
 * of decimal inputs in centimetres — leave a cell empty when the size is not
 * offered. Arrow keys move focus between cells; the grid scrolls horizontally
 * on narrow screens. A toggle records whether widths are half measurements
 * (garment laid flat), surfaced to customers as a table hint.
 */
export function SizeGuideTable({ value, onChange }: SizeGuideTableProps) {
  const table = normalizeTable(value)
  const cellRefs = useRef<(HTMLInputElement | null)[]>([])
  const cellIndex = (row: number, column: number) => row * SIZE_TABLE_SIZES.length + column

  const setCell = (rowIndex: number, columnIndex: number, raw: string) => {
    const next = raw.trim()
    if (!CELL_PATTERN.test(next)) return
    onChange({
      ...table,
      rows: table.rows.map((row, r) =>
        r === rowIndex
          ? { ...row, values: row.values.map((v, c) => (c === columnIndex ? next : v)) }
          : row,
      ),
    })
  }

  const onCellKeyDown = (event: KeyboardEvent<HTMLInputElement>, row: number, column: number) => {
    const input = event.currentTarget
    let target: number | null = null
    if (event.key === 'ArrowUp' && row > 0) target = cellIndex(row - 1, column)
    else if (event.key === 'ArrowDown' && row < SIZE_TABLE_ROW_KEYS.length - 1)
      target = cellIndex(row + 1, column)
    else if (
      event.key === 'ArrowLeft' &&
      column > 0 &&
      input.selectionStart === 0 &&
      input.selectionEnd === 0
    )
      target = cellIndex(row, column - 1)
    else if (
      event.key === 'ArrowRight' &&
      column < SIZE_TABLE_SIZES.length - 1 &&
      input.selectionStart === input.value.length &&
      input.selectionEnd === input.value.length
    )
      target = cellIndex(row, column + 1)
    if (target !== null) {
      event.preventDefault()
      const el = cellRefs.current[target]
      el?.focus()
      el?.select()
    }
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-[var(--color-line)]">
        <table className="w-full min-w-[34rem] border-collapse text-left text-xs">
          <thead>
            <tr>
              <th
                scope="col"
                className="border-b border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 font-semibold text-[var(--color-text)]"
              >
                Measurement (cm)
              </th>
              {SIZE_TABLE_SIZES.map((size) => (
                <th
                  scope="col"
                  key={size}
                  className="border-b border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-2 text-center font-semibold text-[var(--color-text)]"
                >
                  {size}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={row.key}>
                <th
                  scope="row"
                  className="border-b border-[var(--color-line)] px-3 py-1.5 text-left font-medium text-[var(--color-text)]"
                >
                  {SIZE_TABLE_ROW_LABELS[row.key]}
                </th>
                {SIZE_TABLE_SIZES.map((size, columnIndex) => (
                  <td key={size} className="border-b border-[var(--color-line)] px-1 py-1.5">
                    <input
                      ref={(el) => {
                        cellRefs.current[cellIndex(rowIndex, columnIndex)] = el
                      }}
                      type="text"
                      inputMode="decimal"
                      aria-label={`${SIZE_TABLE_ROW_LABELS[row.key]}, size ${size}, in centimetres`}
                      value={row.values[columnIndex] ?? ''}
                      onChange={(e) => setCell(rowIndex, columnIndex, e.target.value)}
                      onKeyDown={(e) => onCellKeyDown(e, rowIndex, columnIndex)}
                      className={cn(
                        'focus-ring h-8 w-full min-w-[3.25rem] rounded border border-transparent bg-[var(--color-bg)]/40 px-1.5 text-center text-base text-[var(--color-text)] outline-none transition-colors md:text-xs',
                        'hover:border-[var(--color-line)] focus:border-[var(--color-accent)]',
                      )}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-[var(--color-text-muted)]">
        Values in centimetres; decimals allowed. Leave a cell empty when that size is not
        offered. Arrow keys move between cells.
      </p>
      <Switch
        checked={table.halfMeasurement}
        onChange={(halfMeasurement) => onChange({ ...table, halfMeasurement })}
        label="Half measurements"
        description="Widths are taken with the garment laid flat (half the circumference). Customers see this explained under the table."
        size="sm"
      />
    </div>
  )
}
