import { gsap } from '@/shared/lib/gsap'
import type { AboutScrollMotion } from './aboutMotionState'
import type { Selector } from './aboutMotionHelpers'
import { ABOUT_SCROLL } from './aboutScrollTiming'
import { splitUnits } from './splitUnits'

/**
 * Chapter 00 — the cold open.
 *
 * Entry (plays once): the headline forges in word-by-word through masks with a
 * blur-rise, the eyebrow/subhead/CTAs lift in, the backdrop settles from a
 * Ken-Burns push. Pin: scroll drives the descent into the film — the backdrop
 * scales past the camera and dims, the copy parallaxes up and releases, and
 * `heroProgress` hands the WebGL depth rig its first stretch of travel.
 */
export function buildAboutHero(
  host: HTMLElement,
  q: Selector,
  motion: AboutScrollMotion,
): () => void {
  const hero = host.querySelector('[data-scene="hero"]')
  if (!hero) return () => {}

  const headline = hero.querySelector('[data-hero-headline]') as HTMLElement | null
  const disposers: Array<() => void> = []

  // — Entry choreography (plays once on build).
  gsap.set(q('[data-hero-fade]'), { opacity: 0, y: 26 })

  const intro = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.15 })
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
  const kenburns = q('[data-hero-backdrop]')
  if (kenburns.length) {
    gsap.fromTo(kenburns, { scale: 1.14 }, { scale: 1.02, duration: 2.6, ease: 'power2.out' })
  }
  intro.to(q('[data-hero-fade]'), { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, 0.5)
  disposers.push(() => intro.kill())

  // Scroll cue idle pulse — cheap transform loop, killed on cleanup.
  const cue = hero.querySelector('[data-hero-scroll-cue]')
  if (cue) {
    const pulse = gsap.to(cue, { y: 5, repeat: -1, yoyo: true, duration: 0.9, ease: 'sine.inOut' })
    disposers.push(() => pulse.kill())
  }

  // — Pinned scrub: the descent. The backdrop pushes PAST the camera (scale
  //   up + blur + dim) while the copy releases upward — leaving through the
  //   viewport, not scrolling off it.
  const tl = gsap.timeline({
    scrollTrigger: {
      id: 'about-hero-pin',
      trigger: hero,
      start: 'top top',
      end: `+=${ABOUT_SCROLL.heroPinPct}%`,
      pin: true,
      scrub: ABOUT_SCROLL.scrubSmoothing,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        motion.heroProgress = self.progress
      },
      onLeave: () => {
        motion.boundaryBurst += 1
        motion.boundaryFrom = -1
        motion.boundaryTo = 0
      },
      onEnterBack: () => {
        motion.boundaryBurst += 1
        motion.boundaryFrom = 0
        motion.boundaryTo = -1
      },
    },
  })

  tl.to(q('[data-hero-backdrop]'), { scale: 1.18, ease: 'none', duration: 1 }, 0)
  tl.to(q('[data-hero-backdrop]'), { opacity: 0, filter: 'blur(10px)', ease: 'none', duration: 0.45 }, 0.55)
  tl.to(q('[data-hero-content]'), { yPercent: -22, ease: 'none', duration: 1 }, 0)
  tl.to(q('[data-hero-fade]'), { opacity: 0, ease: 'none', duration: 0.35 }, 0.6)
  tl.to(q('[data-hero-scroll-cue]'), { opacity: 0, ease: 'none', duration: 0.2 }, 0.1)

  return () => {
    for (const dispose of disposers) dispose()
  }
}
