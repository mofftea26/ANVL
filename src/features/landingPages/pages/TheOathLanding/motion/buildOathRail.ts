import { gsap, ScrollTrigger } from '@/shared/lib/gsap'
import type { Selector } from './oathMotionHelpers'

/**
 * Progress rail (desktop): the bone fill tracks overall page scroll; each
 * scene's dot ignites while that section is on screen. Transform/opacity only.
 */
export function buildOathRail(host: HTMLElement, q: Selector): void {
  const fill = q('[data-rail-fill]')
  if (fill.length) {
    gsap.to(fill, {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: host,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.4,
        invalidateOnRefresh: true,
      },
    })
  }

  for (const dot of q('[data-rail-dot]')) {
    const sceneId = dot.getAttribute('data-rail-dot')
    const scene = host.querySelector(`[data-scene="${sceneId}"]`)
    if (!scene) continue
    ScrollTrigger.create({
      trigger: scene,
      start: 'top 60%',
      end: 'bottom 40%',
      invalidateOnRefresh: true,
      onToggle: (self) => {
        gsap.to(dot, {
          opacity: self.isActive ? 1 : 0.5,
          scale: self.isActive ? 1.6 : 1,
          duration: 0.3,
          overwrite: 'auto',
        })
      },
    })
  }
}
