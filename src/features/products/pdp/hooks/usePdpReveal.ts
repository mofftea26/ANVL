import type { RefObject } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '@/shared/lib/gsap'
import type { ShopPdpConfig } from '@/features/cms/shop/shopExperience.zod'

/**
 * Scroll-reveal for PDP sections. Any descendant with `data-reveal` fades/rises
 * into view once. Driven by a single `gsap.matchMedia`: cinematic on desktop
 * with no-reduced-motion, snapped visible everywhere else (mobile stays fast +
 * static). Honors the CMS `pdp.animationIntensity` + duration multiplier and
 * cleans up on unmount. Uses `ScrollTrigger.batch` so there is one observer set,
 * not one trigger per element.
 */
export function usePdpReveal(
  scope: RefObject<HTMLElement | null>,
  options: { intensity: ShopPdpConfig['animationIntensity']; durationMultiplier: number },
): void {
  const { intensity, durationMultiplier } = options

  useGSAP(
    () => {
      const el = scope.current
      if (!el || intensity === 'off') return
      const mm = gsap.matchMedia()
      mm.add(
        {
          desktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
          reduced: '(max-width: 767px), (prefers-reduced-motion: reduce)',
        },
        (ctx) => {
          const items = el.querySelectorAll<HTMLElement>('[data-reveal]')
          if (items.length === 0) return
          if (!ctx.conditions?.desktop) {
            gsap.set(items, { opacity: 1, y: 0 })
            return
          }
          const distance = intensity === 'subtle' ? 18 : 30
          ScrollTrigger.batch(items, {
            start: 'top 86%',
            once: true,
            onEnter: (batch) =>
              gsap.fromTo(
                batch,
                { opacity: 0, y: distance },
                {
                  opacity: 1,
                  y: 0,
                  duration: 0.6 * durationMultiplier,
                  ease: 'power2.out',
                  stagger: 0.08,
                },
              ),
          })
        },
      )
      return () => mm.revert()
    },
    { scope, dependencies: [intensity, durationMultiplier] },
  )
}
