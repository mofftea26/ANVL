import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from '@/shared/lib/gsap'
import { useReducedMotion } from './useReducedMotion'

/**
 * Drives Lenis from GSAP's ticker so every scroll-linked animation
 * stays in lockstep with the smooth-scrolled viewport. We use
 * `lerp` instead of `duration` for a buttery, continuously-easing
 * scroll — the page eases toward the user's input every frame so
 * there's no perceptible "snap" at the end of a wheel flick.
 *
 * `prefers-reduced-motion` skips Lenis entirely; the browser handles
 * scrolling natively and ScrollTrigger still works against
 * `window.scrollY`.
 */
export function useLenisScroll(enabled: boolean) {
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!enabled || reduced) {
      return
    }

    const lenis = new Lenis({
      // Smaller lerp = silkier interpolation. 0.07 reads as "you're
      // floating across the page" without feeling lagged.
      lerp: 0.07,
      smoothWheel: true,
      // Wheel input is dialed down slightly so each notch advances
      // the page a softer amount, which compounds with the low lerp
      // to give the "you're not even scrolling" feel.
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
    })

    const onScroll = () => ScrollTrigger.update()
    lenis.on('scroll', onScroll)

    const ticker = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(ticker)
    gsap.ticker.lagSmoothing(0)

    // Layout can shift after fonts load or images decode; recompute
    // trigger positions so pinned sequences line up perfectly.
    const refresh = () => ScrollTrigger.refresh()
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(refresh).catch(() => {})
    }
    window.addEventListener('load', refresh)

    return () => {
      window.removeEventListener('load', refresh)
      lenis.off('scroll', onScroll)
      gsap.ticker.remove(ticker)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
    }
  }, [enabled, reduced])
}
