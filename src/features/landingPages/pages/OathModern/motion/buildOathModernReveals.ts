import { gsap, ScrollTrigger } from '@/shared/lib/gsap'
import {
  splitUnits,
  type LandingSelector,
} from '@/features/landingPages/motion/landingMotion'

/**
 * Per-chapter DOM choreography for the cinematic tier:
 *  - chapter headings (`h1`/`h2`) rise line-by-line behind a mask,
 *  - `[data-om-reveal]` children fade + rise in a stagger as each chapter enters,
 *  - `[data-om-bleed]` plates parallax through their scroll range (the "bleeding"
 *    transition between chapters).
 *
 * Reveals fire once on enter; the bleed parallax is scrubbed. Returns a disposer
 * that kills triggers and reverts every SplitText (called from `mm.revert()`).
 */
export function buildOathModernReveals(q: LandingSelector): () => void {
  const disposers: Array<() => void> = []

  for (const section of q('[data-om-chapter]')) {
    const headings = gsap.utils.toArray<HTMLElement>(':is(h1, h2)', section)
    const splits = headings.map((h) => splitUnits(h, 'lines'))
    const lines = splits.flatMap((s) => s.units)
    const reveals = gsap.utils.toArray<HTMLElement>('[data-om-reveal]', section)

    if (lines.length) gsap.set(lines, { yPercent: 115 })
    if (reveals.length) gsap.set(reveals, { opacity: 0, y: 34 })

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top 82%',
      once: true,
      onEnter: () => {
        // Slow, weighted, expo-out — the forged-ceremonial cadence.
        const tl = gsap.timeline()
        if (lines.length) {
          tl.to(lines, {
            yPercent: 0,
            duration: 1.25,
            stagger: 0.13,
            ease: 'expo.out',
          })
        }
        if (reveals.length) {
          tl.to(
            reveals,
            {
              opacity: 1,
              y: 0,
              duration: 1.05,
              stagger: 0.1,
              ease: 'expo.out',
              overwrite: true,
            },
            lines.length ? '-=0.9' : 0,
          )
        }
      },
    })

    disposers.push(() => {
      trigger.kill()
      for (const s of splits) s.revert()
      if (reveals.length) gsap.set(reveals, { clearProps: 'all' })
    })
  }

  // Atmosphere plates drift through their scroll range — the chapter "bleed".
  for (const plate of q('[data-om-bleed]')) {
    const tween = gsap.fromTo(
      plate,
      { yPercent: -4 },
      {
        yPercent: 4,
        ease: 'none',
        scrollTrigger: {
          trigger: plate,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      },
    )
    disposers.push(() => {
      tween.scrollTrigger?.kill()
      tween.kill()
      gsap.set(plate, { clearProps: 'transform' })
    })
  }

  return () => {
    for (const dispose of disposers) dispose()
  }
}
