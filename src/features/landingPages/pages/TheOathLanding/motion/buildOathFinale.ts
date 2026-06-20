import { gsap } from '@/shared/lib/gsap'
import type { OathMotionState } from './oathMotionState'
import type { Selector } from './oathMotionHelpers'
import { splitUnits } from './splitTextReveal'

/**
 * Scene 05 — Take the Oath (desktop/tablet). The crest forges in, the title
 * masks up word-by-word, the steel rule ignites, and the monumental brand
 * block rises — then the page releases into the footer (never trapped).
 * `finaleProgress` returns the monolith centre/front and lifts the dust glint.
 */
export function buildOathFinale(
  host: HTMLElement,
  q: Selector,
  motion: OathMotionState,
): () => void {
  const scene = host.querySelector('[data-scene="finale"]')
  if (!scene) return () => {}

  const title = scene.querySelector('[data-finale-title]') as HTMLElement | null
  const disposers: Array<() => void> = []

  gsap.set(q('[data-finale-crest]'), {
    opacity: 0,
    yPercent: -60,
    rotateX: -26,
    scale: 0.92,
    transformOrigin: 'top center',
  })
  gsap.set(q('[data-finale-rule]'), { scaleX: 0 })
  gsap.set(q('[data-finale-fade]'), { opacity: 0, y: 22 })
  gsap.set(q('[data-finale-brand]'), { yPercent: 115 })

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

  tl.to(
    q('[data-finale-crest]'),
    { opacity: 1, yPercent: 0, rotateX: 0, scale: 1, duration: 0.7, ease: 'power3.out' },
    0,
  )

  if (title) {
    const { units, revert } = splitUnits(title, 'words')
    disposers.push(revert)
    gsap.set(units, { yPercent: 118 })
    tl.to(units, { yPercent: 0, duration: 0.7, stagger: 0.1, ease: 'expo.out' }, 0.25)
  }

  tl.to(q('[data-finale-rule]'), { scaleX: 1, duration: 0.5, ease: 'power3.inOut' }, 0.7)
  tl.to(q('[data-finale-fade]'), { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }, 0.8)
  tl.to(q('[data-finale-brand]'), { yPercent: 0, stagger: 0.16, duration: 0.7, ease: 'power3.out' }, 1.0)

  return () => {
    for (const dispose of disposers) dispose()
  }
}
