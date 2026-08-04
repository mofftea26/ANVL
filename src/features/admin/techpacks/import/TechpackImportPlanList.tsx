import { AlertTriangle } from '@/shared/icons'
import { Checkbox } from '@/shared/components/ui/Checkbox'
import { cn } from '@/shared/lib/cn'

import type { ImportFieldProposal, ImportTarget } from './importPlan'

/**
 * The import plan, field by field.
 *
 * Everything here serves one goal: an operator should never be surprised by
 * what an import did. So a row that would REPLACE existing copy shows both
 * values side by side and starts unticked, and a row that cannot be imported
 * says why in plain language rather than simply being absent.
 */

const TARGET_LABELS: Record<ImportTarget, string> = {
  passport: 'Passport',
  sizeGuide: 'Size guide',
  pdp: 'Product page',
}

const STATE_LABELS: Record<ImportFieldProposal['state'], string> = {
  empty: 'Currently empty',
  differs: 'Would replace what is there',
  same: 'Already matches',
}

/** Render any proposal value compactly enough to scan. */
function preview(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    if (value.length === 0) return '—'
    const first = value
      .slice(0, 3)
      .map((entry) =>
        typeof entry === 'string' ? entry : describeObject(entry as Record<string, unknown>),
      )
      .join(' · ')
    return value.length > 3 ? `${first} … (${value.length} items)` : first
  }
  if (typeof value === 'object') return describeObject(value as Record<string, unknown>)
  return String(value)
}

function describeObject(value: Record<string, unknown>): string {
  for (const key of ['name', 'title', 'label', 'key', 'code']) {
    const candidate = value[key]
    if (typeof candidate === 'string' && candidate) return candidate
  }
  const keys = Object.keys(value)
  return keys.length > 0 ? `{ ${keys.slice(0, 3).join(', ')} }` : '—'
}

export function TechpackImportPlanList({
  plan,
  selectedIds,
  onToggle,
}: {
  plan: readonly ImportFieldProposal[]
  selectedIds: ReadonlySet<string>
  onToggle: (id: string, next: boolean) => void
}) {
  if (plan.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--color-line)] p-6 text-center text-sm text-[var(--color-text-muted)]">
        This techpack has nothing new to offer for this product.
      </p>
    )
  }

  const groups = (Object.keys(TARGET_LABELS) as ImportTarget[])
    .map((target) => ({ target, rows: plan.filter((entry) => entry.target === target) }))
    .filter((group) => group.rows.length > 0)

  return (
    <div className="space-y-6">
      {groups.map(({ target, rows }) => (
        <section key={target} className="space-y-2">
          <h3 className="anvl-micro text-[11px] text-[var(--color-text-muted)]">
            {TARGET_LABELS[target]}
          </h3>
          <ul className="space-y-2">
            {rows.map((entry) => {
              const checked = selectedIds.has(entry.id)
              const disabled = Boolean(entry.blocked) || entry.state === 'same'
              return (
                <li
                  key={entry.id}
                  className={cn(
                    'rounded-xl border p-3',
                    entry.blocked
                      ? 'border-[color-mix(in_oklab,var(--color-warning)_40%,var(--color-line))]'
                      : 'border-[var(--color-line)]',
                    disabled && 'opacity-70',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={checked}
                      disabled={disabled}
                      onChange={(event) => onToggle(entry.id, event.target.checked)}
                      aria-label={`Import ${entry.label}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="text-sm font-medium text-[var(--color-heading)]">
                          {entry.label}
                        </span>
                        <span className="anvl-micro text-[10px] text-[var(--color-text-muted)]">
                          {STATE_LABELS[entry.state]}
                          {entry.sourcePage > 0 ? ` · page ${entry.sourcePage}` : ''}
                        </span>
                      </div>

                      {entry.blocked ? (
                        <p className="anvl-micro mt-1 flex items-start gap-1.5 text-[11px] leading-relaxed text-[var(--color-warning)]">
                          <AlertTriangle aria-hidden="true" className="mt-0.5 h-3 w-3 shrink-0" />
                          {entry.blocked}
                        </p>
                      ) : (
                        <div className="mt-1 space-y-0.5 text-xs">
                          {/* Only show the "before" when there is something to
                              lose — otherwise it is noise on every row. */}
                          {entry.state === 'differs' ? (
                            <p className="text-[var(--color-text-muted)] line-through">
                              {preview(entry.current)}
                            </p>
                          ) : null}
                          <p className="text-[var(--color-text)]">{preview(entry.next)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
