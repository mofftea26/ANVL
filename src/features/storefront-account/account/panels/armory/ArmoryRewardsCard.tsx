import { AccountBentoCard } from '@/features/storefront-account/account/AccountBentoCard'
import { accountCardBg } from '@/features/storefront-account/account/accountCardBg'
import type { ArmoryRank } from '@/features/passport/lib/ranks'
import type { GamificationRules } from '@/features/passport/schemas/gamification.schema'

/**
 * The Rewards card — a "coming soon" surface that shows the perk attached to
 * the owner's CURRENT rank plus the next one still to earn.
 *
 * Why it ships before the rewards themselves exist: the whole ladder asks
 * people to log wears for months before anything is redeemable, and effort
 * with no visible payoff is effort people stop making. Showing the perk they
 * have already banked — with live XP next to it — converts "why am I tapping
 * this button" into "my history is already counting". The vault opening later
 * then pays out a balance that was accruing the whole time.
 *
 * Nothing here claims a reward is redeemable NOW. The status word comes from
 * `reward_status` on the rank, so flipping a perk live is a CMS edit rather
 * than a code change.
 */
export function ArmoryRewardsCard({
  rank,
  rules,
  totalXp,
  className,
}: {
  rank: ArmoryRank
  rules: GamificationRules
  totalXp: number
  className?: string
}) {
  const ordered = [...rules.ranks].sort((a, b) => a.sortOrder - b.sortOrder)
  const currentIndex = ordered.findIndex((r) => r.key === rank.key)
  const current = currentIndex >= 0 ? ordered[currentIndex] : undefined

  // The next rank that actually carries a reward — ranks below Forged have
  // none, so "next reward" must skip them rather than showing a blank row.
  const nextRewarded = ordered
    .slice(currentIndex + 1)
    .find((r) => r.rewardTitle.trim().length > 0)

  const earned = current && current.rewardTitle.trim().length > 0 ? current : undefined

  return (
    <AccountBentoCard bg={accountCardBg('ember')} eyebrow="Rewards" className={className}>
      {earned ? (
        <>
          <p className="mt-1 text-sm font-semibold text-[var(--color-heading)]">
            {earned.rewardTitle}
          </p>
          <p className="anvl-micro mt-0.5 text-[9px] uppercase tracking-[0.18em] text-[var(--color-highlight-bright)]">
            {earned.rewardStatus === 'live' ? 'Ready to claim' : 'Coming soon'}
          </p>
        </>
      ) : (
        <p className="mt-1 text-sm font-semibold text-[var(--color-heading)]">
          Nothing banked yet
        </p>
      )}

      <p className="anvl-micro mt-2 text-[10px] leading-relaxed text-[var(--color-text-muted)]">
        {nextRewarded ? (
          <>
            Next: <span className="text-[var(--color-heading)]">{nextRewarded.rewardTitle}</span> at{' '}
            {nextRewarded.name}.
          </>
        ) : (
          <>You hold the last reward on the ladder. There is nothing above it.</>
        )}
      </p>

      <p className="anvl-micro mt-1.5 text-[9px] text-[var(--color-text-muted)]">
        Your XP so far:{' '}
        <span className="text-[var(--color-highlight-bright)]">{totalXp.toLocaleString()}</span>
        {' · '}nothing you earn now is lost
      </p>
    </AccountBentoCard>
  )
}
