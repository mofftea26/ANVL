import { AlertTriangle, Check, FileText, Trash2 } from '@/shared/icons'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { AdminLoadingState } from '@/features/admin/components/AdminLoadingState'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import {
  TechpackFinalPill,
  TechpackStatusPill,
  formatBytes,
  formatDate,
} from './techpackDisplay'
import type { AdminTechpack } from './techpacks.service'

interface TechpackListProps {
  techpacks: readonly AdminTechpack[]
  loading: boolean
  selectedId: string | null
  productFilter: string
  productFilterOptions: ReadonlyArray<{ value: string; label: string }>
  productNames: ReadonlyMap<string, string>
  onProductFilterChange: (value: string) => void
  onSelect: (id: string) => void
  onSetFinal: (techpack: AdminTechpack) => void
  onDelete: (techpack: AdminTechpack) => void
  busyId: string | null
}

/**
 * The review queue. Sorted newest-first by the query; the issue count is the
 * column that matters — it is the parser's honesty channel, and a pack with
 * errors must never be quietly marked final.
 */
export function TechpackList({
  techpacks,
  loading,
  selectedId,
  productFilter,
  productFilterOptions,
  productNames,
  onProductFilterChange,
  onSelect,
  onSetFinal,
  onDelete,
  busyId,
}: TechpackListProps) {
  return (
    <AdminCard
      title="Techpacks"
      description="Open a pack to review what the parser read. Marking one final makes it the pack of record for its product — exactly one per product."
    >
      <div className="mb-4 max-w-sm">
        <AdminFieldSelect
          label="Product"
          value={productFilter}
          onChange={onProductFilterChange}
          options={productFilterOptions}
        />
      </div>

      {loading ? (
        <AdminLoadingState message="Loading techpacks…" />
      ) : techpacks.length === 0 ? (
        <p className="py-6 text-sm text-[var(--color-text-muted)]">
          {productFilter === 'all'
            ? 'No techpacks yet — ingest your first supplier PDF above.'
            : 'No techpacks for this product yet.'}
        </p>
      ) : (
        // Rows are inset cards rather than full-bleed strips: the selected
        // highlight IS the row, so it needs its own padding and radius or it
        // runs edge to edge and reads as a table rule. `divide-y` went for the
        // same reason — a border between rounded rows fights them.
        <ul className="space-y-1">
          {techpacks.map((pack) => {
            const selected = pack.id === selectedId
            const productLabel = pack.productSlug
              ? (productNames.get(pack.productSlug) ?? pack.productSlug)
              : 'Unassigned'
            return (
              <li
                key={pack.id}
                className={cn(
                  'flex flex-wrap items-center gap-3 rounded-xl px-3 py-3 transition-colors',
                  selected
                    ? 'bg-[color-mix(in_oklab,var(--color-highlight)_10%,transparent)] ring-1 ring-[color-mix(in_oklab,var(--color-highlight)_28%,transparent)]'
                    : 'hover:bg-[color-mix(in_oklab,var(--color-surface-elevated)_45%,transparent)]',
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(pack.id)}
                  aria-current={selected ? 'true' : undefined}
                  className="focus-ring min-w-0 flex-1 rounded-lg py-1 text-left"
                >
                  <span className="flex items-center gap-2">
                    <FileText
                      size={15}
                      aria-hidden="true"
                      className="shrink-0 text-[var(--color-text-muted)]"
                    />
                    <span className="truncate text-sm font-semibold text-[var(--color-text)]">
                      {pack.title || pack.sourceFilename || 'Untitled techpack'}
                    </span>
                  </span>
                  <span className="anvl-micro mt-0.5 block truncate text-[var(--color-text-muted)]">
                    {productLabel} · {pack.pageCount} pages · {formatBytes(pack.sourceByteSize)} ·{' '}
                    {formatDate(pack.createdAt)}
                  </span>
                </button>

                <span className="flex shrink-0 items-center gap-2">
                  {pack.issueCount > 0 ? (
                    <span
                      className="inline-flex items-center gap-1 text-[11px] text-[var(--color-warning)]"
                      title="Parse issues needing a human"
                    >
                      <AlertTriangle size={14} aria-hidden="true" />
                      {pack.issueCount}
                    </span>
                  ) : null}
                  <TechpackStatusPill status={pack.status} />
                  {pack.isFinal ? <TechpackFinalPill /> : null}
                </span>

                <span className="flex shrink-0 items-center gap-1.5">
                  {!pack.isFinal ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      density="compact"
                      disabled={!pack.productSlug || busyId === pack.id}
                      title={
                        pack.productSlug
                          ? 'Make this the pack of record for the product'
                          : 'Assign a product first'
                      }
                      onClick={() => onSetFinal(pack)}
                    >
                      <Check size={15} aria-hidden="true" />
                      Final
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    density="compact"
                    aria-label={`Delete ${pack.title || 'techpack'}`}
                    disabled={busyId === pack.id}
                    onClick={() => onDelete(pack)}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </Button>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </AdminCard>
  )
}
