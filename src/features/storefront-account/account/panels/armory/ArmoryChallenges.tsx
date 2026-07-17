import { Check } from '@/shared/icons'
import {
  CHALLENGE_CATEGORIES,
  type ChallengeProgress,
} from '@/features/passport/lib/challenges'

/**
 * The quest log, grouped by category — rendered inside the Challenges overlay
 * (opened from its bento card). Within each category the nearest-to-done
 * leads; completed ones settle below with a struck seal.
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
                      </p>
                      <span className="anvl-micro shrink-0 text-[10px] text-[var(--color-text-muted)]">
                        {c.current} / {c.target}
                      </span>
                    </div>
                    <p className="anvl-micro mt-0.5 text-[10px] text-[var(--color-text-muted)]">
                      {c.description}
                    </p>
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
