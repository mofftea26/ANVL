import { gsap, ScrollTrigger } from '@/shared/lib/gsap'
import type { AboutMotionState } from './aboutMotionState'
import type { Selector } from './aboutMotionHelpers'

/**
 * Scene 05 — The Forge, Part III: Testing + fun facts (desktop). Not pinned.
 * The testing backdrop parallaxes; each stat counts up from zero once on
 * enter (numeric values only — non-numeric stats like a city name just fade
 * in). `testingProgress` keeps the monolith receded.
 */
export function buildAboutTesting(
  host: HTMLElement,
  q: Selector,
  motion: AboutMotionState,
): () => void {
  const scene = host.querySelector('[data-scene="testing"]')
  if (!scene) return () => {}

  gsap.set(q('[data-testing-reveal]'), { opacity: 0, y: 24 })
  gsap.set(q('[data-stat-item]'), { opacity: 0, y: 16 })

  const revealTrigger = ScrollTrigger.create({
    trigger: scene,
    start: 'top 75%',
    once: true,
    onEnter: () => {
      gsap.to(q('[data-testing-reveal]'), {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
      })
      gsap.to(q('[data-stat-item]'), {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power3.out',
        delay: 0.15,
      })

      for (const valueEl of q('[data-stat-value]')) {
        const target = Number(valueEl.dataset.statTarget)
        if (!Number.isFinite(target)) continue
        valueEl.textContent = '0'
        const counter = { n: 0 }
        gsap.to(counter, {
          n: target,
          duration: 1.4,
          ease: 'power2.out',
          delay: 0.2,
          onUpdate: () => {
            valueEl.textContent = String(Math.round(counter.n))
          },
        })
      }
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
        motion.testingProgress = self.progress
      },
    },
  })
  tl.fromTo(q('[data-testing-layer]'), { yPercent: -10 }, { yPercent: 10, ease: 'none', duration: 1 }, 0)

  return () => {
    revealTrigger.kill()
  }
}
