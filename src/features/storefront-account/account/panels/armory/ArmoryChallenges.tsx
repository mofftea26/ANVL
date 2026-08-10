import { Check } from '@/shared/icons'
import {
  CHALLENGE_CATEGORIES,
  type ChallengeProgress,
} from '@/features/passport/lib/challenges'
import type { ChallengeDifficulty } from '@/features/passport/schemas/gamification.schema'
import { cn } from '@/shared/lib/cn'

/**
 * Difficulty tints, drawn from theme tokens rather than raw colour so the
 * whole strip re-skins with the CMS palette. Escalation reads as heat: muted
 * for easy, through the highlight ramp, to the destructive red for legendary.
 */
const DIFFICULTY_STYLE: Record<ChallengeDifficulty, { label: string; className: string }> = {
  easy: { label: 'Easy', className: 'text-[var(--color-text-muted)]' },
  medium: { label: 'Medium', className: 'text-[var(--color-highlight)]' },
  hard: { label: 'Hard', className: 'text-[var(--color-highlight-bright)]' },
  legendary: { label: 'Legendary', className: 'text-[var(--color-destructive)]' },
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'] as const

/**
 * The quest log, grouped by category — rendered inside the Challenges overlay
 * (opened from its bento card). Within each category the nearest-to-done
 * leads; completed ones settle below with a struck seal.
 *
 * Each row is one challenge FAMILY, not one threshold: `evaluateChallenges`
 * has already collapsed a tiered family to the tier being chased, so the pip
 * strip below shows how far through the family the owner is rather than
 * repeating the same goal five times.
 */
export function ArmoryChallenges({ challenges }: { challenges: ChallengeProgress[] }) {
  return (
    <div className="space-y-6">
      {CHALLENGE_CATEGORIES.map(({ key, label }) => {
        const group = challenges.filter((c) => c.category === key)
        if (group.length === 0) return null
        const done = group.filter((c) => c.complete).length
        return (
          <section key={key}>
            <div className="mb-2 flex items-center gap-3">
              <p className="anvl-micro shrink-0 text-[10px] uppercase tracking-[0.22em] text-[var(--color-highlight-bright)]">
                {label}
              </p>
              <span aria-hidden="true" className="h-px flex-1 bg-[var(--color-line)]" />
              <span className="anvl-micro shrink-0 text-[9px] text-[var(--color-text-muted)]">
                {done} / {group.length}
              </span>
            </div>
            <ul className="space-y-2.5">
              {group.map((c) => {
                const pct = Math.round(c.progress * 100)
                return (
                  <li key={c.id} className="rounded-xl bg-[var(--color-surface-elevated)] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="flex items-center gap-2 text-sm font-semibold text-[var(--color-heading)]">
                        {c.complete ? (
                          <Check
                            size={16}
                            aria-hidden="true"
                            className="text-[var(--color-success)]"
                          />
                        ) : null}
                        {c.title}
                        {c.tierCount > 1 ? (
                          <span
                            className="anvl-micro text-[9px] text-[var(--color-text-muted)]"
                            title={`Tier ${c.tier} of ${c.tierCount}`}
                          >
                            {ROMAN[c.tier - 1] ?? c.tier}
                          </span>
                        ) : null}
                      </p>
                      <span className="anvl-micro shrink-0 text-[10px] text-[var(--color-text-muted)]">
                        {c.current} / {c.target}
                      </span>
                    </div>
                    <p className="anvl-micro mt-0.5 text-[10px] text-[var(--color-text-muted)]">
                      {c.description}
                    </p>
                    <div className="anvl-micro mt-1.5 flex items-center gap-2 text-[9px]">
                      <span className={cn('uppercase tracking-[0.18em]', DIFFICULTY_STYLE[c.difficulty].className)}>
                        {DIFFICULTY_STYLE[c.difficulty].label}
                      </span>
                      <span aria-hidden="true" className="text-[var(--color-line)]">·</span>
                      <span className="text-[var(--color-text-muted)]">+{c.xpReward} XP</span>
                      {c.tierCount > 1 ? (
                        <>
                          <span aria-hidden="true" className="text-[var(--color-line)]">·</span>
                          {/* Pips read as "how much of this family is behind me". */}
                          <span
                            className="flex items-center gap-1"
                            aria-label={`Tier ${c.tier} of ${c.tierCount}`}
                          >
                            {Array.from({ length: c.tierCount }, (_, i) => (
                              <span
                                key={i}
                                aria-hidden="true"
                                className={cn(
                                  'h-1 w-1 rounded-full',
                                  i < c.tier - 1 || c.familyComplete
                                    ? 'bg-[var(--color-success)]'
                                    : i === c.tier - 1
                                      ? 'bg-[var(--color-highlight-bright)]'
                                      : 'bg-[var(--color-line)]',
                                )}
                              />
                            ))}
                          </span>
                        </>
                      ) : null}
                    </div>
                    <div
                      role="progressbar"
                      aria-valuenow={c.current}
                      aria-valuemin={0}
                      aria-valuemax={c.target}
                      aria-label={`${c.title} progress`}
                      className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-bg)]"
                    >
                      <div
                        className={
                          c.complete
                            ? 'h-full rounded-full bg-[var(--color-success)]'
                            : 'h-full rounded-full bg-gradient-to-r from-[var(--color-highlight)] to-[var(--color-highlight-bright)] motion-safe:transition-[width] motion-safe:duration-700'
                        }
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
