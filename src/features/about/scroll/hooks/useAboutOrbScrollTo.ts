import { useCallback } from 'react'
import { ScrollTrigger } from '@/shared/lib/gsap'
import { getActiveLenis } from '@/shared/lib/lenisRegistry'
import { ABOUT_SCROLL, aboutScrollToEase } from '../motion/aboutScrollTiming'
import { chapterArrivalY } from './useAboutScrollTimeline'

/**
 * The strike's answer — an eased scroll back up to an orb's chapter. Always
 * targets the PIN's scroll offset (`ScrollTrigger.getById`), never the
 * element's rect: a pinned section's DOM position says nothing about where in
 * the document its pin owns scroll. Rides Lenis when active (a native smooth
 * scroll fights its internal target); falls back to the browser otherwise.
 * Also the orb picker chips' keyboard/AT path.
 */
export function useAboutOrbScrollTo(): (index: number) => void {
  return useCallback((index: number) => {
    const trigger = ScrollTrigger.getById(`about-orb-pin-${index}`)
    if (!trigger) return
    const y = chapterArrivalY(trigger)
    const lenis = getActiveLenis()
    if (lenis) {
      lenis.scrollTo(y, {
        duration: ABOUT_SCROLL.scrollToDurationS,
        easing: aboutScrollToEase,
      })
    } else {
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }, [])
}
