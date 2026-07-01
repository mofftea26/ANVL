import { gsap, ScrollTrigger } from '@/shared/lib/gsap'
import type { AboutMotionState } from './aboutMotionState'
import type { Selector } from './aboutMotionHelpers'

/**
 * Scene 03 — The Forge, Part I: Materials (desktop). Not pinned — a normal
 * scroll-through parallax beat. Two fabric macro layers drift at different
 * rates (transform only) while copy reveals once on enter. `materialsProgress`
 * keeps the monolith receded while this scene is anywhere near view.
 */
export function buildAboutMaterials(
  host: HTMLElement,
  q: Selector,
  motion: AboutMotionState,
): () => void {
  const scene = host.querySelector('[data-scene="materials"]')
  if (!scene) return () => {}

  gsap.set(q('[data-materials-reveal]'), { opacity: 0, y: 24 })

  const revealTrigger = ScrollTrigger.create({
    trigger: scene,
    start: 'top 78%',
    once: true,
    onEnter: () => {
      gsap.to(q('[data-materials-reveal]'), {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
      })
    },
  })

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: scene,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        motion.materialsProgress = self.progress
      },
    },
  })
  tl.fromTo(q('[data-materials-layer="1"]'), { yPercent: -10 }, { yPercent: 10, ease: 'none', duration: 1 }, 0)
  tl.fromTo(q('[data-materials-layer="2"]'), { yPercent: -4 }, { yPercent: 16, ease: 'none', duration: 1 }, 0)

  return () => {
    revealTrigger.kill()
  }
}
