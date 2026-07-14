import { useGSAP } from '@gsap/react'
import type { RefObject } from 'react'
import { gsap, ScrollTrigger } from '@/shared/lib/gsap'

/**
 * Passport page motion. Scanned on phones first, so the tiering is:
 *  - reduced motion → everything snaps visible
 *  - mobile (<768px) → one premium entrance timeline on the hero only;
 *    sections snap visible (no ScrollTrigger, no pinning on mobile)
 *  - ≥768px → hero entrance + batched ScrollTrigger reveals per section
 * Elements opt in via [data-pp-hero] (hero children) and [data-pp-reveal].
 *
 * All entrances are explicit `fromTo` tweens (never `from`): React StrictMode
 * double-mounts effects in dev, and a killed `from` tween leaves elements at
 * autoAlpha 0 for the second run to capture as the end state — stuck hidden.
 */
export function usePassportReveal(scope: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const root = scope.current
      if (!root) return
      const mm = gsap.matchMedia()

      const heroItems = () => root.querySelectorAll<HTMLElement>('[data-pp-hero]')
      const sections = () => root.querySelectorAll<HTMLElement>('[data-pp-reveal]')

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set([...heroItems(), ...sections()], { clearProps: 'all', autoAlpha: 1 })
      })

      const heroEntrance = () =>
        gsap.fromTo(
          heroItems(),
          { autoAlpha: 0, y: 26 },
          { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out' },
        )

      mm.add(
        '(max-width: 767.98px) and (prefers-reduced-motion: no-preference)',
        () => {
          const tween = heroEntrance()
          gsap.set(sections(), { clearProps: 'all', autoAlpha: 1 })
          return () => {
            tween.kill()
          }
        },
      )

      mm.add(
        '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
        () => {
          const tween = heroEntrance()
          gsap.set(sections(), { autoAlpha: 0, y: 32 })
          ScrollTrigger.batch(sections(), {
            start: 'top 85%',
            once: true,
            onEnter: (batch) =>
              gsap.to(batch, {
                autoAlpha: 1,
                y: 0,
                duration: 0.8,
                ease: 'power3.out',
                stagger: 0.1,
              }),
          })
          return () => {
            tween.kill()
          }
        },
      )

      return () => mm.revert()
    },
    { scope },
  )
}
