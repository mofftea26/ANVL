import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Save } from '@/shared/icons'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { cumulativeXpForLevel } from '@/features/passport/lib/forgeXp'
import type {
  GamificationRules,
  GamificationXpSettings,
} from '@/features/passport/schemas/gamification.schema'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { saveXpSettings } from './gamification.service'

const XP_FIELDS: Array<{
  key: keyof GamificationXpSettings
  label: string
  hint: string
}> = [
  { key: 'xpPerRegistration', label: 'XP per registration', hint: 'Earned when a passport is claimed.' },
  { key: 'xpPerWear', label: 'XP per wear', hint: 'Earned per logged wear (24h cooldown per piece).' },
  { key: 'xpPerFeat', label: 'XP per feat', hint: 'Earned per feat in the wear journal.' },
  { key: 'xpPerFullDrop', label: 'XP per full drop', hint: 'Bonus when every piece of a drop is registered.' },
  { key: 'levelCurveFactor', label: 'Level curve factor', hint: 'Cumulative XP to reach level L = factor × L × (L−1). Higher = slower leveling.' },
]

const PREVIEW_LEVELS = [2, 3, 5, 8, 12] as const

/** Forge XP tuning — the four constants + the level curve, with a live table. */
export function GamificationXpTab({
  rules,
  onSaved,
}: {
  rules: GamificationRules
  onSaved: () => Promise<void>
}) {
  const [draft, setDraft] = useState<GamificationXpSettings>({ ...rules.settings })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDraft({ ...rules.settings })
  }, [rules.settings])

  const save = async () => {
    setSaving(true)
    try {
      const res = await saveXpSettings(draft)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success('Forge XP settings saved.')
      await onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminCard
      title="Forge XP"
      description="The dopamine loop under the prestige ranks — every real action earns XP."
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
          Save settings
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {XP_FIELDS.map((field) => (
          <FormField key={field.key} label={field.label} hint={field.hint} labelStyle="stacked">
            <Input
              density="compact"
              inputMode="numeric"
              value={draft[field.key]}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10)
                setDraft((prev) => ({
                  ...prev,
                  [field.key]: Number.isFinite(n) && n >= 0 ? n : 0,
                }))
              }}
            />
          </FormField>
        ))}
      </div>

      <div className="mt-6">
        <p className="anvl-micro mb-2 text-[var(--color-text-muted)]">
          Level curve preview (cumulative XP required)
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[24rem] text-left text-xs">
            <thead>
              <tr className="text-[var(--color-text-muted)]">
                <th scope="col" className="py-1.5 pr-4 font-medium">Level</th>
                {PREVIEW_LEVELS.map((level) => (
                  <th key={level} scope="col" className="py-1.5 pr-4 font-medium">
                    {level}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-[var(--color-line)]/60 text-[var(--color-text)]">
                <td className="py-1.5 pr-4 text-[var(--color-text-muted)]">XP needed</td>
                {PREVIEW_LEVELS.map((level) => (
                  <td key={level} className="py-1.5 pr-4 font-mono">
                    {cumulativeXpForLevel(level, Math.max(1, draft.levelCurveFactor))}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AdminCard>
  )
}
