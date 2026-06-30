import { useRef, type RefObject } from 'react'
import { gsap, useGSAP } from '@/shared/lib/gsap'

/**
 * Drives the account tab carousel: slides the horizontal track to the active
 * panel and adds a parallax + reveal on the entering panel. The card background
 * layers (`[data-card-bg]`) drift opposite the slide for depth; the cards
 * (`[data-account-card]`) rise + fade in with a stagger. Reduced-motion + SSR
 * safe (snaps instantly via `gsap.set`).
 */
export function useAccountCarousel(
  scopeRef: RefObject<HTMLElement | null>,
  trackRef: RefObject<HTMLElement | null>,
  index: number,
) {
  const prevIndex = useRef(index)

  useGSAP(
    () => {
      const track = trackRef.current
      const scope = scopeRef.current
      if (!track || !scope) return

      const dir = index >= prevIndex.current ? 1 : -1
      const panels = gsap.utils.toArray<HTMLElement>(scope.querySelectorAll('[data-account-panel]'))
      const active = panels[index]

      const mm = gsap.matchMedia()

      mm.add(
        {
          motion: '(prefers-reduced-motion: no-preference)',
          reduced: '(prefers-reduced-motion: reduce)',
        },
        (ctx) => {
          const { motion } = ctx.conditions as { motion: boolean; reduced: boolean }
          if (!motion) {
            gsap.set(track, { xPercent: -100 * index })
            return
          }

          gsap.to(track, { xPercent: -100 * index, duration: 0.7, ease: 'power3.inOut' })

          if (active) {
            const bg = active.querySelectorAll('[data-card-bg]')
            const cards = active.querySelectorAll('[data-account-card]')
            gsap.fromTo(
              bg,
              { xPercent: dir * 14 },
              { xPercent: 0, duration: 0.9, ease: 'power3.out' },
            )
            gsap.fromTo(
              cards,
              { y: 26, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.55, ease: 'power2.out', stagger: 0.05, delay: 0.08 },
            )
          }
        },
      )

      prevIndex.current = index
      return () => mm.revert()
    },
    { dependencies: [index], scope: scopeRef },
  )
}
