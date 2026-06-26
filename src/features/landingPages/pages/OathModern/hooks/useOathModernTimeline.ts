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
import type { OathModernMotionState } from '../motion/oathModernMotionState'
import { buildOathModernProgress } from '../motion/buildOathModernProgress'
import { buildOathModernReveals } from '../motion/buildOathModernReveals'
import { buildOathModernStatic } from '../motion/buildOathModernStatic'

/**
 * The Oath Modern — master scroll choreography.
 *
 * `gsap.matchMedia` branches like the other landing pages: desktop (`≥1280px`, no
 * reduced motion) runs the single-progress journey (one unpinned ScrollTrigger
 * feeding the WebGL camera), per-chapter reveals + bleed parallax, and magnetics;
 * mobile / tablet / reduced-motion get static batch reveals (no pins, no WebGL,
 * no camera). Builders return disposers; `mm.revert()` kills every trigger on
 * cleanup. Only builds once the entry overlay releases.
 */
function buildCinematic(
  host: HTMLElement,
  motion: OathModernMotionState,
): () => void {
  const q = scopedSelector(host)
  const disposers: Array<() => void> = [
    buildOathModernProgress(host, motion),
    buildOathModernReveals(q),
    attachLandingMagnetics(host),
  ]
  return () => {
    for (const dispose of disposers) dispose()
  }
}

export function useOathModernTimeline(
  root: RefObject<HTMLElement | null>,
  entryComplete: boolean,
  motion: OathModernMotionState,
): void {
  useGSAP(
    () => {
      if (!entryComplete) return
      const host = root.current
      if (!host) return
      const mm = gsap.matchMedia()
      mm.add(LANDING_STATIC_MQ, () => {
        const dispose = buildOathModernStatic(host)
        return dispose ?? undefined
      })
      mm.add(LANDING_DESKTOP_CINEMATIC_MQ, () => buildCinematic(host, motion))
      return () => mm.revert()
    },
    { scope: root, dependencies: [entryComplete] },
  )
}
