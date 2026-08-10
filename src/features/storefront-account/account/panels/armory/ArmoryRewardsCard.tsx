import { Lock } from '@/shared/icons'
import { AccountBentoCard } from '@/features/storefront-account/account/AccountBentoCard'
import { accountCardBg } from '@/features/storefront-account/account/accountCardBg'
import type { ArmoryRank } from '@/features/passport/lib/ranks'
import type { GamificationRules } from '@/features/passport/schemas/gamification.schema'
import { ICON_SIZE } from '@/shared/lib/iconSize'

/**
 * The Rewards vault — a full-width band under the collection grid.
 *
 * Why it ships before the rewards are redeemable: the ladder asks people to
 * log wears for months before anything pays out, and effort with no visible
 * payoff is effort people stop making. Showing what is waiting — with live XP
 * beside it — turns "why am I tapping this button" into "my history is already
 * counting".
 *
 * WHAT IS BLURRED IS DELIBERATE. The perks are obscured because they are
 * locked; the XP total is left crisp because it is already earned. Blurring
 * everything would hide the one number doing the motivating, and blurring
 * nothing would make a vault that is not open yet look like one that is.
 *
 * The blurred text is `aria-hidden` and paired with a real text alternative —
 * a screen reader gets the meaning rather than a list of teases it cannot
 * visually parse as obscured.
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

  // Ranks below Forged carry no reward, so "next" must skip them rather than
  // render a blank row.
  const nextRewarded = ordered
    .slice(currentIndex + 1)
    .find((r) => r.rewardTitle.trim().length > 0)

  const earned = current && current.rewardTitle.trim().length > 0 ? current : undefined

  return (
    <AccountBentoCard bg={accountCardBg('ember')} eyebrow="Rewards" className={className}>
      <div className="relative mt-1">
        {/* The locked layer. Inert to pointer and screen reader alike. */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none blur-[6px] motion-safe:transition-[filter] motion-safe:duration-500"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="anvl-micro text-[9px] uppercase tracking-[0.2em] text-[var(--color-highlight-bright)]">
                Banked at {rank.title}
              </p>
              <p className="mt-1 text-base font-semibold text-[var(--color-heading)]">
                {earned ? earned.rewardTitle : 'Nothing banked yet'}
              </p>
              <p className="anvl-micro mt-0.5 text-[10px] leading-relaxed text-[var(--color-text-muted)]">
                {earned
                  ? earned.rewardDescription
                  : 'Reach Forged and the vault starts filling.'}
              </p>
            </div>
            <div>
              <p className="anvl-micro text-[9px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                Next
              </p>
              <p className="mt-1 text-base font-semibold text-[var(--color-heading)]">
                {nextRewarded ? nextRewarded.rewardTitle : 'You hold the last one'}
              </p>
              <p className="anvl-micro mt-0.5 text-[10px] leading-relaxed text-[var(--color-text-muted)]">
                {nextRewarded
                  ? `Unlocks at ${nextRewarded.name}.`
                  : 'There is nothing above this rank.'}
              </p>
            </div>
          </div>
        </div>

        {/* The seal, crisp over the blur. */}
        <div className="absolute inset-0 grid place-items-center">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <span
              aria-hidden="true"
              className="grid h-9 w-9 place-items-center rounded-full border border-[var(--color-line)] bg-[var(--color-bg)]/70 text-[var(--color-highlight-bright)] backdrop-blur-sm"
            >
              <Lock size={ICON_SIZE.sm} />
            </span>
            <p className="anvl-micro text-[10px] uppercase tracking-[0.28em] text-[var(--color-heading)]">
              Coming soon
            </p>
          </div>
        </div>
      </div>

      {/* Crisp, and outside the blurred layer: this is the earned part. */}
      <p className="anvl-micro mt-3 border-t border-[var(--color-line)] pt-2.5 text-[10px] text-[var(--color-text-muted)]">
        Your XP so far:{' '}
        <span className="text-[var(--color-highlight-bright)]">{totalXp.toLocaleString()}</span>
        {' · '}nothing you earn now is lost
      </p>

      {/* Text alternative for the obscured layer above. */}
      <p className="sr-only">
        Rewards are not open yet. When the vault opens, the perks attached to each rank
        unlock automatically based on the {totalXp.toLocaleString()} XP you have already
        earned. Keep training.
      </p>
    </AccountBentoCard>
  )
}
