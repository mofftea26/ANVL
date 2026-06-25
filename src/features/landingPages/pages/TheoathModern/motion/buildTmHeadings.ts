import { gsap } from '@/shared/lib/gsap'
import {
  LANDING_PREMIUM_EASE,
  splitUnits,
  type LandingSelector,
} from '@/features/landingPages/motion/landingMotion'

/**
 * Line-mask reveal for section headings (`[data-tm-heading]`). Each heading is
 * split into clipped lines that rise into place as the section enters — the
 * editorial reveal the hero headline uses, applied section to section. Desktop
 * cinematic path only; the static path reveals the same headings via
 * `[data-tm-reveal-m]`.
 */
export function buildTmHeadings(q: LandingSelector): () => void {
  const disposers: Array<() => void> = []

  for (const heading of q('[data-tm-heading]')) {
    const { units, revert } = splitUnits(heading, 'lines')
    disposers.push(revert)
    gsap.set(units, { yPercent: 115 })
    const tween = gsap.to(units, {
      yPercent: 0,
      duration: 1,
      ease: LANDING_PREMIUM_EASE,
      stagger: 0.1,
      scrollTrigger: { trigger: heading, start: 'top 88%', once: true },
    })
    disposers.push(() => {
      tween.scrollTrigger?.kill()
      tween.kill()
    })
  }

  return () => {
    for (const dispose of disposers) dispose()
  }
}
