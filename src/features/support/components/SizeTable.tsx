import type { SizeProductEntry } from '@/features/cms/support/supportContent.zod'

/**
 * Renders one product's measurement table from an authored `SizeProductEntry`
 * (a `Size` column plus the authored measurement `columns`, one row per size).
 * Horizontally scrollable on small screens so the page never overflows.
 */
export function SizeTable({ entry }: { entry: SizeProductEntry }) {
  const hasRows = entry.rows.length > 0
  return (
    <div className="space-y-4">
      {entry.note.trim() ? (
        <p className="max-w-3xl text-sm text-[var(--color-text-muted)]">{entry.note}</p>
      ) : null}
      {hasRows ? (
        <div className="overflow-x-auto rounded-lg border border-[var(--color-line)]">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className="border-b-2 border-[color-mix(in_oklab,var(--color-highlight)_40%,var(--color-line))] bg-[var(--color-surface)] px-4 py-3 font-semibold text-[var(--color-text)]">
                  Size
                </th>
                {entry.columns.map((column, i) => (
                  <th
                    key={`${column}-${i}`}
                    className="border-b-2 border-[color-mix(in_oklab,var(--color-highlight)_40%,var(--color-line))] bg-[var(--color-surface)] px-4 py-3 font-semibold text-[var(--color-text)]"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entry.rows.map((row) => (
                <tr key={row.id || row.size}>
                  <td className="border-b border-[var(--color-line)] px-4 py-3 font-medium text-[var(--color-text)]">
                    {row.size}
                  </td>
                  {entry.columns.map((_, columnIndex) => (
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
