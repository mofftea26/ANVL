import { cn } from '@/shared/lib/cn'
import type { CareSymbolGroup } from '../hooks/useCareSymbolSearch'
import { CARE_SYMBOL_COMPONENTS } from './careSymbols'

/**
 * The narrow-screen care legend: a real table, grouped by ISO family with
 * sticky category headers, so the meaning of every symbol is on screen with
 * no hover and no popover. Pair it with `CareSymbolGrid` behind a `md:`
 * breakpoint switch — the two render the same resolved groups.
 */
export function CareSymbolTable({
  groups,
  className,
}: {
  groups: readonly CareSymbolGroup[]
  className?: string
}) {
  // `overflow-clip` rather than `overflow-hidden`: it still clips to the
  // rounded corners, but it does NOT establish a scroll container, so the
  // sticky category headers below keep sticking to the viewport.
  return (
    <div className={cn('overflow-clip rounded-lg border border-[var(--color-line)]', className)}>
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">
          Garment care symbols, grouped by category, with their meaning.
        </caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Symbol</th>
            <th scope="col">Instruction</th>
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.id}>
            <tr>
              <th
                scope="colgroup"
                colSpan={2}
                /* Rules via inset shadow, not `border-y`: with
                   `border-collapse: collapse` a sticky cell's own borders stay
                   behind when it detaches, but its box-shadow travels with it. */
                className="sticky top-[var(--anvl-header-h)] z-10 bg-[var(--color-surface-elevated)] px-4 py-2.5 text-xs font-semibold tracking-[0.22em] text-[var(--color-text)] uppercase shadow-[inset_0_1px_0_var(--color-line),inset_0_-1px_0_var(--color-line)]"
              >
                {group.label}
              </th>
            </tr>
            {group.entries.map((entry) => {
              const Glyph = CARE_SYMBOL_COMPONENTS[entry.key]
              return (
                <tr key={entry.key} className="border-b border-[var(--color-line)]">
                  <td className="w-14 px-4 py-3 align-top text-[var(--color-text)]">
                    <Glyph size={28} aria-hidden="true" />
                  </td>
                  <td className="px-2 py-3 pr-4 align-top">
                    <span className="block font-semibold text-[var(--color-text)]">
                      {entry.label}
                    </span>
                    <span className="mt-0.5 block text-[var(--color-text-muted)]">
                      {entry.meaning}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        ))}
      </table>
    </div>
  )
}
