import { useState } from 'react'
import { toast } from 'sonner'
import { ImagePlus, Save } from '@/shared/icons'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { MediaLibraryPickerModal } from '@/features/admin/media/MediaLibraryPickerModal'
import { rankEmblemSrc } from '@/features/passport/lib/ranks'
import type { GamificationRules } from '@/features/passport/schemas/gamification.schema'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { saveRank, type RankDraft } from './gamification.service'

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
  onSaved,
}: {
  rank: GamificationRules['ranks'][number]
  onSaved: () => Promise<void>
}) {
  const [draft, setDraft] = useState<RankDraft>(() => toDraft(rank))
  const [saving, setSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

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
      description={`Rank key: ${rank.key} (fixed) — copy, emblem, and thresholds are editable.`}
      actions={
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
    </AdminCard>
  )
}

/** The rank ladder editor — one card per fixed rank, thresholds per level. */
export function GamificationRanksTab({
  rules,
  onSaved,
}: {
  rules: GamificationRules
  onSaved: () => Promise<void>
}) {
  const ranks = [...rules.ranks].sort((a, b) => a.sortOrder - b.sortOrder)
  return (
    <div className="space-y-6">
      {ranks.map((rank) => (
        <RankCard key={rank.key} rank={rank} onSaved={onSaved} />
      ))}
    </div>
  )
}
