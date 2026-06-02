import type { CinematicScrollLength } from './cinematicHero.types'
import { CINEMATIC_SCROLL_LENGTH_MAP } from './cinematicHero.types'

export const CINEMATIC_HERO_MOTION = {
  desktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
  mobile: '(max-width: 767px) and (prefers-reduced-motion: no-preference)',
  reduced: '(prefers-reduced-motion: reduce)',
} as const

export function cinematicScrollEnd(length: CinematicScrollLength): string {
  return CINEMATIC_SCROLL_LENGTH_MAP[length] ?? CINEMATIC_SCROLL_LENGTH_MAP.standard
}

/** Evenly distribute section beat windows across scroll progress 0→1. */
export function computeSectionBeats(sectionCount: number): Array<{ inAt: number; outAt: number }> {
  if (sectionCount <= 0) return []
  const slice = 1 / sectionCount
  return Array.from({ length: sectionCount }, (_, i) => {
    const inAt = i * slice
    const outAt = i === sectionCount - 1 ? 1 : (i + 1) * slice - slice * 0.08
    return { inAt, outAt }
  })
}
