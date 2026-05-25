import { GripVertical, Plus, Trash2 } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { IconButton } from '@/shared/components/ui/IconButton'
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
  onReorder: (orderedIds: string[]) => void
}

export function DropActListRail({
  acts,
  selectedId,
  onSelect,
  onAdd,
  onRemove,
  onReorder,
}: DropActListRailProps) {
  const sorted = [...acts].sort((a, b) => a.sortOrder - b.sortOrder)
  const dragIdRef = useRef<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const commitReorder = useCallback(
    (fromId: string, toId: string) => {
      if (fromId === toId) return
      const ids = sorted.map((a) => a.id)
      const fromIdx = ids.indexOf(fromId)
      const toIdx = ids.indexOf(toId)
      if (fromIdx < 0 || toIdx < 0) return
      const next = [...ids]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved)
      onReorder(next)
    },
    [onReorder, sorted],
  )

  return (
    <div
      className="shrink-0 rounded-lg border border-[var(--color-line)]/70 bg-[var(--color-surface)]/25 px-2 py-1.5"
      data-testid="drop-act-list-rail"
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Acts
        </p>
        <IconButton
          type="button"
          aria-label="Add act"
          title="Add act"
          className="h-7 w-7 border-[var(--color-line)]/70 bg-[var(--color-surface-soft)]"
          onClick={onAdd}
        >
          <Plus size={14} aria-hidden />
        </IconButton>
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-md border border-dashed border-[var(--color-line)] px-3 py-4 text-center text-[11px] text-[var(--color-text-muted)]">
          No acts yet.
        </p>
      ) : (
        <div
          className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:thin]"
          role="list"
          aria-label="Landing acts"
        >
          {sorted.map((act, index) => {
            const selected = act.id === selectedId
            const label =
              act.title?.trim() ||
              NATURE_LABEL[act.nature] ||
              act.nature ||
              `Act ${index + 1}`
            const isDragTarget = dragOverId === act.id && draggingId !== act.id

            return (
              <div
                key={act.id}
                role="listitem"
                draggable
                onDragStart={(e) => {
                  dragIdRef.current = act.id
                  setDraggingId(act.id)
                  e.dataTransfer.effectAllowed = 'move'
                  e.dataTransfer.setData('text/plain', act.id)
                }}
                onDragEnd={() => {
                  dragIdRef.current = null
                  setDraggingId(null)
                  setDragOverId(null)
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                  setDragOverId(act.id)
                }}
                onDragLeave={() => {
                  if (dragOverId === act.id) setDragOverId(null)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const fromId = dragIdRef.current ?? e.dataTransfer.getData('text/plain')
                  if (fromId) commitReorder(fromId, act.id)
                  setDragOverId(null)
                  setDraggingId(null)
                  dragIdRef.current = null
                }}
                className={cn(
                  'group relative flex min-w-[8.5rem] max-w-[10rem] shrink-0 items-center gap-1 rounded-lg border px-1.5 py-1 transition-all duration-200',
                  selected
                    ? 'border-[color:color-mix(in_srgb,var(--color-accent)_50%,var(--color-line))] bg-[var(--color-surface-elevated)]'
                    : 'border-[var(--color-line)]/60 bg-[var(--color-bg)]/35 hover:border-[var(--color-line)]',
                  draggingId === act.id && 'scale-[0.98] opacity-60',
                  isDragTarget && 'ring-2 ring-[var(--color-accent)]/35',
                )}
              >
                <span
                  className="cursor-grab touch-none text-[var(--color-text-muted)] active:cursor-grabbing"
                  aria-hidden
                >
                  <GripVertical size={12} />
                </span>
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  aria-current={selected ? 'true' : undefined}
                  onClick={() => onSelect(act.id)}
                >
                  <span className="block truncate text-[11px] font-medium text-[var(--color-heading)]">
                    {label}
                  </span>
                  <span className="block truncate text-[8px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                    {NATURE_LABEL[act.nature] ?? act.nature}
                    {!act.isEnabled ? ' · off' : ''}
                  </span>
                </button>
                <button
                  type="button"
                  className="rounded p-0.5 text-red-300/70 opacity-0 transition hover:bg-red-500/10 hover:text-red-200 group-hover:opacity-100 focus:opacity-100"
                  aria-label={`Remove ${label}`}
                  onClick={() => onRemove(act.id)}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
