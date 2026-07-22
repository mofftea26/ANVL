import { useState } from 'react'
import { toast } from 'sonner'
import { ChevronDown, ChevronUp, ImagePlus, Plus, Save, Trash2 } from '@/shared/icons'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminConfirmDialog } from '@/features/admin/components/AdminConfirmDialog'
import { AdminPromptDialog } from '@/features/admin/components/AdminPromptDialog'
import { MediaLibraryPickerModal } from '@/features/admin/media/MediaLibraryPickerModal'
import { rankEmblemSrc } from '@/features/passport/lib/ranks'
import type { GamificationRules } from '@/features/passport/schemas/gamification.schema'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import {
  createRank,
  deleteRank,
  saveRank,
  saveRankOrder,
  type RankDraft,
} from './gamification.service'

const ROMAN = ['I', 'II', 'III'] as const

function toDraft(rank: GamificationRules['ranks'][number]): RankDraft {
  return {
    key: rank.key,
    name: rank.name,
    description: rank.description,
    emblemUrl: rank.emblemUrl,
    levels: [...rank.levels]
      .sort((a, b) => a.level - b.level)
      .map((l) => ({
        level: l.level,
        unlockCopy: l.unlockCopy,
        minRegistrations: l.minRegistrations,
        minFullDrops: l.minFullDrops,
      })),
  }
}

function intOrNull(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number.parseInt(trimmed, 10)
  return Number.isFinite(n) && n >= 0 ? n : null
}

function RankCard({
  rank,
  index,
  total,
  onSaved,
  onMove,
}: {
  rank: GamificationRules['ranks'][number]
  index: number
  total: number
  onSaved: () => Promise<void>
  onMove: (index: number, direction: -1 | 1) => Promise<void>
}) {
  const [draft, setDraft] = useState<RankDraft>(() => toDraft(rank))
  const [saving, setSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const remove = async () => {
    setDeleting(true)
    try {
      const res = await deleteRank(rank.key)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(`Rank “${rank.name}” deleted.`)
      setConfirmDelete(false)
      await onSaved()
    } finally {
      setDeleting(false)
    }
  }

  const patchLevel = (
    level: 1 | 2 | 3,
    next: Partial<RankDraft['levels'][number]>,
  ) =>
    setDraft((prev) => ({
      ...prev,
      levels: prev.levels.map((l) => (l.level === level ? { ...l, ...next } : l)),
    }))

  const save = async () => {
    setSaving(true)
    try {
      const res = await saveRank(draft)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(`${draft.name} saved.`)
      await onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminCard
      title={draft.name}
      description={`Rank key: ${rank.key} — copy, emblem, thresholds, and ladder position are editable.`}
      actions={
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label={`Move ${draft.name} earlier in the ladder`}
            title="Move earlier (lower rank)"
            disabled={index === 0}
            onClick={() => void onMove(index, -1)}
            className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-line)] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-30"
          >
            <ChevronUp size={ICON_SIZE.sm} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Move ${draft.name} later in the ladder`}
            title="Move later (higher rank)"
            disabled={index === total - 1}
            onClick={() => void onMove(index, 1)}
            className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-line)] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-30"
          >
            <ChevronDown size={ICON_SIZE.sm} aria-hidden="true" />
          </button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            density="compact"
            disabled={total <= 1}
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 size={ICON_SIZE.sm} aria-hidden="true" />
            Delete
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            density="compact"
            loading={saving}
            onClick={() => void save()}
          >
            <Save size={ICON_SIZE.sm} aria-hidden="true" />
            Save rank
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex flex-col items-center gap-2">
            <img
              src={rankEmblemSrc(rank.key, draft.emblemUrl)}
              alt={`${draft.name} emblem`}
              width={96}
              height={96}
              loading="lazy"
              decoding="async"
              className="h-20 w-20 object-contain"
            />
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] px-2.5 py-1.5 text-xs text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)]"
              >
                <ImagePlus size={ICON_SIZE.sm} aria-hidden="true" />
                {draft.emblemUrl ? 'Change emblem' : 'Override emblem'}
              </button>
              {draft.emblemUrl ? (
                <button
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, emblemUrl: null }))}
                  className="focus-ring rounded-lg px-2 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  Use default
                </button>
              ) : null}
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <FormField label="Name" labelStyle="stacked">
              <Input
                density="compact"
                value={draft.name}
                onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
              />
            </FormField>
            <FormField label="Description" labelStyle="stacked">
              <Input
                density="compact"
                value={draft.description}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </FormField>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {draft.levels.map((level) => (
            <fieldset
              key={level.level}
              className="space-y-3 rounded-lg border border-[var(--color-line)] p-3"
            >
              <legend className="anvl-display px-1 text-[10px] tracking-[0.24em] text-[var(--color-highlight-bright)]">
                {draft.name} {ROMAN[level.level - 1]}
              </legend>
              <FormField label="Unlock copy" labelStyle="stacked">
                <Input
                  density="compact"
                  value={level.unlockCopy}
                  onChange={(e) => patchLevel(level.level, { unlockCopy: e.target.value })}
                />
              </FormField>
              <FormField
                label="Min registrations"
                hint="Blank = not required."
                labelStyle="stacked"
              >
                <Input
                  density="compact"
                  inputMode="numeric"
                  value={level.minRegistrations ?? ''}
                  onChange={(e) =>
                    patchLevel(level.level, { minRegistrations: intOrNull(e.target.value) })
                  }
                />
              </FormField>
              <FormField
                label="Min full drops"
                hint="Blank = not required."
                labelStyle="stacked"
              >
                <Input
                  density="compact"
                  inputMode="numeric"
                  value={level.minFullDrops ?? ''}
                  onChange={(e) =>
                    patchLevel(level.level, { minFullDrops: intOrNull(e.target.value) })
                  }
                />
              </FormField>
            </fieldset>
          ))}
        </div>
      </div>

      {pickerOpen ? (
        <MediaLibraryPickerModal
          open
          onClose={() => setPickerOpen(false)}
          kind="image"
          title={`Choose emblem — ${draft.name}`}
          selectedMediaId={null}
          onSelect={(pick) => {
            if (pick?.publicUrl) {
              setDraft((prev) => ({ ...prev, emblemUrl: pick.publicUrl }))
            }
            setPickerOpen(false)
          }}
        />
      ) : null}

      <AdminConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Delete rank “${rank.name}”?`}
        confirmLabel="Delete rank"
        confirmVariant="destructive"
        confirmLoading={deleting}
        onConfirm={() => void remove()}
      >
        Its three levels are deleted with it, and athletes currently deriving this rank
        re-derive from the remaining ladder. This cannot be undone.
      </AdminConfirmDialog>
    </AdminCard>
  )
}

/**
 * The rank ladder editor — one card per rank (create/delete/reorder since the
 * fixed-keys constraint was dropped), thresholds per level. Ladder order is
 * `sort_order` ascending: earlier = lower rank, the last rank is the summit.
 */
export function GamificationRanksTab({
  rules,
  onSaved,
}: {
  rules: GamificationRules
  onSaved: () => Promise<void>
}) {
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const ranks = [...rules.ranks].sort((a, b) => a.sortOrder - b.sortOrder)

  const create = async (name: string) => {
    setCreating(true)
    try {
      const res = await createRank({ name })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(
        `Rank “${name}” created at the top of the ladder — set its level thresholds below.`,
      )
      setCreateOpen(false)
      await onSaved()
    } finally {
      setCreating(false)
    }
  }

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= ranks.length) return
    const orderedKeys = ranks.map((r) => r.key)
    ;[orderedKeys[index], orderedKeys[target]] = [orderedKeys[target]!, orderedKeys[index]!]
    const res = await saveRankOrder(orderedKeys)
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    await onSaved()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[var(--color-text-muted)]">
          Ladder order: first card = lowest rank, last card = the summit. New ranks start
          with EMPTY thresholds (they match everyone) — set real thresholds right after
          creating one.
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          density="compact"
          onClick={() => setCreateOpen(true)}
        >
          <Plus size={ICON_SIZE.sm} aria-hidden="true" />
          Add rank
        </Button>
      </div>

      {ranks.map((rank, index) => (
        <RankCard
          key={rank.key}
          rank={rank}
          index={index}
          total={ranks.length}
          onSaved={onSaved}
          onMove={move}
        />
      ))}

      <AdminPromptDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add rank"
        description="The rank joins the top of the ladder with three empty levels. Copy, emblem, and thresholds are edited on its card."
        inputLabel="Rank name"
        placeholder="e.g. Titan"
        confirmLabel="Create rank"
        confirmLoading={creating}
        onConfirm={(name) => void create(name)}
      />
    </div>
  )
}
