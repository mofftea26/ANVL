import { gsap } from '@/shared/lib/gsap'

/** Progress threshold below which the hero is treated as "at scroll top". */
export const CINEMATIC_SCROLL_TOP_EPSILON = 0.001

export function isCinematicScrollAtTop(progress: number): boolean {
  return progress <= CINEMATIC_SCROLL_TOP_EPSILON
}

export function resolveActiveSectionIndex(progress: number, sectionCount: number): number {
  if (sectionCount <= 0) return 0
  if (isCinematicScrollAtTop(progress)) return 0
  return Math.min(sectionCount - 1, Math.floor(progress * sectionCount))
}

/**
 * Raise the active beat above siblings during crossfades so reverse scrub does not
 * paint faded beats over the incoming section.
 */
export function syncCinematicBeatStack(
  host: HTMLElement,
  activeIndex: number,
  sectionCount: number,
) {
  const beats = gsap.utils.toArray<HTMLElement>('[data-cinematic-beat]', host)
  beats.forEach((beat, i) => {
    gsap.set(beat, {
      zIndex: i === activeIndex ? sectionCount + 1 : i + 1,
    })
  })
}

/**
 * Force section 0 visible and hide later beats — used at scroll progress 0 so scrub
 * lag cannot leave the first beat faded after the user returns to the top.
 */
export function applyCinematicHeroScrollStartState(
  host: HTMLElement,
  firstSectionId: string | undefined,
) {
  if (!firstSectionId) return

  const beats = gsap.utils.toArray<HTMLElement>('[data-cinematic-beat]', host)
  beats.forEach((beat, index) => {
    const isFirst =
      beat.dataset.cinematicBeat === firstSectionId || beat.hasAttribute('data-cinematic-beat-first')
    gsap.set(beat, {
      opacity: isFirst ? 1 : 0,
      y: isFirst ? 0 : 40,
      scale: isFirst ? 1 : 0.94,
      filter: isFirst ? 'blur(0px)' : 'blur(8px)',
      pointerEvents: isFirst ? 'auto' : 'none',
      visibility: isFirst ? 'visible' : 'hidden',
      zIndex: isFirst ? beats.length + 1 : index + 1,
    })
    const lines = gsap.utils.toArray<HTMLElement>('[data-cinematic-copy]', beat)
    gsap.set(lines, {
      opacity: isFirst ? 1 : 0,
      y: isFirst ? 0 : 36,
      scale: isFirst ? 1 : 0.96,
      filter: isFirst ? 'blur(0px)' : 'blur(10px)',
    })
  })
}
