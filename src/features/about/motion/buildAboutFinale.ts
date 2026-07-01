import { gsap } from '@/shared/lib/gsap'
import type { AboutMotionState } from './aboutMotionState'
import type { Selector } from './aboutMotionHelpers'
import { splitUnits } from './splitTextReveal'

/**
 * Scene 06 — The Oath Continues (desktop). Not pinned. The title masks up
 * word-by-word, the steel rule ignites, and the CTAs rise — then the page
 * releases into the footer. `finaleProgress` returns the monolith centre/front
 * and lifts its colour to the primary→accent gradient.
 */
export function buildAboutFinale(
  host: HTMLElement,
  q: Selector,
  motion: AboutMotionState,
): () => void {
  const scene = host.querySelector('[data-scene="finale"]')
  if (!scene) return () => {}

  const title = scene.querySelector('[data-finale-title]') as HTMLElement | null
  const disposers: Array<() => void> = []

  gsap.set(q('[data-finale-rule]'), { scaleX: 0 })
  gsap.set(q('[data-finale-fade]'), { opacity: 0, y: 22 })

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: scene,
      start: 'top 80%',
      end: 'top 24%',
      scrub: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        motion.finaleProgress = self.progress
      },
    },
  })

  if (title) {
    const { units, revert } = splitUnits(title, 'words')
    disposers.push(revert)
    gsap.set(units, { yPercent: 118 })
    tl.to(units, { yPercent: 0, duration: 0.7, stagger: 0.1, ease: 'expo.out' }, 0)
  }

  tl.to(q('[data-finale-rule]'), { scaleX: 1, duration: 0.5, ease: 'power3.inOut' }, 0.55)
  tl.to(q('[data-finale-fade]'), { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }, 0.65)

  return () => {
    for (const dispose of disposers) dispose()
  }
}
