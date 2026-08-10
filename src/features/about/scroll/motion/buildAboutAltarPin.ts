import { ScrollTrigger } from '@/shared/lib/gsap'
import type { AboutScrollMotion } from './aboutMotionState'
import { pinTrigger } from './aboutMotionHelpers'
import { ABOUT_CHAPTER_SPAN_VH, ABOUT_SCROLL } from './aboutScrollTiming'

/**
 * The finale — two triggers on the altar section:
 *
 * - THE APPROACH: an unpinned scrub whose start line sits
 *   `prefetchLeadChapters` chapters below the viewport, ramping
 *   `altarApproach` 0→1 as the reader closes in. The altar stage mounts the
 *   moment this leaves zero, so its GLB Suspense load IS the prefetch and the
 *   load bar usually completes in a beat on arrival.
 * - THE PIN: the section holds full-screen while the stage breathes. While
 *   pinned, the experience root carries `data-altar-live="on"` — the CSS
 *   contract that flips the (Phase 4) shared canvas to `pointer-events: auto`
 *   so the anvil is grabbable exactly while its DOM shell is on stage.
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

  const vars = pinTrigger(scene, ABOUT_SCROLL.altarPinPct)
  vars.onToggle = (self) => {
    motion.altarPinned = self.isActive ? 1 : 0
    if (self.isActive) host.setAttribute('data-altar-live', 'on')
    else host.removeAttribute('data-altar-live')
  }
  const pin = ScrollTrigger.create(vars)

  return () => {
    approach.kill()
    pin.kill()
    host.removeAttribute('data-altar-live')
  }
}
