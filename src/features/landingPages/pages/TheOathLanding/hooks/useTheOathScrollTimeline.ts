import type { RefObject } from 'react'
import { gsap, useGSAP } from '@/shared/lib/gsap'
import type { OathMotionState } from '../motion/oathMotionState'
import { scopedSelector } from '../motion/oathMotionHelpers'
import { attachMagnetics } from '../motion/attachMagnetics'
import { buildOathStatic } from '../motion/buildOathStatic'
import { buildOathHero } from '../motion/buildOathHero'
import { buildOathSpotlight } from '../motion/buildOathSpotlight'
import { buildOathManifesto } from '../motion/buildOathManifesto'
import { buildOathTenets } from '../motion/buildOathTenets'
import { buildOathProducts } from '../motion/buildOathProducts'
import { buildOathFinale } from '../motion/buildOathFinale'
import { buildOathRail } from '../motion/buildOathRail'
import { OATH_DESKTOP_CINEMATIC_MQ, OATH_STATIC_MQ } from '../oathBreakpoints'

/**
 * The Oath — master scroll choreography (one continuous cinematic film).
 *
 * `gsap.matchMedia` branches: desktop (≥1280px / `xl`, no reduced motion) runs
 * the pinned cinematic film (hero video scrub + 3D monolith hero pose, creed,
 * tenets panorama, product assembly, finale, progress rail, magnetics,
 * cursor spotlight) and writes scroll progress into the shared motion state
 * that drives the WebGL uniforms. Mobile + tablet + reduced-motion get the
 * static composed layout with light batch reveals — no pins, no WebGL, no
 * manifesto/tenets (hidden in markup below xl). Builders return disposers
 * (SplitText reverts, listeners) collected per branch; `mm.revert()` kills
 * every trigger on cleanup. Scene components carry markup + `data-*` hooks
 * only. Only builds once the home entry overlay has released (`entryComplete`).
 */

function buildCinematic(
  host: HTMLElement,
  motion: OathMotionState,
): () => void {
  const q = scopedSelector(host)
  const disposers: Array<() => void> = []

  disposers.push(buildOathHero(host, q, 1, motion))
  disposers.push(buildOathManifesto(host, q, 1, motion))
  buildOathTenets(host, q, 1, motion)
  disposers.push(buildOathProducts(host, q, 1, motion))
  disposers.push(buildOathFinale(host, q, motion))
  buildOathRail(host, q)
  disposers.push(buildOathSpotlight(host))
  disposers.push(attachMagnetics(host))

  return () => {
    for (const dispose of disposers) dispose()
  }
}

export function useTheOathScrollTimeline(
  root: RefObject<HTMLElement | null>,
  entryComplete: boolean,
  motion: OathMotionState,
): void {
  useGSAP(
    () => {
      if (!entryComplete) return
      const host = root.current
      if (!host) return
      const mm = gsap.matchMedia()
      mm.add(OATH_STATIC_MQ, () => {
        const dispose = buildOathStatic(host)
        return dispose ?? undefined
      })
      mm.add(OATH_DESKTOP_CINEMATIC_MQ, () => buildCinematic(host, motion))
      return () => mm.revert()
    },
    { scope: root, dependencies: [entryComplete] },
  )
}
