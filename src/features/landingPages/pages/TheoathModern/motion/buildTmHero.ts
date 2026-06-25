import { gsap, ScrollTrigger } from '@/shared/lib/gsap'
import {
  LANDING_PREMIUM_EASE,
  splitUnits,
  type LandingSelector,
} from '@/features/landingPages/motion/landingMotion'
import type { TmMotionState } from './tmMotionState'

/**
 * Hero choreography: the lab resolves from darkness, the headline reveals through
 * clipped line masks, supporting copy and CTAs settle, the product stage emerges
 * from fog, and the technical hotspot lines draw outward last. A non-pinned
 * scrubbed trigger writes `heroProgress`/`platformProgress` into the shared
 * motion state (consumed by the WebGL platform). No scroll-jacking.
 */
export function buildTmHero(
  host: HTMLElement,
  q: LandingSelector,
  motion: TmMotionState,
): () => void {
  const disposers: Array<() => void> = []
  const section = q('[data-tm-section="hero"]')[0]
  if (!section) return () => {}

  const headline = q('[data-tm-headline]')[0]
  const fades = q('[data-tm-hero-fade]')
  const stage = q('[data-tm-stage]')[0]
  const hotspots = q('[data-tm-hotspot]')

  const ctx = gsap.context(() => {
    const tl = gsap.timeline({
      defaults: { ease: LANDING_PREMIUM_EASE },
    })

    if (headline) {
      const { units, revert } = splitUnits(headline, 'lines')
      disposers.push(revert)
      gsap.set(units, { yPercent: 120 })
      tl.to(units, { yPercent: 0, duration: 1.05, stagger: 0.12 }, 0.1)
    }

    if (fades.length > 0) {
      gsap.set(fades, { opacity: 0, y: 24 })
      tl.to(
        fades,
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 },
        0.5,
      )
    }

    if (stage) {
      gsap.set(stage, { opacity: 0, scale: 0.94, filter: 'blur(14px)' })
      tl.to(
        stage,
        { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.2 },
        0.35,
      )
    }

    if (hotspots.length > 0) {
      gsap.set(hotspots, { opacity: 0 })
      tl.to(
        hotspots,
        { opacity: 1, duration: 0.6, stagger: 0.14 },
        0.9,
      )
    }
  }, host)
  disposers.push(() => ctx.revert())

  // Scroll-linked depth: heroProgress 0→1 as the hero scrolls past.
  const trigger = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom top',
    scrub: 1,
    onUpdate: (self) => {
      motion.heroProgress = self.progress
      motion.platformProgress = Math.min(1, self.progress * 1.4)
    },
  })
  disposers.push(() => trigger.kill())

  return () => {
    for (const dispose of disposers) dispose()
  }
}
