import { gsap, ScrollTrigger } from '@/shared/lib/gsap'
import type { AboutScrollMotion } from './aboutMotionState'
import { pinTrigger } from './aboutMotionHelpers'
import { ABOUT_CHAPTER_SPAN_VH, ABOUT_SCROLL } from './aboutScrollTiming'

/**
 * The finale — three triggers on the altar section:
 *
 * - THE APPROACH: an unpinned scrub whose start line sits
 *   `prefetchLeadChapters` chapters below the viewport, ramping
 *   `altarApproach` 0→1 as the reader closes in. The altar stage mounts the
 *   moment this leaves zero, so its GLB Suspense load IS the prefetch and the
 *   load bar usually completes in a beat on arrival.
 * - THE LIVE WINDOW: from the section entering the viewport until the PIN
 *   completes, the experience root carries `data-altar-live="on"` — the CSS
 *   contract that flips the (pointer-transparent) shared canvas to
 *   `pointer-events: auto`, so the orbs are clickable and the summoned anvil
 *   grabbable the whole time the finale is on stage.
 * - THE PIN (`id: about-altar-pin` — the minimap's scroll target): the
 *   section holds full-screen while the stage breathes. When the pin
 *   COMPLETES (the reader keeps scrolling toward the footer) the whole
 *   canvas fades out — the stage stops at the finale instead of riding its
 *   fixed layer down behind the footer — and fades back the moment they
 *   return.
 */
export function buildAboutAltarPin(
  host: HTMLElement,
  motion: AboutScrollMotion,
): () => void {
  const scene = host.querySelector('[data-scene="altar"]')
  if (!scene) return () => {}

  const approachLeadPct = Math.round(
    ABOUT_SCROLL.prefetchLeadChapters * ABOUT_CHAPTER_SPAN_VH,
  )
  const approach = ScrollTrigger.create({
    trigger: scene,
    start: `top bottom+=${approachLeadPct}%`,
    end: 'top top',
    scrub: true,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      motion.altarApproach = self.progress
    },
  })

  // 85vh to reach the pin start plus the pin's own scrub room.
  const live = ScrollTrigger.create({
    trigger: scene,
    start: 'top 85%',
    end: `+=${85 + ABOUT_SCROLL.altarPinPct}%`,
    invalidateOnRefresh: true,
    onToggle: (self) => {
      if (self.isActive) host.setAttribute('data-altar-live', 'on')
      else host.removeAttribute('data-altar-live')
    },
  })

  const fadeCanvas = (to: number) => {
    const canvas = host.querySelector('[data-about-canvas]')
    if (canvas) gsap.to(canvas, { autoAlpha: to, duration: 0.45, ease: 'power2.out', overwrite: 'auto' })
  }

  const vars = pinTrigger(scene, ABOUT_SCROLL.altarPinPct)
  vars.id = 'about-altar-pin'
  vars.onToggle = (self) => {
    motion.altarPinned = self.isActive ? 1 : 0
  }
  vars.onLeave = () => fadeCanvas(0)
  vars.onEnterBack = () => fadeCanvas(1)
  const pin = ScrollTrigger.create(vars)

  return () => {
    approach.kill()
    live.kill()
    pin.kill()
    host.removeAttribute('data-altar-live')
  }
}
