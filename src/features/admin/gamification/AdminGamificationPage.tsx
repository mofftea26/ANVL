import { lazy, Suspense, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Crown, Medal, Sparkles, Target } from '@/shared/icons'
import { AdminLoadingState } from '@/features/admin/components/AdminLoadingState'
import { AdminRailPanel } from '@/features/admin/components/AdminRailPanel'
import { AdminWorkspace } from '@/features/admin/components/AdminWorkspace'
import { AdminWorkspaceStatusPanel } from '@/features/admin/components/AdminWorkspaceStatusPanel'
import { GAMIFICATION_RULES_QUERY_KEY } from '@/features/passport/hooks/useGamificationRules'
import { cn } from '@/shared/lib/cn'
import { loadGamificationRules } from './gamification.service'

const GamificationRanksTab = lazy(() =>
  import('./GamificationRanksTab').then((m) => ({ default: m.GamificationRanksTab })),
)
const GamificationChallengesTab = lazy(() =>
  import('./GamificationChallengesTab').then((m) => ({ default: m.GamificationChallengesTab })),
)
const GamificationXpTab = lazy(() =>
  import('./GamificationXpTab').then((m) => ({ default: m.GamificationXpTab })),
)
const GamificationBadgesTab = lazy(() =>
  import('./GamificationBadgesTab').then((m) => ({ default: m.GamificationBadgesTab })),
)

type GamificationTab = 'ranks' | 'challenges' | 'xp' | 'badges'

const TABS: Array<{ key: GamificationTab; label: string; icon: typeof Crown }> = [
  { key: 'ranks', label: 'Ranks', icon: Crown },
  { key: 'challenges', label: 'Challenges', icon: Target },
  { key: 'xp', label: 'Forge XP', icon: Sparkles },
  { key: 'badges', label: 'Badges', icon: Medal },
]

export const ADMIN_GAMIFICATION_RULES_QUERY_KEY = ['admin', 'gamification', 'rules'] as const

/**
 * /admin/gamification — everything the Armory's progression is made of:
 * the rank ladder, the challenge log, Forge XP tuning, and badges. All rules
 * live in the `gamification_*` tables; storefront surfaces read them through
 * the same public rules fetch, so a save here is live for every athlete.
 */
export function AdminGamificationPage() {
  const [tab, setTab] = useState<GamificationTab>('ranks')
  const queryClient = useQueryClient()

  const rulesQuery = useQuery({
    queryKey: ADMIN_GAMIFICATION_RULES_QUERY_KEY,
    queryFn: loadGamificationRules,
  })

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ADMIN_GAMIFICATION_RULES_QUERY_KEY })
    await queryClient.invalidateQueries({ queryKey: GAMIFICATION_RULES_QUERY_KEY })
  }

  const rail = (
    <>
      <AdminRailPanel
        title="How gamification works"
        description="Rules are public data — the Armory ladder, challenge log, and XP math all read this table set."
      >
        <ul className="space-y-2 text-xs text-[var(--color-text-muted)]">
          <li>Saving is live immediately — athletes see new thresholds on their next visit.</li>
          <li>Ranks are fully yours — create, delete, reorder, and edit copy, emblems, and thresholds.</li>
          <li>Challenges and badges are metric + target — no code deploys needed.</li>
        </ul>
      </AdminRailPanel>
      <AdminWorkspaceStatusPanel />
    </>
  )

  return (
    <AdminWorkspace asideLabel="Gamification help" aside={rail}>
      <div className="space-y-6" data-testid="admin-gamification">
        <div
          role="tablist"
          aria-label="Gamification surfaces"
          className="inline-flex flex-wrap gap-1 rounded-full border border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-surface)_55%,transparent)] p-1"
        >
          {TABS.map((t) => {
            const active = t.key === tab
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className={cn(
                  'focus-ring flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] transition-colors',
                  active
                    ? 'bg-gradient-to-b from-[var(--color-highlight-bright)] to-[var(--color-highlight)] text-[color:var(--color-on-highlight)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
                )}
              >
                <t.icon size={15} aria-hidden="true" />
                {t.label}
              </button>
            )
          })}
        </div>

        {rulesQuery.isLoading || !rulesQuery.data ? (
          <AdminLoadingState message="Loading gamification rules…" />
        ) : (
          <Suspense fallback={<AdminLoadingState message="Loading editor…" />}>
            {tab === 'ranks' ? (
              <GamificationRanksTab rules={rulesQuery.data} onSaved={refresh} />
            ) : tab === 'challenges' ? (
              <GamificationChallengesTab rules={rulesQuery.data} onSaved={refresh} />
            ) : tab === 'xp' ? (
              <GamificationXpTab rules={rulesQuery.data} onSaved={refresh} />
            ) : (
              <GamificationBadgesTab rules={rulesQuery.data} onSaved={refresh} />
            )}
          </Suspense>
        )}
      </div>
    </AdminWorkspace>
  )
}
