import { gsap } from '@/shared/lib/gsap'
import type { AboutScrollMotion } from './aboutMotionState'
import type { Selector } from './aboutMotionHelpers'

/**
 * The marquee ribbon — the rhythm break before the finale. Not pinned: the
 * band rides through the viewport while scroll scrubs a drift on the shift
 * WRAPPER (`[data-marquee-shift]`), composing with — never fighting — the CSS
 * keyframe loop that animates the tracks inside it (the two rows already
 * counter-scroll each other). Scrub velocity leans the whole band (skew) so a
 * hard wheel flick reads as force.
 */
export function buildAboutMarquee(
  host: HTMLElement,
  q: Selector,
  motion: AboutScrollMotion,
): () => void {
  const scene = host.querySelector('[data-scene="marquee"]')
  if (!scene) return () => {}

  const band = q('[data-marquee-band]')
  const skewTo = band.length
    ? gsap.quickTo(band, 'skewY', { duration: 0.4, ease: 'power2.out' })
    : null
  let lastProgress = 0
  let lastTime = 0

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: scene,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const now = performance.now()
        if (lastTime > 0 && skewTo) {
          const dt = Math.max(16, now - lastTime) / 1000
          const velocity = (self.progress - lastProgress) / dt
          motion.marqueeVelocity = velocity
          skewTo(gsap.utils.clamp(-4, 4, velocity * 14))
        }
        lastProgress = self.progress
        lastTime = now
      },
      onLeave: () => skewTo?.(0),
      onLeaveBack: () => skewTo?.(0),
    },
  })

  tl.fromTo(q('[data-marquee-shift]'), { xPercent: 5 }, { xPercent: -5, ease: 'none' }, 0)

  return () => {}
}
