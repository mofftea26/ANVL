import { useCallback, useEffect, useId, useState, type ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import type { CareIconKey } from '@/features/cms/support/supportContent.zod'
import type { CareSymbolGroup } from '../hooks/useCareSymbolSearch'
import { CARE_SYMBOL_COMPONENTS } from './careSymbols'
import { CareSymbolPopover } from './CareSymbolPopover'

/**
 * The care-symbol legend as a wall of sewn-in label swatches, grouped by ISO
 * family. This is the ≥768px presentation — below that, use `CareSymbolTable`,
 * which needs no hover.
 *
 * `mode="edit"` swaps each tile's caption for an editor slot the caller
 * supplies, so the admin Care-symbols tab renders this exact component and
 * previews precisely what ships. Nothing here imports from `features/admin`.
 *
 * Accessibility: the glyph is decorative, the tile's visible label is its
 * accessible name, and the meaning is wired through `aria-describedby` from a
 * sibling node — so it is present for screen readers whether or not the visual
 * popover is open. Escape closes a pinned popover.
 */

export interface CareSymbolCellContext {
  symbolKey: CareIconKey
  label: string
  meaning: string
}

interface CareSymbolGridBaseProps {
  /** Grouped symbols, normally straight from `useCareSymbolSearch`. */
  groups: readonly CareSymbolGroup[]
  /** Heading level for the category headings. Default 3. */
  headingLevel?: 2 | 3 | 4
  className?: string
}

export type CareSymbolGridProps =
  | (CareSymbolGridBaseProps & { mode?: 'view'; renderEditor?: never })
  | (CareSymbolGridBaseProps & {
      mode: 'edit'
      renderEditor: (context: CareSymbolCellContext) => ReactNode
    })

interface OpenTile {
  key: CareIconKey
  el: HTMLElement
  label: string
  meaning: string
}

export function CareSymbolGrid({
  groups,
  mode = 'view',
  renderEditor,
  headingLevel = 3,
  className,
}: CareSymbolGridProps) {
  const baseId = useId()
  const [hovered, setHovered] = useState<OpenTile | null>(null)
  const [pinned, setPinned] = useState<OpenTile | null>(null)
  const open = pinned ?? hovered

  const dismiss = useCallback(() => {
    setPinned(null)
    setHovered(null)
  }, [])

  // A filter change can unmount the pinned tile; drop the reference with it.
  // Keyed on the rendered symbol keys, not the array identity, so a caller
  // passing an inline array does not tear the popover down every render.
  const signature = groups.map((group) => group.entries.map((e) => e.key).join()).join('|')
  useEffect(() => {
    dismiss()
  }, [signature, dismiss])

  const Heading = (['h2', 'h3', 'h4'] as const)[headingLevel - 2]
  const isEdit = mode === 'edit'

  return (
    <div
      className={cn('space-y-10', className)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') dismiss()
      }}
    >
      {groups.map((group) => (
        <section key={group.id} aria-labelledby={`${baseId}-${group.id}`}>
          <div className="flex items-baseline gap-4">
            <Heading
              id={`${baseId}-${group.id}`}
              className="text-xs font-semibold tracking-[0.22em] text-[var(--color-text)] uppercase"
            >
              {group.label}
            </Heading>
            <span className="h-px flex-1 bg-[var(--color-line)]" aria-hidden="true" />
            <span className="text-xs text-[var(--color-text-muted)] tabular-nums">
              {group.entries.length}
            </span>
          </div>

          <ul
            className={cn(
              'mt-5 grid gap-3',
              isEdit
                ? 'grid-cols-1 xl:grid-cols-2'
                : 'grid-cols-2 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6',
            )}
          >
            {group.entries.map((entry) => {
              const Glyph = CARE_SYMBOL_COMPONENTS[entry.key]
              const descriptionId = `${baseId}-${entry.key}-desc`
              const isOpen = open?.key === entry.key

              if (isEdit) {
                return (
                  <li
                    key={entry.key}
                    className="flex gap-4 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-[var(--color-text)]"
                    >
                      <Glyph size={30} />
                    </span>
                    <div className="min-w-0 flex-1">
                      {renderEditor?.({
                        symbolKey: entry.key,
                        label: entry.label,
                        meaning: entry.meaning,
                      })}
                    </div>
                  </li>
                )
              }

              return (
                <li key={entry.key}>
                  <button
                    type="button"
                    aria-describedby={descriptionId}
                    aria-pressed={pinned?.key === entry.key}
                    onPointerEnter={(event) => setHovered({ ...entry, el: event.currentTarget })}
                    onPointerLeave={() => setHovered(null)}
                    onFocus={(event) => setHovered({ ...entry, el: event.currentTarget })}
                    onBlur={() => setHovered(null)}
                    onClick={(event) => {
                      const el = event.currentTarget
                      setPinned((current) =>
                        current?.key === entry.key ? null : { ...entry, el },
                      )
                    }}
                    className={cn(
                      'focus-ring flex h-full min-h-[6.5rem] w-full flex-col items-center justify-center gap-2 rounded-md border px-2 py-4 transition-colors',
                      isOpen
                        ? 'border-[var(--color-highlight-bright)] bg-[var(--color-highlight-soft)] text-[var(--color-highlight-bright)]'
                        : 'border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-text)]',
                    )}
                  >
                    <Glyph size={30} aria-hidden="true" />
                    <span
                      className={cn(
                        'text-center text-[0.625rem] leading-tight tracking-[0.1em] uppercase',
                        isOpen
                          ? 'font-semibold text-[var(--color-text)]'
                          : 'text-[var(--color-text-muted)]',
                      )}
                    >
                      {entry.label}
                    </span>
                  </button>
                  <span id={descriptionId} className="sr-only">
                    {entry.meaning}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      {open ? (
        <CareSymbolPopover
          anchorEl={open.el}
          label={open.label}
          meaning={open.meaning}
          onDismiss={dismiss}
        />
      ) : null}
    </div>
  )
}
