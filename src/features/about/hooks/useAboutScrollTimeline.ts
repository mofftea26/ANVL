import type { RefObject } from 'react'
import { gsap, useGSAP } from '@/shared/lib/gsap'
import type { AboutMotionState } from '../motion/aboutMotionState'
import { scopedSelector } from '../motion/aboutMotionHelpers'
import { buildAboutStatic } from '../motion/buildAboutStatic'
import { buildAboutHero } from '../motion/buildAboutHero'
import { buildAboutPhilosophy } from '../motion/buildAboutPhilosophy'
import { buildAboutMaterials } from '../motion/buildAboutMaterials'
import { buildAboutConstruction } from '../motion/buildAboutConstruction'
import { buildAboutTesting } from '../motion/buildAboutTesting'
import { buildAboutFinale } from '../motion/buildAboutFinale'
import { ABOUT_DESKTOP_CINEMATIC_MQ, ABOUT_STATIC_MQ } from '../aboutBreakpoints'

/**
 * The About page — master scroll choreography (one continuous cinematic
 * film). `gsap.matchMedia` branches: desktop (≥1280px / `xl`, no reduced
 * motion) runs the hero drift, pinned philosophy reveal, and the three
 * forge-process parallax beats + finale, writing scroll progress into the
 * shared motion state that drives the WebGL monolith. Mobile + tablet +
 * reduced-motion get the static composed layout with light batch reveals — no
 * pins, no WebGL. Builders return disposers collected per branch;
 * `mm.revert()` kills every trigger on cleanup. Scene components carry markup
 * + `data-*` hooks only.
 */

function buildCinematic(host: HTMLElement, motion: AboutMotionState): () => void {
  const q = scopedSelector(host)
  const disposers: Array<() => void> = []

  disposers.push(buildAboutHero(host, q, motion))
  disposers.push(buildAboutPhilosophy(host, q, motion))
  disposers.push(buildAboutMaterials(host, q, motion))
  disposers.push(buildAboutConstruction(host, q, motion))
  disposers.push(buildAboutTesting(host, q, motion))
  disposers.push(buildAboutFinale(host, q, motion))

  return () => {
    for (const dispose of disposers) dispose()
  }
}

export function useAboutScrollTimeline(
  root: RefObject<HTMLElement | null>,
  motion: AboutMotionState,
): void {
  useGSAP(
    () => {
      const host = root.current
      if (!host) return
      const mm = gsap.matchMedia()
      mm.add(ABOUT_STATIC_MQ, () => {
        const dispose = buildAboutStatic(host)
        return dispose ?? undefined
      })
      mm.add(ABOUT_DESKTOP_CINEMATIC_MQ, () => buildCinematic(host, motion))
      return () => mm.revert()
    },
    { scope: root },
  )
}
