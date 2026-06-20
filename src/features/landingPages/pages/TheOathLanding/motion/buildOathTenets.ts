import { gsap } from '@/shared/lib/gsap'
import type { OathMotionState } from './oathMotionState'
import { pinTrigger, type Selector } from './oathMotionHelpers'

/**
 * Scene 03 — Four Tenets (desktop/tablet). The four vows are a horizontal
 * panorama: the section pins and the strip pans across so each image (and its
 * caption) comes into view on its turn, the feathered seams melting one into
 * the next — the "horizontal-in-vertical" scroll moment. `tenetsActive` stays
 * set while pinned so the monolith holds receded behind it; `tenetsProgress`
 * tracks the pan.
 */
export function buildOathTenets(
  host: HTMLElement,
  q: Selector,
  intensity: number,
  motion: OathMotionState,
): void {
  const scene = host.querySelector('[data-scene="tenets"]')
  if (!scene) return
  const stage = scene.querySelector('[data-tenet-stage]') as HTMLElement | null
  const track = scene.querySelector('[data-tenet-track]') as HTMLElement | null
  const panels = q('[data-tenet]')
  if (!stage || !track || panels.length === 0) return

  const steps = panels.length - 1

  const trigger = pinTrigger(stage, panels.length * 60 * intensity)
  trigger.onToggle = (self) => {
    motion.tenetsActive = self.isActive ? 1 : 0
  }
  trigger.onUpdate = (self) => {
    motion.tenetsProgress = self.progress * steps
  }

  const tl = gsap.timeline({ scrollTrigger: trigger })
  if (steps > 0) {
    tl.to(track, { xPercent: -100 * steps, ease: 'none', duration: 1 }, 0)
  }
}
