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
        gsap.set([...heroItems(), ...sections()], { clearProps: 'all' })
      })

      const heroEntrance = () => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
        tl.from(heroItems(), {
          autoAlpha: 0,
          y: 26,
          duration: 0.9,
          stagger: 0.12,
        })
        return tl
      }

      mm.add(
        '(max-width: 767.98px) and (prefers-reduced-motion: no-preference)',
        () => {
          const tl = heroEntrance()
          gsap.set(sections(), { clearProps: 'all' })
          return () => tl.kill()
        },
      )

      mm.add(
        '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
        () => {
          const tl = heroEntrance()
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
          return () => tl.kill()
        },
      )

      return () => mm.revert()
    },
    { scope },
  )
}
