import { Award, Check, Lock } from 'lucide-react'
import {
  ARMORY_BADGE_CATALOG,
  ARMORY_RANK_LADDER,
  type ArmoryBadge,
  type ArmoryRank,
} from '@/features/passport/lib/ranks'
import { Modal } from '@/shared/components/ui/Modal'
import { cn } from '@/shared/lib/cn'

// Rank order for "have I passed this tier?" comparisons.
const RANK_ORDER = ['initiate', 'forged', 'oathbound', 'warlord'] as const

/**
 * The ranks ladder — every rank and its three levels with how to unlock them,
 * the current standing highlighted, plus the badge catalogue with earned ones
 * marked. Opened from the rank card in the Armory.
 */
export function RankLadderModal({
  open,
  onClose,
  rank,
  earnedBadges,
}: {
  open: boolean
  onClose: () => void
  rank: ArmoryRank
  earnedBadges: ArmoryBadge[]
}) {
  const currentRankIdx = RANK_ORDER.indexOf(rank.key)
  const earned = new Set(earnedBadges.map((b) => b.key))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ranks & badges"
      className="max-h-[85svh] max-w-2xl overflow-y-auto"
    >
      <p className="anvl-micro -mt-2 mb-5 text-[var(--color-text-muted)]">
        You are <span className="text-[var(--color-highlight-bright)]">{rank.title}</span> —{' '}
        {rank.description}
      </p>

      <div className="space-y-3">
        {ARMORY_RANK_LADDER.map((entry, idx) => {
          const passed = idx < currentRankIdx
          const isCurrentRank = idx === currentRankIdx
          return (
            <div
              key={entry.key}
              className={cn(
                'rounded-xl border p-4',
                isCurrentRank
                  ? 'border-[color-mix(in_oklab,var(--color-highlight)_45%,var(--color-line))] bg-[color-mix(in_oklab,var(--color-highlight)_10%,var(--color-surface))]'
                  : 'border-[var(--color-line)] bg-[var(--color-surface)]',
              )}
            >
              <div className="flex items-center gap-3">
                <img
                  src={entry.emblemSrc}
                  alt=""
                  aria-hidden="true"
                  width={72}
                  height={72}
                  loading="lazy"
                  decoding="async"
                  className={cn(
                    'h-11 w-11 shrink-0 object-contain',
                    !passed && !isCurrentRank && 'opacity-40 grayscale',
                  )}
                />
                <div>
                  <p className="anvl-heading text-lg text-[var(--color-heading)]">{entry.name}</p>
                  <p className="anvl-micro text-[10px] text-[var(--color-text-muted)]">
                    {entry.description}
                  </p>
                </div>
              </div>

              <ul className="mt-3 grid gap-1.5 sm:grid-cols-3">
                {entry.levels.map((lvl) => {
                  const isCurrentLevel = isCurrentRank && lvl.level === rank.level
                  const unlocked = passed || (isCurrentRank && lvl.level <= rank.level)
                  return (
                    <li
                      key={lvl.level}
                      className={cn(
                        'rounded-lg border px-2.5 py-1.5',
                        isCurrentLevel
                          ? 'border-[var(--color-highlight-bright)] bg-[color-mix(in_oklab,var(--color-highlight)_16%,transparent)]'
                          : 'border-[var(--color-line)]',
                      )}
                    >
                      <p className="flex items-center gap-1 text-[11px] font-semibold text-[var(--color-heading)]">
                        {unlocked ? (
                          <Check size={11} aria-hidden="true" className="text-[var(--color-success)]" />
                        ) : (
                          <Lock size={10} aria-hidden="true" className="text-[var(--color-text-muted)]" />
                        )}
                        {lvl.title}
                      </p>
                      <p className="anvl-micro mt-0.5 text-[9px] text-[var(--color-text-muted)]">
                        {lvl.unlock}
                      </p>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>

      {/* Badges */}
      <div className="mt-6">
        <h3 className="anvl-heading mb-3 flex items-center gap-2 text-lg text-[var(--color-heading)]">
          <Award size={16} aria-hidden="true" className="text-[var(--color-highlight-bright)]" />
          Badges
        </h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {ARMORY_BADGE_CATALOG.map((badge) => {
            const has = earned.has(badge.key)
            return (
              <li
                key={badge.key}
                className={cn(
                  'flex items-center gap-3 rounded-xl border px-3 py-2.5',
                  has
                    ? 'border-[color-mix(in_oklab,var(--color-highlight)_40%,var(--color-line))] bg-[var(--color-surface)]'
                    : 'border-dashed border-[var(--color-line)]',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    has
                      ? 'bg-[var(--color-highlight-bright)] text-[color:var(--color-on-highlight)]'
                      : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]',
                  )}
                >
                  {has ? <Check size={15} aria-hidden="true" /> : <Lock size={13} aria-hidden="true" />}
                </span>
                <div className={cn(!has && 'opacity-60')}>
                  <p className="text-sm font-semibold text-[var(--color-heading)]">{badge.title}</p>
                  <p className="anvl-micro text-[10px] text-[var(--color-text-muted)]">
                    {badge.description}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </Modal>
  )
}
