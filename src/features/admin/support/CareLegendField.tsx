import { useId, useMemo } from 'react'
import { RotateCcw, Search } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { cn } from '@/shared/lib/cn'
import { resolveCareLegend } from '@/features/cms/support/resolveSupportContent'
import type {
  CareLegend,
  CareLegendEntry,
  SupportContentConfig,
} from '@/features/cms/support/supportContent.zod'
import { CareSymbolGrid, type CareSymbolCellContext } from '@/features/support/components'
import { useCareSymbolSearch } from '@/features/support/hooks/useCareSymbolSearch'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui/Textarea'

function withoutEntry(
  entries: Record<string, CareLegendEntry>,
  key: string,
): Record<string, CareLegendEntry> {
  const next = { ...entries }
  delete next[key]
  return next
}

interface CareLegendFieldProps {
  config: SupportContentConfig
  onChange: (next: CareLegend) => void
}

/**
 * Care-symbol legend editor — reuses the storefront's own `CareSymbolGrid` in
 * `mode="edit"` and its `useCareSymbolSearch` hook, so the same search and
 * category filter that ships on `/care-guide` also drives this tab: what the
 * admin sees is exactly what the storefront renders. Each tile's `renderEditor`
 * supplies a label + meaning editor plus a per-entry "Reset to default".
 *
 * `careGuide.legend.entries` is OVERRIDES-ONLY: an entry the admin has not
 * touched must stay absent from the persisted blob (never a copy of the
 * default), so a future improvement to the default copy is not silently
 * shadowed forever. "Reset to default" therefore deletes the key rather than
 * writing the default text back into it. The editor inputs read the RAW
 * override (`legend.entries[key]`, possibly absent) — never the resolved
 * value `CareSymbolGrid` passes for context — so an untouched field stays
 * genuinely blank; the resolved label/meaning is used only as the input's
 * placeholder, which is exactly what renders when the field is left blank.
 */
export function CareLegendField({ config, onChange }: CareLegendFieldProps) {
  const legend = config.careGuide.legend
  const resolved = useMemo(() => resolveCareLegend(config), [config])
  const search = useCareSymbolSearch(resolved)
  const searchId = useId()
  const totalCount = Object.keys(resolved.entries).length
  const matchedCount = search.categories.reduce((total, category) => total + category.count, 0)

  const patchLegend = (patch: Partial<CareLegend>) => onChange({ ...legend, ...patch })

  const patchEntry = (key: string, patch: Partial<CareLegendEntry>) => {
    const current = legend.entries[key] ?? { label: '', meaning: '' }
    patchLegend({ entries: { ...legend.entries, [key]: { ...current, ...patch } } })
  }

  const resetEntry = (key: string) => {
    if (!(key in legend.entries)) return
    patchLegend({ entries: withoutEntry(legend.entries, key) })
  }

  const renderEditor = ({ symbolKey, label, meaning }: CareSymbolCellContext) => {
    const override = legend.entries[symbolKey]
    return (
      <div className="space-y-2">
        <FormField label="Label" labelStyle="micro">
          <Input
            density="compact"
            placeholder={label}
            value={override?.label ?? ''}
            aria-label={`${symbolKey} symbol label`}
            onChange={(e) => patchEntry(symbolKey, { label: e.target.value })}
          />
        </FormField>
        <FormField label="Meaning" labelStyle="micro">
          <Textarea
            density="compact"
            rows={2}
            placeholder={meaning}
            value={override?.meaning ?? ''}
            aria-label={`${symbolKey} symbol meaning`}
            onChange={(e) => patchEntry(symbolKey, { meaning: e.target.value })}
          />
        </FormField>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          density="compact"
          aria-label={`Reset ${symbolKey} to default`}
          onClick={() => resetEntry(symbolKey)}
          disabled={!override}
        >
          <RotateCcw size={ICON_SIZE.sm} aria-hidden="true" />
          Reset to default
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <FormField label="Heading" labelStyle="stacked">
        <Input
          density="compact"
          placeholder={resolved.heading}
          value={legend.heading}
          onChange={(e) => patchLegend({ heading: e.target.value })}
        />
      </FormField>
      <FormField label="Intro" labelStyle="stacked">
        <Textarea
          density="compact"
          rows={2}
          placeholder={resolved.intro}
          value={legend.intro}
          onChange={(e) => patchLegend({ intro: e.target.value })}
        />
      </FormField>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <label htmlFor={searchId} className="sr-only">
            Search care symbols
          </label>
          <Search
            size={ICON_SIZE.sm}
            aria-hidden={true}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <input
            id={searchId}
            type="search"
            value={search.query}
            onChange={(e) => search.setQuery(e.target.value)}
            placeholder="Search — tumble, bleach, 30"
            autoComplete="off"
            className="focus-ring h-9 w-full rounded-full border border-[var(--color-line)] bg-[var(--color-bg)]/40 pr-4 pl-9 text-base text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] md:text-xs"
          />
        </div>
        <p
          aria-live="polite"
          className="text-[0.6875rem] tracking-[0.18em] text-[var(--color-text-muted)] tabular-nums uppercase"
        >
          {search.resultCount} of {totalCount} marks
        </p>
      </div>

      <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
        <CategoryChip
          label="All"
          count={matchedCount}
          selected={search.categoryId === null}
          onSelect={() => search.setCategoryId(null)}
        />
        {search.categories.map((category) => (
          <CategoryChip
            key={category.id}
            label={category.label}
            count={category.count}
            selected={search.categoryId === category.id}
            onSelect={() =>
              search.setCategoryId(search.categoryId === category.id ? null : category.id)
            }
          />
        ))}
      </div>

      {search.resultCount === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--color-line)] p-6 text-center">
          <p className="text-sm text-[var(--color-text)]">No marks match</p>
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            Nothing matches the current search and category filter.
          </p>
          <button
            type="button"
            onClick={search.reset}
            className="focus-ring mt-4 inline-flex h-9 items-center rounded-full border border-[var(--color-line)] px-4 text-xs text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)]"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <CareSymbolGrid groups={search.groups} mode="edit" headingLevel={3} renderEditor={renderEditor} />
      )}
    </div>
  )
}

function CategoryChip({
  label,
  count,
  selected,
  onSelect,
}: {
  label: string
  count: number
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        'focus-ring inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[11px] tracking-[0.1em] uppercase transition-colors',
        selected
          ? 'border-[var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_14%,transparent)] font-semibold text-[var(--color-text)]'
          : 'border-[var(--color-line)] bg-[var(--color-bg)]/40 text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
      )}
    >
      {label}
      <span className="tabular-nums text-[var(--color-text-muted)]">{count}</span>
    </button>
  )
}
