import { gsap } from '@/shared/lib/gsap'
import type { OathMotionState } from './oathMotionState'
import { pinTrigger, type Selector } from './oathMotionHelpers'

/**
 * Scene 03 — Product Characteristics (desktop). The traits are a horizontal
 * panorama: the section pins and the strip pans across so each panel comes into
 * view on its turn, the feathered seams melting one into the next — the
 * "horizontal-in-vertical" scroll moment.
 *
 * Cinematic presentation layered on the pan (all inside the one pinned, scrubbed
 * timeline, so it reverses cleanly): as each characteristic reaches centre its
 * caption (marker → title → line) rises in and its media settles from a slight
 * zoom — each trait "presents itself" instead of merely sliding past.
 *
 * `tenetsActive` stays set while pinned so the monolith holds receded behind it;
 * `tenetsProgress` tracks the pan.
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
  if (steps <= 0) return

  // The horizontal pan (the kept mechanic).
  tl.to(track, { xPercent: -100 * steps, ease: 'none', duration: 1 }, 0)

  // Per-panel cinematic presentation, positioned at each panel's centre time.
  panels.forEach((panel, i) => {
    const caption = [
      panel.querySelector('[data-tenet-marker]'),
      panel.querySelector('[data-tenet-title]'),
      panel.querySelector('[data-tenet-line]'),
    ].filter((el): el is HTMLElement => el !== null)
    const index = panel.querySelector('[data-tenet-index]') as HTMLElement | null
    const media = panel.querySelector('[data-tenet-media]') as HTMLElement | null

    const center = i / steps
    // Begin presenting a touch before the panel is dead-centre.
    const inAt = Math.max(0, center - 0.16)

    if (media) {
      gsap.set(media, { scale: 1.12, transformOrigin: '50% 50%' })
      tl.to(media, { scale: 1, ease: 'power2.out', duration: 0.34 }, inAt)
    }
    if (index) {
      gsap.set(index, { xPercent: -8, opacity: 0 })
      tl.to(index, { xPercent: 0, opacity: 1, ease: 'expo.out', duration: 0.3 }, inAt)
    }
    if (caption.length) {
      gsap.set(caption, { y: 34, opacity: 0 })
      tl.to(
        caption,
        { y: 0, opacity: 1, ease: 'expo.out', duration: 0.26, stagger: 0.05 },
        inAt + 0.04,
      )
    }
  })
}
