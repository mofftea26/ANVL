import { gsap } from '@/shared/lib/gsap'
import type { AboutMotionState } from './aboutMotionState'
import type { Selector } from './aboutMotionHelpers'
import { splitUnits } from './splitTextReveal'

/**
 * Scene 01 — Hero (desktop). Not pinned: the headline forges in word-by-word
 * through masks, the underline ignites, supporting copy rises. As the hero
 * scrolls past (no pin — the page keeps moving), `heroProgress` drifts the 3D
 * monolith to centre (read in WebGL `useFrame`) and the backdrop parallaxes.
 */
export function buildAboutHero(
  host: HTMLElement,
  q: Selector,
  motion: AboutMotionState,
): () => void {
  const hero = host.querySelector('[data-scene="hero"]')
  if (!hero) return () => {}

  const headline = hero.querySelector('[data-hero-headline]') as HTMLElement | null
  const disposers: Array<() => void> = []

  gsap.set(q('[data-hero-underline]'), { scaleX: 0 })
  gsap.set(q('[data-hero-fade]'), { opacity: 0, y: 24 })

  const intro = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.1 })

  if (headline) {
    const { units, revert } = splitUnits(headline, 'words')
    disposers.push(revert)
    gsap.set(units, { yPercent: 120, filter: 'blur(12px)' })
    intro.to(
      units,
      { yPercent: 0, filter: 'blur(0px)', duration: 1.1, stagger: { each: 0.09, from: 'start' } },
      0,
    )
  }
  intro.to(q('[data-hero-underline]'), { scaleX: 1, duration: 0.9, ease: 'power3.inOut' }, 0.55)
  intro.to(q('[data-hero-fade]'), { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, 0.5)
  disposers.push(() => intro.kill())

  const cue = hero.querySelector('[data-hero-scroll-cue]')
  if (cue) {
    const pulse = gsap.to(cue, { y: 5, repeat: -1, yoyo: true, duration: 0.9, ease: 'sine.inOut' })
    disposers.push(() => pulse.kill())
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      scrub: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        motion.heroProgress = self.progress
      },
    },
  })
  tl.to(q('[data-hero-media]'), { yPercent: 14, ease: 'none', duration: 1 }, 0)
  tl.to(q('[data-hero-content]'), { yPercent: -10, opacity: 0.35, ease: 'none', duration: 1 }, 0)
  tl.to(q('[data-hero-scroll-cue]'), { opacity: 0, ease: 'none', duration: 0.2 }, 0)

  return () => {
    for (const dispose of disposers) dispose()
  }
}
