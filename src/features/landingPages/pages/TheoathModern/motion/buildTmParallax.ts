import { gsap } from '@/shared/lib/gsap'
import type { LandingSelector } from '@/features/landingPages/motion/landingMotion'

/**
 * Depth parallax: every `[data-tm-parallax]` element drifts vertically as it
 * crosses the viewport, at a per-element speed (`data-tm-parallax="0.08"` = ±8%
 * of its travel). Transform-only + scrubbed, so layers move at different speeds
 * and the page reads as layered depth. Desktop cinematic path only; the static
 * path leaves everything in place.
 */
export function buildTmParallax(q: LandingSelector): () => void {
  const disposers: Array<() => void> = []

  for (const el of q('[data-tm-parallax]')) {
    const speed = Number(el.dataset.tmParallax || '0.08')
    const amount = Math.max(0, Math.min(0.4, Math.abs(speed))) * 100
    const dir = speed < 0 ? -1 : 1
    const tween = gsap.fromTo(
      el,
      { yPercent: -amount * dir },
      {
        yPercent: amount * dir,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      },
    )
    disposers.push(() => {
      tween.scrollTrigger?.kill()
      tween.kill()
    })
  }

  return () => {
    for (const dispose of disposers) dispose()
  }
}
