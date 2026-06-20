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

/**
 * The Oath — master scroll choreography (one continuous cinematic film).
 *
 * `gsap.matchMedia` branches: desktop/tablet run the pinned cinematic film
 * (hero video scrub + 3D monolith hero pose, creed, tenets panorama pan,
 * product assembly, finale, progress rail, magnetics, cursor spotlight) and
 * write scroll progress into the shared motion state that drives the WebGL
 * uniforms. Mobile + reduced-motion get the static composed layout with light
 * batch reveals — no pins, no WebGL. Builders return disposers (SplitText
 * reverts, listeners) collected per branch; `mm.revert()` kills every trigger
 * on cleanup. Scene components carry markup + `data-*` hooks only. Only builds
 * once the home entry overlay has released (`entryComplete`).
 */

const DESKTOP = '(min-width: 1024px) and (prefers-reduced-motion: no-preference)'
const TABLET =
  '(min-width: 768px) and (max-width: 1023.98px) and (prefers-reduced-motion: no-preference)'
const STATIC = '(max-width: 767.98px), (prefers-reduced-motion: reduce)'

function buildCinematic(
  host: HTMLElement,
  intensity: number,
  motion: OathMotionState,
  isDesktop: boolean,
): () => void {
  const q = scopedSelector(host)
  const disposers: Array<() => void> = []

  disposers.push(buildOathHero(host, q, intensity, motion))
  disposers.push(buildOathManifesto(host, q, intensity, motion))
  buildOathTenets(host, q, intensity, motion)
  disposers.push(buildOathProducts(host, q, intensity, motion))
  disposers.push(buildOathFinale(host, q, motion))
  if (isDesktop) {
    buildOathRail(host, q)
    disposers.push(buildOathSpotlight(host))
  }
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
      mm.add(STATIC, () => buildOathStatic(host))
      mm.add(TABLET, () => buildCinematic(host, 0.9, motion, false))
      mm.add(DESKTOP, () => buildCinematic(host, 1, motion, true))
      return () => mm.revert()
    },
    { scope: root, dependencies: [entryComplete] },
  )
}
