import type { RefObject } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '@/shared/lib/gsap'
import { getActiveLenis } from '@/shared/lib/lenisRegistry'
import { ABOUT_CINEMATIC_MQ } from '../../aboutBreakpoints'
import type { AboutScrollMotion } from '../motion/aboutMotionState'
import { scopedSelector } from '../motion/aboutMotionHelpers'
import { ABOUT_SCROLL } from '../motion/aboutScrollTiming'
import { buildAboutHero } from '../motion/buildAboutHero'
import { buildAboutOrbChapter } from '../motion/buildAboutOrbChapter'
import { buildAboutMarquee } from '../motion/buildAboutMarquee'
import { buildAboutAltarPin } from '../motion/buildAboutAltarPin'
import { buildAboutRail } from '../motion/buildAboutRail'

/** The scroll offset that lands a chapter fully materialized: the pin's start
 *  plus the materialize beat's worth of its scrub room. */
export function chapterArrivalY(trigger: ScrollTrigger): number {
  return trigger.start + (trigger.end - trigger.start) * ABOUT_SCROLL.materializeEnd
}

/**
 * A deep link (`#about-orb-<id>`) lands INSIDE the film: resolve the id to
 * its pinned chapter and jump there instantly (Lenis when active, so the
 * scroller proxy stays truthful). Runs a frame after the triggers build so
 * every pin has measured.
 */
function jumpToHashChapter(orbIds: readonly string[]): void {
  const match = window.location.hash.match(/^#about-orb-(.+)$/)
  if (!match) return
  const index = orbIds.indexOf(decodeURIComponent(match[1]))
  if (index < 0) return
  requestAnimationFrame(() => {
    const trigger = ScrollTrigger.getById(`about-orb-pin-${index}`)
    if (!trigger) return
    const y = chapterArrivalY(trigger)
    const lenis = getActiveLenis()
    if (lenis) lenis.scrollTo(y, { immediate: true })
    else window.scrollTo(0, y)
  })
}

/**
 * The About film's master scroll choreography. One `gsap.matchMedia()` branch
 * — the experience itself only mounts under `ABOUT_CINEMATIC_MQ` (the static
 * page is a different component, so there is no in-experience static branch),
 * but the query keeps a mid-session viewport shrink or reduced-motion flip
 * honest: matchMedia auto-reverts every trigger the moment the query stops
 * matching, before React swaps the component out.
 *
 * Builders follow the Oath contract: `(host, q, motion) => disposer`, scene
 * components carry markup + `data-*` hooks only, and all cross-tree motion
 * flows through the mutable {@link AboutScrollMotion}.
 */
export function useAboutScrollTimeline(
  root: RefObject<HTMLElement | null>,
  motion: AboutScrollMotion,
  orbIds: readonly string[],
): void {
  useGSAP(
    () => {
      const host = root.current
      if (!host) return
      const mm = gsap.matchMedia()
      mm.add(ABOUT_CINEMATIC_MQ, () => {
        const q = scopedSelector(host)
        const disposers: Array<() => void> = []

        disposers.push(buildAboutHero(host, q, motion))
        const chapters = gsap.utils.toArray<HTMLElement>('[data-scene="orb"]', host)
        chapters.forEach((section, index) => {
          disposers.push(buildAboutOrbChapter(section, index, motion))
        })
        disposers.push(buildAboutMarquee(host, q, motion))
        disposers.push(buildAboutAltarPin(host, motion))
        disposers.push(buildAboutRail(host))

        // Film-wide depth — the WebGL camera's one source of travel.
        const depth = ScrollTrigger.create({
          trigger: host,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            motion.scrollDepth = self.progress
          },
        })
        disposers.push(() => depth.kill())

        jumpToHashChapter(orbIds)

        return () => {
          for (const dispose of disposers) dispose()
        }
      })
      return () => mm.revert()
    },
    { scope: root, dependencies: [orbIds.join('|')] },
  )
}
