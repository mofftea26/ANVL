import { cn } from '@/shared/lib/cn'

/**
 * A persistent forge environment that sits *behind* a whole experience so its
 * scenes share one continuous atmosphere instead of each owning an opaque
 * background — the landing reads as a single scene that content bleeds through.
 *
 * Pure CSS: a deep radial bg, a warm ember glow, drifting embers, and grain.
 * Ember positions are a fixed table (no `Math.random` → SSR-safe, no hydration
 * mismatch); the drift animation is disabled under `prefers-reduced-motion`
 * via `.anvl-ember`.
 */

/** Deterministic ember field — [leftPct, bottomStartPct, dxPx, durSec, delaySec, size]. */
const EMBERS: ReadonlyArray<[number, number, number, number, number, number]> = [
  [8, 4, 18, 8, 0, 3],
  [18, 0, -14, 11, 2.5, 2],
  [29, 10, 10, 9, 1.2, 4],
  [41, 2, 22, 12, 4, 2],
  [52, 6, -18, 10, 0.6, 3],
  [63, 0, 14, 13, 3.4, 2],
  [71, 8, -10, 9, 1.8, 4],
  [82, 3, 20, 11, 5, 3],
  [91, 1, -16, 8, 2.2, 2],
  [36, 5, -8, 14, 6, 2],
  [58, 9, 12, 10, 3, 3],
  [76, 4, -20, 12, 1, 2],
]

export function ForgeAtmosphere({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      {/* Deep forge base + warm low glow. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 120%, var(--color-ember-soft) 0%, transparent 55%), radial-gradient(100% 60% at 50% -10%, #202327 0%, transparent 50%), var(--color-bg)',
        }}
      />

      {/* Drifting embers. */}
      <div className="absolute inset-0">
        {EMBERS.map(([left, bottom, dx, dur, delay, size], i) => (
          <span
            key={i}
            className="anvl-ember absolute rounded-full"
            style={{
              left: `${left}%`,
              bottom: `${bottom}%`,
              width: `${size}px`,
              height: `${size}px`,
              background: 'var(--color-ember-bright)',
              boxShadow: '0 0 6px 1px var(--color-ember-soft)',
              ['--ember-dx' as string]: `${dx}px`,
              ['--ember-dur' as string]: `${dur}s`,
              animationDelay: `${delay}s`,
            }}
          />
        ))}
      </div>

      {/* Grain. */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
          backgroundSize: '3px 3px',
        }}
      />
    </div>
  )
}
