import { useEffect, useMemo, useState } from 'react'

import { AlertTriangle, Check, FileText, Search } from '@/shared/icons'
import { Input } from '@/shared/components/ui/Input'
import { cn } from '@/shared/lib/cn'

import type { AdminTechpack } from '../techpacks.service'

/**
 * The techpack chooser inside the import modal.
 *
 * Shaped after `ProductPickerModal` — debounced search over a card grid with
 * `aria-pressed` selection — because an operator picking a techpack is doing
 * the same job as one picking a product, and two different pickers in the same
 * admin would be gratuitous.
 *
 * The card surfaces the two things that decide whether a pack is the right one:
 * whether it is the FINAL pack for its product, and how many parser issues it
 * carries. A pack with unresolved issues is importable, but the operator should
 * know before they lean on it.
 */

const SEARCH_DEBOUNCE_MS = 250

function useDebounced(value: string, delay = SEARCH_DEBOUNCE_MS): string {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return ''
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`
}

export function TechpackPickerGrid({
  techpacks,
  selectedId,
  onSelect,
  emptyMessage = 'No techpacks have been uploaded yet.',
}: {
  techpacks: readonly AdminTechpack[]
  selectedId: string | null
  onSelect: (id: string) => void
  emptyMessage?: string
}) {
  const [query, setQuery] = useState('')
  const debounced = useDebounced(query).trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!debounced) return techpacks
    return techpacks.filter((pack) =>
      [pack.title, pack.productSlug, pack.sourceFilename, pack.status]
        .join(' ')
        .toLowerCase()
        .includes(debounced),
    )
  }, [techpacks, debounced])

  return (
    <div className="space-y-4">
      <label className="relative block">
        <span className="sr-only">Search techpacks</span>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]"
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, product or file"
          className="pl-9"
          density="compact"
        />
      </label>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--color-line)] p-6 text-center text-sm text-[var(--color-text-muted)]">
          {debounced ? `No techpacks match “${query}”.` : emptyMessage}
        </p>
      ) : (
        <ul className="grid max-h-[22rem] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
          {filtered.map((pack) => {
            const isSelected = pack.id === selectedId
            return (
              <li key={pack.id}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelect(pack.id)}
                  className={cn(
                    'focus-ring relative w-full rounded-xl border p-4 text-left transition-colors',
                    isSelected
                      ? 'border-[var(--color-highlight)] bg-[color-mix(in_oklab,var(--color-highlight)_10%,transparent)]'
                      : 'border-[var(--color-line)] hover:border-[var(--color-highlight)]',
                  )}
                >
                  {isSelected ? (
                    <Check
                      aria-hidden="true"
                      className="absolute top-3 right-3 h-4 w-4 text-[var(--color-highlight-bright)]"
                    />
                  ) : null}

                  <span className="flex items-start gap-3">
                    <FileText
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-muted)]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-[var(--color-heading)]">
                        {pack.title || pack.sourceFilename || 'Untitled techpack'}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[var(--color-text-muted)]">
                        {pack.productSlug || 'Not assigned to a product'}
                        {pack.pageCount > 0 ? ` · ${pack.pageCount} pages` : ''}
                        {formatBytes(pack.sourceByteSize)
                          ? ` · ${formatBytes(pack.sourceByteSize)}`
                          : ''}
                      </span>
                    </span>
                  </span>

                  <span className="mt-3 flex flex-wrap items-center gap-2">
                    {pack.isFinal ? (
                      <span className="anvl-micro rounded-full bg-[color-mix(in_oklab,var(--color-highlight)_20%,transparent)] px-2 py-0.5 text-[10px] text-[var(--color-highlight-bright)]">
                        Final
                      </span>
                    ) : null}
                    <span className="anvl-micro rounded-full border border-[var(--color-line)] px-2 py-0.5 text-[10px] text-[var(--color-text-muted)]">
                      {pack.status}
                    </span>
                    {pack.issueCount > 0 ? (
                      <span className="anvl-micro inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] text-[var(--color-warning)]">
                        <AlertTriangle aria-hidden="true" className="h-3 w-3" />
                        {pack.issueCount} to review
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
