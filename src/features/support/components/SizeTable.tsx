import {
  SIZE_TABLE_ROW_LABELS,
  type SizeProductEntry,
} from '@/features/cms/support/supportContent.zod'
import { resolveSizeTable } from '@/features/cms/support/resolveSupportContent'

const HEAD_CELL_CLASS =
  'border-b-2 border-[color-mix(in_oklab,var(--color-highlight)_40%,var(--color-line))] bg-[var(--color-surface)] px-4 py-3 font-semibold text-[var(--color-text)]'

/**
 * Renders one product's measurement table from an authored `SizeProductEntry`.
 * The structured fixed grid (measurement rows × XS–XXL size columns, cm) wins
 * when any cell is filled; the legacy free-form table (size rows × authored
 * measurement columns) renders otherwise — resolution via `resolveSizeTable`.
 * Horizontally scrollable on small screens so the page never overflows.
 */
export function SizeTable({ entry }: { entry: SizeProductEntry }) {
  const table = resolveSizeTable(entry)
  return (
    <div className="space-y-4">
      {entry.note.trim() ? (
        <p className="max-w-3xl text-sm text-[var(--color-text-muted)]">{entry.note}</p>
      ) : null}
      {table?.kind === 'structured' ? (
        <>
          <div className="overflow-x-auto rounded-lg border border-[var(--color-line)]">
            <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
              <thead>
                <tr>
                  <th className={HEAD_CELL_CLASS}>Measurement (cm)</th>
                  {table.sizes.map((size) => (
                    <th key={size} className={HEAD_CELL_CLASS}>
                      {size}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row) => (
                  <tr key={row.key}>
                    <td className="border-b border-[var(--color-line)] px-4 py-3 font-medium text-[var(--color-text)]">
                      {SIZE_TABLE_ROW_LABELS[row.key]}
                    </td>
                    {table.sizes.map((_, columnIndex) => (
                      <td
                        key={columnIndex}
                        className="border-b border-[var(--color-line)] px-4 py-3 text-[var(--color-text-muted)]"
                      >
                        {(row.values[columnIndex] ?? '').trim() || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {table.halfMeasurement ? (
            <p className="max-w-3xl text-xs text-[var(--color-text-muted)]">
              Widths are half measurements, taken with the garment laid flat — double them
              for the full circumference. A dash means that size is not offered.
            </p>
          ) : null}
        </>
      ) : null}
      {table?.kind === 'legacy' ? (
        <div className="overflow-x-auto rounded-lg border border-[var(--color-line)]">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className={HEAD_CELL_CLASS}>Size</th>
                {table.columns.map((column, i) => (
                  <th key={`${column}-${i}`} className={HEAD_CELL_CLASS}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => (
                <tr key={row.id || row.size}>
                  <td className="border-b border-[var(--color-line)] px-4 py-3 font-medium text-[var(--color-text)]">
                    {row.size}
                  </td>
                  {table.columns.map((_, columnIndex) => (
                    <td
                      key={columnIndex}
                      className="border-b border-[var(--color-line)] px-4 py-3 text-[var(--color-text-muted)]"
                    >
                      {row.values[columnIndex] ?? ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
