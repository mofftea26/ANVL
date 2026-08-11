import type { CSSProperties } from 'react'
import { ScrollTrigger } from '@/shared/lib/gsap'
import type { AboutResolvedOrb } from '../../content/aboutContent.defaults'
import { chapterArrivalY } from '../hooks/useAboutScrollTimeline'
import { scrollFilmToY } from '../hooks/useAboutOrbScrollTo'

interface RailEntry {
  /** The ScrollTrigger id whose pin this dot represents and targets. */
  triggerId: string
  label: string
  color: string
  /** Set for orb chapters — they land at the materialized beat, not the pin top. */
  orbIndex?: number
}

/**
 * The film's minimap — a fixed vertical rail on the right edge: one dot per
 * chapter (prologue, every orb, the altar finale), a hairline track whose
 * fill scales with overall scroll progress, and the active chapter's dot lit
 * in its own orb colour. Clicking a dot rides the film there through the
 * shared Lenis scroll (`scrollFilmToY` → always the PIN's own offset, never
 * element rects). Markup + `data-*` hooks only — `buildAboutRail` owns the
 * fill scrub, the active-dot tracking, and the entrance; hover/focus reveals
 * each dot's label via CSS.
 */
export function AboutProgressRail({
  orbs,
}: {
  orbs: AboutResolvedOrb[]
}) {
  const entries: RailEntry[] = [
    { triggerId: 'about-hero-pin', label: 'Prologue', color: 'var(--color-highlight-bright)' },
    ...orbs.map((orb, i) => ({
      triggerId: `about-orb-pin-${i}`,
      label: orb.label,
      color: orb.color,
      orbIndex: i,
    })),
    { triggerId: 'about-altar-pin', label: 'The Forge Altar', color: 'var(--color-accent)' },
  ]

  const go = (entry: RailEntry) => {
    if (entry.triggerId === 'about-hero-pin') {
      scrollFilmToY(0)
      return
    }
    const trigger = ScrollTrigger.getById(entry.triggerId)
    if (!trigger) return
    scrollFilmToY(entry.orbIndex !== undefined ? chapterArrivalY(trigger) : trigger.start)
  }

  return (
    <nav
      data-about-rail
      aria-label="About chapters"
      className="fixed right-4 top-1/2 z-[60] -translate-y-1/2 opacity-0"
    >
      <div className="relative flex flex-col items-center gap-2">
        {/* The journey line + its progress fill. */}
        <span
          aria-hidden="true"
          className="absolute inset-y-2 left-1/2 w-px -translate-x-1/2 bg-[color-mix(in_srgb,var(--color-line)_65%,transparent)]"
        >
          <span
            data-rail-fill
            className="absolute inset-x-0 top-0 h-full origin-top bg-[var(--color-highlight-bright)] [transform:scaleY(0)]"
            style={{ boxShadow: '0 0 8px var(--color-highlight)' }}
          />
        </span>
        {entries.map((entry) => (
          <button
            key={entry.triggerId}
            type="button"
            data-rail-dot
            data-rail-target={entry.triggerId}
            data-rail-accent={entry.color}
            aria-label={`Go to ${entry.label}`}
            onClick={() => go(entry)}
            className="focus-ring group relative z-10 flex h-5 w-5 items-center justify-center rounded-full"
            style={{ '--rail-c': entry.color } as CSSProperties}
          >
            <span
              aria-hidden="true"
              data-rail-dot-mark
              className="block h-1.5 w-1.5 rounded-full bg-[color-mix(in_srgb,var(--color-heading)_45%,transparent)] transition-all duration-300"
            />
            <span className="anvl-display pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-full border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-bg)_82%,transparent)] px-2.5 py-1 text-[9px] tracking-[0.22em] text-[var(--color-heading)]/90 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
              {entry.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  )
}
