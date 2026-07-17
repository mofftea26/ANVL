import { Flame, Target } from 'lucide-react'
import type { ForgeLevel, NextMilestone } from '@/features/passport/lib/forgeXp'

/**
 * The Forge Level header — the addictive core of the gamification layer. A big
 * level, a live XP bar toward the next, the total XP earned, and the nearest
 * concrete goal to chase. All derived; nothing to input.
 */
export function ForgeProgress({
  forge,
  milestone,
}: {
  forge: ForgeLevel
  milestone: NextMilestone
}) {
  const pct = Math.round(forge.progress * 100)
  return (
    <section className="rounded-2xl border border-[color-mix(in_oklab,var(--color-highlight)_30%,var(--color-line))] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-highlight)_14%,var(--color-surface))_0%,var(--color-surface)_100%)] p-5 sm:p-6">
      {/* Level + total on one baseline row that can breathe (and wrap). */}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="flex items-end gap-3">
          <p className="anvl-heading text-5xl leading-none text-[var(--color-heading)]">
            {forge.level}
          </p>
          <p className="anvl-micro mb-1 flex items-center gap-1.5 text-[var(--color-highlight-bright)]">
            <Flame size={13} aria-hidden="true" /> Forge Level
          </p>
        </div>
        <div className="text-right">
          <p className="anvl-heading text-2xl leading-none text-[var(--color-heading)]">
            {forge.total.toLocaleString()}
          </p>
          <p className="anvl-micro mt-1 text-[10px] text-[var(--color-text-muted)]">total XP</p>
        </div>
      </div>

      <div
        role="progressbar"
        aria-valuenow={forge.xpIntoLevel}
        aria-valuemin={0}
        aria-valuemax={forge.xpForLevel}
        aria-label={`Forge Level ${forge.level} progress`}
        className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--color-surface-elevated)]"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--color-highlight)] to-[var(--color-highlight-bright)] motion-safe:transition-[width] motion-safe:duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* Footer wraps instead of cramming on narrow screens. */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <span className="anvl-micro text-[10px] text-[var(--color-text-muted)]">
          {forge.xpIntoLevel} / {forge.xpForLevel} XP
        </span>
        <span className="anvl-micro inline-flex min-w-0 items-center gap-1.5 text-[10px] text-[var(--color-highlight-bright)]">
          <Target size={11} aria-hidden="true" className="shrink-0" />
          <span className="truncate">
            {milestone.label} · {milestone.detail}
          </span>
        </span>
      </div>
    </section>
  )
}
