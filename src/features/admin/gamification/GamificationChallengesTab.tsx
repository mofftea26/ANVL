import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ChevronDown, ChevronUp, Menu, Plus, Save, Trash2 } from '@/shared/icons'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminConfirmDialog } from '@/features/admin/components/AdminConfirmDialog'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { useSortableList } from '@/features/admin/hooks/useSortableList'
import { CHALLENGE_CATEGORIES } from '@/features/passport/lib/challenges'
import {
  GAMIFICATION_METRICS,
  GAMIFICATION_METRIC_LABELS,
  type GamificationRules,
} from '@/features/passport/schemas/gamification.schema'
import { Button } from '@/shared/components/ui/Button'
import { Checkbox } from '@/shared/components/ui/Checkbox'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import {
  deleteChallenge,
  saveChallengeOrder,
  upsertChallenge,
  type ChallengeDraft,
} from './gamification.service'

const METRIC_OPTIONS = GAMIFICATION_METRICS.map((metric) => ({
  value: metric,
  label: GAMIFICATION_METRIC_LABELS[metric],
}))

const CATEGORY_OPTIONS = CHALLENGE_CATEGORIES.map((c) => ({ value: c.key, label: c.label }))

function kebab(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function blankChallenge(sortOrder: number): ChallengeDraft {
  return {
    key: '',
    category: 'forge',
    title: '',
    description: '',
    metric: 'registrations',
    target: 1,
    sortOrder,
    isActive: true,
  }
}

/**
 * The challenge log editor — drag/keyboard reorder, metric + target per
 * challenge, active toggle, create/delete. Metrics are the fixed declarative
 * vocabulary the storefront evaluates.
 */
export function GamificationChallengesTab({
  rules,
  onSaved,
}: {
  rules: GamificationRules
  onSaved: () => Promise<void>
}) {
  const [drafts, setDrafts] = useState<ChallengeDraft[]>(
    () => rules.challenges.map((c) => ({ ...c })),
  )
  const [saving, setSaving] = useState<string | null>(null)
  const [removeKey, setRemoveKey] = useState<string | null>(null)
  const [newChallenge, setNewChallenge] = useState<ChallengeDraft | null>(null)

  useEffect(() => {
    setDrafts(rules.challenges.map((c) => ({ ...c })))
  }, [rules.challenges])

  const reorder = async (from: number, to: number) => {
    const next = [...drafts]
    const [moved] = next.splice(from, 1)
    if (!moved) return
    next.splice(to, 0, moved)
    setDrafts(next)
    const res = await saveChallengeOrder(next.map((c) => c.key))
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    await onSaved()
  }

  const sortable = useSortableList({
    length: drafts.length,
    onMove: (from, to) => void reorder(from, to),
  })

  const patch = (key: string, next: Partial<ChallengeDraft>) =>
    setDrafts((prev) => prev.map((c) => (c.key === key ? { ...c, ...next } : c)))

  const save = async (draft: ChallengeDraft) => {
    if (!draft.title.trim()) {
      toast.error('The challenge needs a title.')
      return
    }
    setSaving(draft.key || 'new')
    try {
      const res = await upsertChallenge({
        ...draft,
        key: draft.key || kebab(draft.title),
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success('Challenge saved.')
      setNewChallenge(null)
      await onSaved()
    } finally {
      setSaving(null)
    }
  }

  const remove = async () => {
    if (!removeKey) return
    const res = await deleteChallenge(removeKey)
    if (!res.ok) {
      toast.error(res.error)
    } else {
      toast.success('Challenge deleted.')
      await onSaved()
    }
    setRemoveKey(null)
  }

  const renderFields = (
    draft: ChallengeDraft,
    onPatch: (next: Partial<ChallengeDraft>) => void,
  ) => (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <FormField label="Title" labelStyle="stacked" className="lg:col-span-2">
        <Input
          density="compact"
          value={draft.title}
          onChange={(e) => onPatch({ title: e.target.value })}
        />
      </FormField>
      <AdminFieldSelect
        label="Category"
        value={draft.category}
        onChange={(category) => onPatch({ category: category as ChallengeDraft['category'] })}
        options={CATEGORY_OPTIONS}
      />
      <FormField label="Target" labelStyle="stacked">
        <Input
          density="compact"
          inputMode="numeric"
          value={draft.target}
          onChange={(e) => {
            const n = Number.parseInt(e.target.value, 10)
            onPatch({ target: Number.isFinite(n) && n > 0 ? n : 1 })
          }}
        />
      </FormField>
      <AdminFieldSelect
        label="What it measures"
        value={draft.metric}
        onChange={(metric) => onPatch({ metric: metric as ChallengeDraft['metric'] })}
        options={METRIC_OPTIONS}
      />
      <FormField label="Description" labelStyle="stacked" className="sm:col-span-2 lg:col-span-3">
        <Input
          density="compact"
          value={draft.description}
          onChange={(e) => onPatch({ description: e.target.value })}
        />
      </FormField>
    </div>
  )

  return (
    <div className="space-y-6">
      <AdminCard
        title="Challenges"
        description="Drag to reorder (order = display order in the Armory). Inactive challenges disappear from the log without losing their definition."
        actions={
          !newChallenge ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              density="compact"
              onClick={() => setNewChallenge(blankChallenge(drafts.length))}
            >
              <Plus size={ICON_SIZE.sm} aria-hidden="true" />
              New challenge
            </Button>
          ) : null
        }
      >
        <ul className="space-y-3">
          {drafts.map((draft, i) => (
            <li
              key={draft.key}
              {...sortable.getItemProps(i)}
              className="rounded-lg border border-[var(--color-line)] p-4 transition-shadow data-[drag-over]:shadow-[0_0_0_2px_var(--color-accent)]"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  {...sortable.getHandleProps(i)}
                  title="Drag to reorder"
                  className="inline-flex cursor-grab items-center text-[var(--color-text-muted)] active:cursor-grabbing"
                >
                  <Menu size={ICON_SIZE.sm} aria-hidden="true" />
                </span>
                <button
                  type="button"
                  aria-label={`Move ${draft.title} up`}
                  disabled={i === 0}
                  onClick={() => sortable.moveUp(i)}
                  className="focus-ring inline-flex h-6 w-6 items-center justify-center rounded text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-30"
                >
                  <ChevronUp size={ICON_SIZE.xs} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Move ${draft.title} down`}
                  disabled={i === drafts.length - 1}
                  onClick={() => sortable.moveDown(i)}
                  className="focus-ring inline-flex h-6 w-6 items-center justify-center rounded text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-30"
                >
                  <ChevronDown size={ICON_SIZE.xs} aria-hidden="true" />
                </button>
                <span className="anvl-micro text-[var(--color-text-muted)]">{draft.key}</span>
                <span className="ml-auto flex items-center gap-2">
                  <Checkbox
                    id={`challenge-active-${draft.key}`}
                    checked={draft.isActive}
                    onChange={(e) => patch(draft.key, { isActive: e.target.checked })}
                    label="Active"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    density="compact"
                    loading={saving === draft.key}
                    onClick={() => void save(draft)}
                  >
                    <Save size={ICON_SIZE.sm} aria-hidden="true" />
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    density="compact"
                    aria-label={`Delete challenge ${draft.title}`}
                    onClick={() => setRemoveKey(draft.key)}
                  >
                    <Trash2 size={ICON_SIZE.sm} aria-hidden="true" />
                  </Button>
                </span>
              </div>
              {renderFields(draft, (next) => patch(draft.key, next))}
            </li>
          ))}
        </ul>

        {newChallenge ? (
          <div className="mt-4 rounded-lg border border-dashed border-[var(--color-accent)]/50 p-4">
            <p className="anvl-micro mb-3 text-[var(--color-text-muted)]">
              New challenge — the key is minted from the title on first save.
            </p>
            {renderFields(newChallenge, (next) =>
              setNewChallenge((prev) => (prev ? { ...prev, ...next } : prev)),
            )}
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                density="compact"
                loading={saving === 'new'}
                onClick={() => void save(newChallenge)}
              >
                <Save size={ICON_SIZE.sm} aria-hidden="true" />
                Create challenge
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                density="compact"
                onClick={() => setNewChallenge(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </AdminCard>

      <AdminConfirmDialog
        open={removeKey !== null}
        onClose={() => setRemoveKey(null)}
        title="Delete this challenge?"
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={() => void remove()}
      >
        Athletes lose this entry from their challenge log immediately. Prefer the
        Active toggle to retire it without deleting.
      </AdminConfirmDialog>
    </div>
  )
}
