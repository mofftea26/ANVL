import { gsap, ScrollTrigger } from '@/shared/lib/gsap'
import type { AboutMotionState } from './aboutMotionState'
import type { Selector } from './aboutMotionHelpers'

/**
 * Scene 04 — The Forge, Part II: Construction (desktop). Not pinned. Two
 * seam/stitch macro layers parallax; annotated hotspot markers stagger in once
 * the scene enters view. `constructionProgress` keeps the monolith receded.
 */
export function buildAboutConstruction(
  host: HTMLElement,
  q: Selector,
  motion: AboutMotionState,
): () => void {
  const scene = host.querySelector('[data-scene="construction"]')
  if (!scene) return () => {}

  gsap.set(q('[data-construction-reveal]'), { opacity: 0, y: 24 })
  gsap.set(q('[data-construction-hotspot]'), { opacity: 0, scale: 0.6 })

  const revealTrigger = ScrollTrigger.create({
    trigger: scene,
    start: 'top 78%',
    once: true,
    onEnter: () => {
      gsap.to(q('[data-construction-reveal]'), {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
      })
      gsap.to(q('[data-construction-hotspot]'), {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        stagger: 0.12,
        ease: 'back.out(2)',
        delay: 0.3,
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
        motion.constructionProgress = self.progress
      },
    },
  })
  tl.fromTo(q('[data-construction-layer="1"]'), { yPercent: -10 }, { yPercent: 10, ease: 'none', duration: 1 }, 0)
  tl.fromTo(q('[data-construction-layer="2"]'), { yPercent: -4 }, { yPercent: 16, ease: 'none', duration: 1 }, 0)

  return () => {
    revealTrigger.kill()
  }
}
