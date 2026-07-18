import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Save, Trash2 } from '@/shared/icons'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminConfirmDialog } from '@/features/admin/components/AdminConfirmDialog'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
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
import { deleteBadge, upsertBadge, type BadgeDraft } from './gamification.service'

const METRIC_OPTIONS = GAMIFICATION_METRICS.map((metric) => ({
  value: metric,
  label: GAMIFICATION_METRIC_LABELS[metric],
}))

function kebab(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Milestone badge editor — earned when metric ≥ target. */
export function GamificationBadgesTab({
  rules,
  onSaved,
}: {
  rules: GamificationRules
  onSaved: () => Promise<void>
}) {
  const [drafts, setDrafts] = useState<BadgeDraft[]>(() => rules.badges.map((b) => ({ ...b })))
  const [saving, setSaving] = useState<string | null>(null)
  const [removeKey, setRemoveKey] = useState<string | null>(null)
  const [newBadge, setNewBadge] = useState<BadgeDraft | null>(null)

  useEffect(() => {
    setDrafts(rules.badges.map((b) => ({ ...b })))
  }, [rules.badges])

  const patch = (key: string, next: Partial<BadgeDraft>) =>
    setDrafts((prev) => prev.map((b) => (b.key === key ? { ...b, ...next } : b)))

  const save = async (draft: BadgeDraft) => {
    if (!draft.title.trim()) {
      toast.error('The badge needs a title.')
      return
    }
    setSaving(draft.key || 'new')
    try {
      const res = await upsertBadge({ ...draft, key: draft.key || kebab(draft.title) })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success('Badge saved.')
      setNewBadge(null)
      await onSaved()
    } finally {
      setSaving(null)
    }
  }

  const remove = async () => {
    if (!removeKey) return
    const res = await deleteBadge(removeKey)
    if (!res.ok) {
      toast.error(res.error)
    } else {
      toast.success('Badge deleted.')
      await onSaved()
    }
    setRemoveKey(null)
  }

  const renderFields = (draft: BadgeDraft, onPatch: (next: Partial<BadgeDraft>) => void) => (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <FormField label="Title" labelStyle="stacked">
        <Input
          density="compact"
          value={draft.title}
          onChange={(e) => onPatch({ title: e.target.value })}
        />
      </FormField>
      <AdminFieldSelect
        label="What it measures"
        value={draft.metric}
        onChange={(metric) => onPatch({ metric: metric as BadgeDraft['metric'] })}
        options={METRIC_OPTIONS}
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
      <FormField label="Description" labelStyle="stacked" className="sm:col-span-2 lg:col-span-1">
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
        title="Badges"
        description="Milestone honors earned once (metric reaches target). Note: badges on wear/feat/honor metrics only light up on surfaces that know those numbers."
        actions={
          !newBadge ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              density="compact"
              onClick={() =>
                setNewBadge({
                  key: '',
                  title: '',
                  description: '',
                  metric: 'registrations',
                  target: 1,
                  sortOrder: drafts.length,
                  isActive: true,
                })
              }
            >
              <Plus size={ICON_SIZE.sm} aria-hidden="true" />
              New badge
            </Button>
          ) : null
        }
      >
        <ul className="space-y-3">
          {drafts.map((draft) => (
            <li key={draft.key} className="rounded-lg border border-[var(--color-line)] p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="anvl-micro text-[var(--color-text-muted)]">{draft.key}</span>
                <span className="ml-auto flex items-center gap-2">
                  <Checkbox
                    id={`badge-active-${draft.key}`}
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
                    aria-label={`Delete badge ${draft.title}`}
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

        {newBadge ? (
          <div className="mt-4 rounded-lg border border-dashed border-[var(--color-accent)]/50 p-4">
            <p className="anvl-micro mb-3 text-[var(--color-text-muted)]">
              New badge — the key is minted from the title on first save.
            </p>
            {renderFields(newBadge, (next) =>
              setNewBadge((prev) => (prev ? { ...prev, ...next } : prev)),
            )}
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                density="compact"
                loading={saving === 'new'}
                onClick={() => void save(newBadge)}
              >
                <Save size={ICON_SIZE.sm} aria-hidden="true" />
                Create badge
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                density="compact"
                onClick={() => setNewBadge(null)}
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
        title="Delete this badge?"
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={() => void remove()}
      >
        Athletes lose this badge from their catalog immediately. Prefer the Active
        toggle to retire it without deleting.
      </AdminConfirmDialog>
    </div>
  )
}
