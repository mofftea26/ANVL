import { gsap } from '@/shared/lib/gsap'
import type { OathMotionState } from './oathMotionState'
import { pinTrigger, type Selector } from './oathMotionHelpers'

/**
 * Scene 03 — Product Characteristics (desktop). The traits are a horizontal
 * panorama: the section pins and the strip pans across so each panel comes into
 * view on its turn, the feathered seams melting one into the next — the
 * "horizontal-in-vertical" scroll moment.
 *
 * Pacing is dwell-based so each piece gets real screen time: the strip pans a
 * piece to centre, then **holds** while its caption (marker → title → line) and
 * its annotation points present themselves, and stays held for reading before
 * the strip pans on. Because the reveal plays at the *start* of each hold, it
 * always completes while the piece is centred — never as the piece is leaving.
 * The whole thing lives in the one pinned, scrubbed timeline, so it reverses
 * cleanly.
 *
 * `tenetsActive` stays set while pinned so the monolith holds receded behind it;
 * `tenetsProgress` tracks the pan.
 */

/** Timeline units spent panning between two pieces (the in/out slide transition). */
const PAN_DUR = 2.2
/** Timeline units a piece holds at centre (reveal plays, then it rests for reading). */
const DWELL_DUR = 1.5

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
  if (steps <= 0) return

  // Scroll distance scales with the full pan + dwell budget so the added hold
  // time translates into more scroll per piece (the strip never rushes past).
  const totalUnits = panels.length * DWELL_DUR + steps * PAN_DUR
  const trigger = pinTrigger(stage, totalUnits * 44 * intensity)
  trigger.onToggle = (self) => {
    motion.tenetsActive = self.isActive ? 1 : 0
  }
  trigger.onUpdate = (self) => {
    motion.tenetsProgress = self.progress * steps
  }

  const tl = gsap.timeline({ scrollTrigger: trigger })

  // Walk the strip piece by piece: pan it to centre (eased so it settles), then
  // reveal + hold during its dwell window.
  let at = 0
  panels.forEach((panel, i) => {
    if (i > 0) {
      tl.to(track, { xPercent: -100 * i, ease: 'power2.inOut', duration: PAN_DUR }, at)
      at += PAN_DUR
    }

    const caption = [
      panel.querySelector('[data-tenet-marker]'),
      panel.querySelector('[data-tenet-title]'),
      panel.querySelector('[data-tenet-sub]'),
    ].filter((el): el is HTMLElement => el !== null)
    const index = panel.querySelector('[data-tenet-index]') as HTMLElement | null
    const media = panel.querySelector('[data-tenet-media]') as HTMLElement | null
    const dots = gsap.utils.toArray<HTMLElement>('[data-hotspot-dot]', panel)
    const linesEls = gsap.utils.toArray<HTMLElement>('[data-hotspot-line]', panel)
    const cards = gsap.utils.toArray<HTMLElement>('[data-hotspot-card]', panel)

    // The reveal plays at the start of this piece's dwell, while it is centred.
    const inAt = at

    if (media) {
      gsap.set(media, { scale: 1.1, opacity: 0, transformOrigin: '50% 50%' })
      tl.to(media, { scale: 1, opacity: 1, ease: 'power2.out', duration: 0.4 }, inAt)
    }
    if (index) {
      gsap.set(index, { xPercent: -8, opacity: 0 })
      tl.to(index, { xPercent: 0, opacity: 1, ease: 'expo.out', duration: 0.3 }, inAt)
    }
    if (caption.length) {
      gsap.set(caption, { y: 34, opacity: 0 })
      tl.to(
        caption,
        { y: 0, opacity: 1, ease: 'expo.out', duration: 0.3, stagger: 0.06 },
        inAt + 0.06,
      )
    }
    // Annotation points draw in after the caption — still early in the dwell, so
    // they are fully resolved well before the piece pans away.
    const hsAt = inAt + 0.3
    if (dots.length) {
      gsap.set(dots, { scale: 0, transformOrigin: '50% 50%' })
      tl.to(dots, { scale: 1, ease: 'back.out(2)', duration: 0.26, stagger: 0.08 }, hsAt)
    }
    if (linesEls.length) {
      gsap.set(linesEls, { scaleY: 0, transformOrigin: '50% 0%' })
      tl.to(linesEls, { scaleY: 1, ease: 'power2.out', duration: 0.22, stagger: 0.08 }, hsAt + 0.06)
    }
    if (cards.length) {
      gsap.set(cards, { y: 12, opacity: 0 })
      tl.to(cards, { y: 0, opacity: 1, ease: 'expo.out', duration: 0.3, stagger: 0.08 }, hsAt + 0.14)
    }

    at += DWELL_DUR
  })
}
