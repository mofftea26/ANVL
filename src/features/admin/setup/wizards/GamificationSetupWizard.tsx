import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ADMIN_GAMIFICATION_RULES_QUERY_KEY } from '@/features/admin/gamification/AdminGamificationPage'
import {
  loadGamificationRules,
  saveRank,
  saveXpSettings,
  upsertBadge,
  upsertChallenge,
} from '@/features/admin/gamification/gamification.service'
import { GAMIFICATION_RULES_QUERY_KEY } from '@/features/passport/hooks/useGamificationRules'
import {
  GAMIFICATION_METRIC_LABELS,
  GAMIFICATION_METRICS,
  type GamificationMetric,
  type GamificationRankRule,
  type GamificationRules,
  type GamificationXpSettings,
} from '@/features/passport/schemas/gamification.schema'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { Button } from '@/shared/components/ui/Button'
import { Checkbox } from '@/shared/components/ui/Checkbox'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { SetupSaveRow, SetupStepBody, type SetupStepLink } from '../SetupStepParts'
import { SetupWizard } from '../SetupWizard'

const GAMIFICATION_LINK: SetupStepLink[] = [
  { label: 'Full editor (thresholds, emblems, reorder)', to: '/admin/gamification' },
]

const METRIC_OPTIONS = GAMIFICATION_METRICS.map((metric) => ({
  value: metric,
  label: GAMIFICATION_METRIC_LABELS[metric],
}))

interface RulesStepProps {
  rules: GamificationRules | undefined
  rulesError: boolean
  /** Refreshes both the admin and storefront rules caches after a write. */
  refresh: () => Promise<void>
  onNavigate: () => void
}

function rulesStatus(rules: GamificationRules | undefined, rulesError: boolean, label: string) {
  if (rulesError) {
    return { state: 'info' as const, label: 'Could not load rules — showing nothing to edit' }
  }
  if (!rules) return { state: 'info' as const, label: 'Loading rules…' }
  return { state: 'info' as const, label }
}

function slugifyKey(title: string): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return `${base || 'goal'}-${Date.now().toString(36)}`
}

/** Step 1 — Forge XP constants + level curve, edited inline. */
function ForgeXpStep({ rules, rulesError, refresh, onNavigate }: RulesStepProps) {
  return (
    <SetupStepBody
      intro="Forge XP has four earn constants plus a level-curve factor. Small changes here reshape every collector's progression — the full editor previews the resulting curve."
      status={rulesStatus(rules, rulesError, 'Rules live in Supabase — saving is live immediately')}
      links={GAMIFICATION_LINK}
      onNavigate={onNavigate}
    >
      {rules ? (
        <XpForm key="xp" initial={rules.settings} refresh={refresh} />
      ) : (
        <p className="text-xs text-[var(--color-text-muted)]">
          {rulesError ? 'Sign in with Supabase configured to edit the rules.' : 'Loading…'}
        </p>
      )}
    </SetupStepBody>
  )
}

function XpForm({
  initial,
  refresh,
}: {
  initial: GamificationXpSettings
  refresh: () => Promise<void>
}) {
  const [values, setValues] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const dirty = JSON.stringify(values) !== JSON.stringify(initial) && !saved

  const fields: Array<{ key: keyof GamificationXpSettings; label: string; min: number }> = [
    { key: 'xpPerRegistration', label: 'XP per registration', min: 0 },
    { key: 'xpPerWear', label: 'XP per wear', min: 0 },
    { key: 'xpPerFeat', label: 'XP per feat', min: 0 },
    { key: 'xpPerFullDrop', label: 'XP per full drop', min: 0 },
    { key: 'levelCurveFactor', label: 'Level curve factor', min: 1 },
  ]

  const save = async () => {
    setSaving(true)
    try {
      const res = await saveXpSettings(values)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success('Forge XP settings saved.')
      setSaved(true)
      await refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {fields.map((field) => (
          <FormField key={field.key} label={field.label} labelStyle="stacked">
            <Input
              density="compact"
              type="number"
              min={field.min}
              value={values[field.key]}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10)
                setSaved(false)
                setValues((prev) => ({
                  ...prev,
                  [field.key]: Number.isFinite(n) ? Math.max(field.min, n) : field.min,
                }))
              }}
            />
          </FormField>
        ))}
      </div>
      <SetupSaveRow
        onSave={() => void save()}
        saving={saving}
        saved={saved}
        dirty={dirty}
        label="Save Forge XP"
      />
    </div>
  )
}

/** Step 2 — challenges: active toggles + create new goals inline. */
function ChallengesStep({ rules, rulesError, refresh, onNavigate }: RulesStepProps) {
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [metric, setMetric] = useState<GamificationMetric>('registrations')
  const [target, setTarget] = useState('1')
  const [creating, setCreating] = useState(false)

  const challenges = rules?.challenges ?? []

  const toggle = async (key: string, isActive: boolean) => {
    const challenge = challenges.find((c) => c.key === key)
    if (!challenge) return
    setBusyKey(key)
    try {
      const res = await upsertChallenge({ ...challenge, isActive })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(isActive ? 'Challenge activated.' : 'Challenge deactivated.')
      await refresh()
    } finally {
      setBusyKey(null)
    }
  }

  const create = async () => {
    const cleanTitle = title.trim()
    const targetNum = Number.parseInt(target, 10)
    if (!cleanTitle) {
      toast.error('Give the challenge a title.')
      return
    }
    if (!Number.isFinite(targetNum) || targetNum < 1) {
      toast.error('Target must be at least 1.')
      return
    }
    setCreating(true)
    try {
      const res = await upsertChallenge({
        key: slugifyKey(cleanTitle),
        category: 'forge',
        title: cleanTitle,
        description: '',
        metric,
        target: targetNum,
        sortOrder: challenges.length,
        isActive: true,
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(`Challenge “${cleanTitle}” created.`)
      setTitle('')
      setTarget('1')
      await refresh()
    } finally {
      setCreating(false)
    }
  }

  return (
    <SetupStepBody
      intro="Challenges are declarative goals — a metric plus a target. Toggle which are active and create new ones here; descriptions, categories, and drag-reordering live in the full editor."
      status={rulesStatus(
        rules,
        rulesError,
        `${challenges.filter((c) => c.isActive).length} of ${challenges.length} challenges active`,
      )}
      links={GAMIFICATION_LINK}
      onNavigate={onNavigate}
    >
      {rules ? (
        <div className="space-y-4">
          <ul className="space-y-2">
            {challenges.map((challenge) => (
              <li key={challenge.key} className="flex items-center justify-between gap-3">
                <Checkbox
                  label={challenge.title}
                  description={`${GAMIFICATION_METRIC_LABELS[challenge.metric]} · target ${challenge.target}`}
                  checked={challenge.isActive}
                  disabled={busyKey === challenge.key}
                  onChange={(e) => void toggle(challenge.key, e.target.checked)}
                />
              </li>
            ))}
          </ul>
          <div className="space-y-3 border-t border-[var(--color-line)]/60 pt-3">
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_6rem]">
              <FormField label="New challenge title" labelStyle="stacked">
                <Input
                  density="compact"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </FormField>
              <AdminFieldSelect
                label="Metric"
                value={metric}
                onChange={(v) => setMetric(v as GamificationMetric)}
                options={METRIC_OPTIONS}
              />
              <FormField label="Target" labelStyle="stacked">
                <Input
                  density="compact"
                  type="number"
                  min={1}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </FormField>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              density="compact"
              loading={creating}
              onClick={() => void create()}
            >
              Create challenge
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-[var(--color-text-muted)]">
          {rulesError ? 'Sign in with Supabase configured to edit the rules.' : 'Loading…'}
        </p>
      )}
    </SetupStepBody>
  )
}

/** Step 3 — per-rank copy (name + description), saved per rank. */
function RanksStep({ rules, rulesError, refresh, onNavigate }: RulesStepProps) {
  return (
    <SetupStepBody
      intro="The Armory has four fixed ranks, each with three levels. Edit their names and descriptions here; per-level thresholds and emblem overrides live in the full editor."
      status={rulesStatus(rules, rulesError, 'Four fixed rank identities — copy is yours')}
      links={GAMIFICATION_LINK}
      onNavigate={onNavigate}
    >
      {rules ? (
        <div className="space-y-3">
          {rules.ranks.map((rank) => (
            <RankRow key={rank.key} rank={rank} refresh={refresh} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--color-text-muted)]">
          {rulesError ? 'Sign in with Supabase configured to edit the rules.' : 'Loading…'}
        </p>
      )}
    </SetupStepBody>
  )
}

function RankRow({
  rank,
  refresh,
}: {
  rank: GamificationRankRule
  refresh: () => Promise<void>
}) {
  const [name, setName] = useState(rank.name)
  const [description, setDescription] = useState(rank.description)
  const [saving, setSaving] = useState(false)
  const dirty = name !== rank.name || description !== rank.description

  const save = async () => {
    if (!name.trim()) {
      toast.error('The rank needs a name.')
      return
    }
    setSaving(true)
    try {
      const res = await saveRank({
        key: rank.key,
        name: name.trim(),
        description,
        emblemUrl: rank.emblemUrl,
        levels: rank.levels.map((level) => ({
          level: level.level,
          unlockCopy: level.unlockCopy,
          minRegistrations: level.minRegistrations,
          minFullDrops: level.minFullDrops,
        })),
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(`Rank “${name.trim()}” saved.`)
      await refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid items-end gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)]/30 p-3 md:grid-cols-[10rem_1fr_auto]">
      <FormField label={`Rank — ${rank.key}`} labelStyle="micro">
        <Input density="compact" value={name} onChange={(e) => setName(e.target.value)} />
      </FormField>
      <FormField label="Description" labelStyle="micro">
        <Input
          density="compact"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </FormField>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        density="compact"
        loading={saving}
        disabled={!dirty || saving}
        onClick={() => void save()}
      >
        Save
      </Button>
    </div>
  )
}

/** Step 4 — badges: active toggles + create new milestones inline. */
function BadgesStep({ rules, rulesError, refresh, onNavigate }: RulesStepProps) {
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [metric, setMetric] = useState<GamificationMetric>('registrations')
  const [target, setTarget] = useState('1')
  const [creating, setCreating] = useState(false)

  const badges = rules?.badges ?? []

  const toggle = async (key: string, isActive: boolean) => {
    const badge = badges.find((b) => b.key === key)
    if (!badge) return
    setBusyKey(key)
    try {
      const res = await upsertBadge({ ...badge, isActive })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(isActive ? 'Badge activated.' : 'Badge deactivated.')
      await refresh()
    } finally {
      setBusyKey(null)
    }
  }

  const create = async () => {
    const cleanTitle = title.trim()
    const targetNum = Number.parseInt(target, 10)
    if (!cleanTitle) {
      toast.error('Give the badge a title.')
      return
    }
    if (!Number.isFinite(targetNum) || targetNum < 1) {
      toast.error('Target must be at least 1.')
      return
    }
    setCreating(true)
    try {
      const res = await upsertBadge({
        key: slugifyKey(cleanTitle),
        title: cleanTitle,
        description: '',
        metric,
        target: targetNum,
        sortOrder: badges.length,
        isActive: true,
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(`Badge “${cleanTitle}” created.`)
      setTitle('')
      setTarget('1')
      await refresh()
    } finally {
      setCreating(false)
    }
  }

  return (
    <SetupStepBody
      intro="Badges are milestone markers — the same metric + target shape as challenges, but permanent once earned. Define the milestones worth celebrating."
      status={rulesStatus(
        rules,
        rulesError,
        `${badges.filter((b) => b.isActive).length} of ${badges.length} badges active`,
      )}
      links={GAMIFICATION_LINK}
      onNavigate={onNavigate}
    >
      {rules ? (
        <div className="space-y-4">
          <ul className="space-y-2">
            {badges.map((badge) => (
              <li key={badge.key} className="flex items-center justify-between gap-3">
                <Checkbox
                  label={badge.title}
                  description={`${GAMIFICATION_METRIC_LABELS[badge.metric]} · target ${badge.target}`}
                  checked={badge.isActive}
                  disabled={busyKey === badge.key}
                  onChange={(e) => void toggle(badge.key, e.target.checked)}
                />
              </li>
            ))}
          </ul>
          <div className="space-y-3 border-t border-[var(--color-line)]/60 pt-3">
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_6rem]">
              <FormField label="New badge title" labelStyle="stacked">
                <Input
                  density="compact"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </FormField>
              <AdminFieldSelect
                label="Metric"
                value={metric}
                onChange={(v) => setMetric(v as GamificationMetric)}
                options={METRIC_OPTIONS}
              />
              <FormField label="Target" labelStyle="stacked">
                <Input
                  density="compact"
                  type="number"
                  min={1}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </FormField>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              density="compact"
              loading={creating}
              onClick={() => void create()}
            >
              Create badge
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-[var(--color-text-muted)]">
          {rulesError ? 'Sign in with Supabase configured to edit the rules.' : 'Loading…'}
        </p>
      )}
    </SetupStepBody>
  )
}

/** Gamification — Forge XP, challenges, ranks, badges. All inline. */
export function GamificationSetupWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const rulesQuery = useQuery({
    queryKey: ADMIN_GAMIFICATION_RULES_QUERY_KEY,
    queryFn: loadGamificationRules,
    enabled: open,
  })

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ADMIN_GAMIFICATION_RULES_QUERY_KEY })
    await queryClient.invalidateQueries({ queryKey: GAMIFICATION_RULES_QUERY_KEY })
  }

  const stepProps = {
    rules: rulesQuery.data,
    rulesError: rulesQuery.isError,
    refresh,
    onNavigate: onClose,
  }

  return (
    <SetupWizard
      open={open}
      onClose={onClose}
      title="Gamification setup"
      steps={[
        {
          key: 'xp',
          title: 'Forge XP',
          blurb: 'Earn constants and the level curve.',
          render: () => <ForgeXpStep {...stepProps} />,
        },
        {
          key: 'challenges',
          title: 'Challenges',
          blurb: 'Metric + target goals with active toggles.',
          render: () => <ChallengesStep {...stepProps} />,
        },
        {
          key: 'ranks',
          title: 'Ranks',
          blurb: 'Four fixed ranks, three levels each.',
          render: () => <RanksStep {...stepProps} />,
        },
        {
          key: 'badges',
          title: 'Badges',
          blurb: 'Permanent milestone markers.',
          render: () => <BadgesStep {...stepProps} />,
        },
      ]}
    />
  )
}
