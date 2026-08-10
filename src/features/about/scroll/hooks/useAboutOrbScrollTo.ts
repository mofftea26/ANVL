import { useCallback } from 'react'
import { ScrollTrigger } from '@/shared/lib/gsap'
import { getActiveLenis } from '@/shared/lib/lenisRegistry'
import { ABOUT_SCROLL, aboutScrollToEase } from '../motion/aboutScrollTiming'
import { chapterArrivalY } from './useAboutScrollTimeline'

/**
 * The film's ONE eased programmatic scroll. Rides Lenis when active (a native
 * smooth scroll fights its internal target — ScrollTrigger reads through the
 * scroller proxy); falls back to the browser otherwise. Used by the strike
 * answer, the minimap rail, and hash arrivals alike.
 */
export function scrollFilmToY(y: number): void {
  const lenis = getActiveLenis()
  if (lenis) {
    lenis.scrollTo(y, {
      duration: ABOUT_SCROLL.scrollToDurationS,
      easing: aboutScrollToEase,
    })
  } else {
    window.scrollTo({ top: y, behavior: 'smooth' })
  }
}

/**
 * The strike's answer — an eased scroll back up to an orb's chapter. Always
 * targets the PIN's scroll offset (`ScrollTrigger.getById`), never the
 * element's rect: a pinned section's DOM position says nothing about where in
 * the document its pin owns scroll. Also the orb picker chips' keyboard/AT
 * path.
 */
export function useAboutOrbScrollTo(): (index: number) => void {
  return useCallback((index: number) => {
    const trigger = ScrollTrigger.getById(`about-orb-pin-${index}`)
    if (!trigger) return
    scrollFilmToY(chapterArrivalY(trigger))
  }, [])
}
