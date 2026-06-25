import type { RefObject } from 'react'
import { gsap, useGSAP } from '@/shared/lib/gsap'
import {
  attachLandingMagnetics,
  scopedSelector,
} from '@/features/landingPages/motion/landingMotion'
import {
  LANDING_DESKTOP_CINEMATIC_MQ,
  LANDING_STATIC_MQ,
} from '@/features/landingPages/landingBreakpoints'
import type { TmMotionState } from '../motion/tmMotionState'
import { buildTmHero } from '../motion/buildTmHero'
import { buildTmReveals } from '../motion/buildTmReveals'
import { buildTmHeadings } from '../motion/buildTmHeadings'
import { buildTmParallax } from '../motion/buildTmParallax'
import { buildTmStatic } from '../motion/buildTmStatic'

/**
 * Theoath Modern — master scroll choreography.
 *
 * `gsap.matchMedia` branches identically to The Oath: desktop (`≥1280px`, no
 * reduced motion) runs the hero entrance + scroll-linked depth, section reveals,
 * bleed transitions, and magnetics — writing progress into the shared motion
 * state that drives the WebGL platform. Mobile/tablet/reduced-motion get static
 * batch reveals (no pins, no WebGL). Builders return disposers; `mm.revert()`
 * kills every trigger on cleanup. Only builds once the entry overlay releases.
 */
function buildCinematic(host: HTMLElement, motion: TmMotionState): () => void {
  const q = scopedSelector(host)
  const disposers: Array<() => void> = [
    buildTmHero(host, q, motion),
    buildTmHeadings(q),
    buildTmReveals(q, motion),
    buildTmParallax(q),
    attachLandingMagnetics(host),
  ]
  return () => {
    for (const dispose of disposers) dispose()
  }
}

export function useTheoathModernTimeline(
  root: RefObject<HTMLElement | null>,
  entryComplete: boolean,
  motion: TmMotionState,
): void {
  useGSAP(
    () => {
      if (!entryComplete) return
      const host = root.current
      if (!host) return
      const mm = gsap.matchMedia()
      mm.add(LANDING_STATIC_MQ, () => {
        const dispose = buildTmStatic(host)
        return dispose ?? undefined
      })
      mm.add(LANDING_DESKTOP_CINEMATIC_MQ, () => buildCinematic(host, motion))
      return () => mm.revert()
    },
    { scope: root, dependencies: [entryComplete] },
  )
}
