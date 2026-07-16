import { Check, Swords } from 'lucide-react'
import type { ChallengeProgress } from '@/features/passport/lib/challenges'

/**
 * The quest log — challenges with live progress bars, nearest-to-done first so
 * the next goal always sits at the top. Completed ones settle below with a
 * struck seal. Pure display of `evaluateChallenges`.
 */
export function ArmoryChallenges({ challenges }: { challenges: ChallengeProgress[] }) {
  const done = challenges.filter((c) => c.complete).length
  return (
    <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Swords size={16} aria-hidden="true" className="text-[var(--color-highlight-bright)]" />
          <h3 className="anvl-heading text-lg text-[var(--color-heading)]">Challenges</h3>
        </div>
        <span className="anvl-micro text-[var(--color-text-muted)]">
          {done} / {challenges.length} forged
        </span>
      </div>

      <ul className="space-y-2.5">
        {challenges.map((c) => {
          const pct = Math.round(c.progress * 100)
          return (
            <li
              key={c.id}
              className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-elevated)] p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-[var(--color-heading)]">
                  {c.complete ? (
                    <Check
                      size={14}
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
}
