import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { AdminButton } from '@/features/admin/components/AdminButton'
import { AdminMicroHeading } from '@/features/admin/components/AdminMicroHeading'
import type { LandingAct } from '@/features/admin/drops/acts/landingActs.types'
import { cn } from '@/shared/lib/cn'

const NATURE_LABEL: Record<string, string> = {
  hero: 'Hero',
  manifesto: 'Manifesto',
  storytelling: 'Story',
  dropReveal: 'Reveal',
  productShowcase: 'Products',
  materialShowcase: 'Materials',
  specialEvent: 'Event',
  lookbook: 'Lookbook',
  newsletterWaitlist: 'Waitlist',
  finalCTA: 'Final CTA',
}

type DropActListRailProps = {
  acts: LandingAct[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAdd: () => void
  onRemove: (id: string) => void
  onMove: (id: string, dir: -1 | 1) => void
}

export function DropActListRail({
  acts,
  selectedId,
  onSelect,
  onAdd,
  onRemove,
  onMove,
}: DropActListRailProps) {
  const sorted = [...acts].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <aside className="flex min-h-0 flex-col gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)]/35 p-3">
      <div className="flex items-center justify-between gap-2">
        <AdminMicroHeading as="h3" className="text-[10px] tracking-[0.16em]">
          Acts
        </AdminMicroHeading>
        <AdminButton type="button" variant="secondary" size="sm" onClick={onAdd}>
          <Plus size={14} className="me-1" aria-hidden />
          Add
        </AdminButton>
      </div>

      <ol className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <li className="rounded-lg border border-dashed border-[var(--color-line)] px-3 py-6 text-center text-xs text-[var(--color-text-muted)]">
            No acts yet — add your first section.
          </li>
        ) : null}
        {sorted.map((act, index) => {
          const selected = act.id === selectedId
          const label =
            act.title?.trim() ||
            NATURE_LABEL[act.nature] ||
            act.nature ||
            `Act ${index + 1}`
          return (
            <li key={act.id}>
              <div
                className={cn(
                  'group flex items-stretch gap-1 rounded-lg border transition',
                  selected
                    ? 'border-[color:color-mix(in_srgb,var(--color-accent)_45%,var(--color-line))] bg-[var(--color-surface-elevated)]'
                    : 'border-[var(--color-line)]/70 bg-[var(--color-surface)]/40 hover:border-[var(--color-line)]',
                )}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 px-3 py-2.5 text-left"
                  aria-current={selected ? 'true' : undefined}
                  onClick={() => onSelect(act.id)}
                >
                  <span className="block truncate text-xs font-medium text-[var(--color-heading)]">
                    {label}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                    {NATURE_LABEL[act.nature] ?? act.nature}
                    {!act.isEnabled ? ' · off' : ''}
                  </span>
                </button>
                <div className="flex shrink-0 flex-col border-l border-[var(--color-line)]/60">
                  <button
                    type="button"
                    className="px-1.5 py-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-heading)] disabled:opacity-30"
                    disabled={index === 0}
                    aria-label="Move act up"
                    onClick={() => onMove(act.id, -1)}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    className="px-1.5 py-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-heading)] disabled:opacity-30"
                    disabled={index >= sorted.length - 1}
                    aria-label="Move act down"
                    onClick={() => onMove(act.id, 1)}
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    type="button"
                    className="px-1.5 py-1 text-red-300/80 hover:bg-red-500/10 hover:text-red-200"
                    aria-label="Remove act"
                    onClick={() => onRemove(act.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </aside>
  )
}
