import { gsap, ScrollTrigger } from '@/shared/lib/gsap'
import type { LandingSelector } from '@/features/landingPages/motion/landingMotion'
import type { TmMotionState } from './tmMotionState'

/**
 * Section reveals + bleed transitions for the desktop cinematic path:
 * - `[data-tm-reveal]` rise in batches as they enter (clipped, staggered).
 * - `[data-tm-bleed]` macro textures drift between sections (transform-only
 *   parallax) so imagery appears to flow across the seam.
 * - `[data-tm-section="materials"]` scrubs `materialsProgress` for the light
 *   sweep over the macro material.
 */
export function buildTmReveals(
  q: LandingSelector,
  motion: TmMotionState,
): () => void {
  const disposers: Array<() => void> = []

  const reveals = q('[data-tm-reveal]')
  if (reveals.length > 0) {
    gsap.set(reveals, { opacity: 0, y: 40 })
    const batch = ScrollTrigger.batch(reveals, {
      start: 'top 85%',
      once: true,
      onEnter: (group) =>
        gsap.to(group, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.1,
          overwrite: true,
        }),
    })
    disposers.push(() => batch.forEach((t) => t.kill()))
  }

  // Clip-path "curtain" reveals for macro media — the image wipes up into view.
  for (const el of q('[data-tm-clip]')) {
    gsap.set(el, { clipPath: 'inset(0% 0% 100% 0%)' })
    const tween = gsap.to(el, {
      clipPath: 'inset(0% 0% 0% 0%)',
      duration: 1.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 82%', once: true },
    })
    disposers.push(() => {
      tween.scrollTrigger?.kill()
      tween.kill()
    })
  }

  for (const bleed of q('[data-tm-bleed]')) {
    const tween = gsap.fromTo(
      bleed,
      { yPercent: -12 },
      {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: {
          trigger: bleed,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      },
    )
    disposers.push(() => {
      tween.scrollTrigger?.kill()
      tween.kill()
    })
  }

  const materials = q('[data-tm-section="materials"]')[0]
  if (materials) {
    const trigger = ScrollTrigger.create({
      trigger: materials,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
      onUpdate: (self) => {
        motion.materialsProgress = self.progress
      },
    })
    disposers.push(() => trigger.kill())
  }

  return () => {
    for (const dispose of disposers) dispose()
  }
}
