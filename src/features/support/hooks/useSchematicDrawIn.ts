import type { RefObject } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '@/shared/lib/gsap'

/**
 * Draws the measurement schematic on screen the way a pattern cutter marks a
 * spec sheet: outline first, then seams, then the dimension lines, then the
 * lettered badges fade in behind them.
 *
 * **Fail-open.** Nothing is hidden until the ScrollTrigger actually fires —
 * the `fromTo` and the badge hide both live inside `onEnter`, mirroring
 * `usePdpReveal`. If the trigger never fires (a figure mounted inside a
 * `display: none` tab panel measures at zero height and can be missed
 * entirely), the drawing is simply already visible. A figure that animates
 * late is recoverable; one that never appears is not.
 *
 * `strokeDashoffset` is the one property here that is neither transform nor
 * opacity. That is deliberate and spec-mandated — a stroke draw-in has no
 * transform equivalent, and it stays off the layout path (paint only), so the
 * intent behind the transform/opacity rule is preserved.
 *
 * Cinematic at ≥768px with no reduced-motion preference; everywhere else the
 * mirror branch snaps the drawing fully visible via `gsap.set`.
 */

const DRAW_START = 'top 82%'

export function useSchematicDrawIn(
  scope: RefObject<HTMLElement | null>,
  dependencies: readonly unknown[],
): void {
  useGSAP(
    () => {
      const root = scope.current
      if (!root) return

      // Ordered by construction, not by document order — the detail seams sit
      // BELOW the outline in the DOM so they paint underneath it, which is the
      // reverse of the order they should be drawn in.
      const strokes = [
        ...root.querySelectorAll<SVGGeometryElement>('[data-draw="outline"]'),
        ...root.querySelectorAll<SVGGeometryElement>('[data-draw="detail"]'),
        ...root.querySelectorAll<SVGGeometryElement>(
          '[data-draw="witness"], [data-draw="dimension"]',
        ),
      ]
      const badges = Array.from(root.querySelectorAll<SVGGElement>('[data-badge]'))
      if (strokes.length === 0) return

      const mm = gsap.matchMedia()
      mm.add(
        {
          animate: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
          static: '(max-width: 767px), (prefers-reduced-motion: reduce)',
        },
        (ctx) => {
          if (!ctx.conditions?.animate) {
            gsap.set(strokes, { strokeDasharray: 'none', strokeDashoffset: 0 })
            gsap.set(badges, { opacity: 1 })
            return
          }

          const measured = strokes
            .map((el) => ({ el, length: measureLength(el) }))
            .filter((item) => item.length > 0)
          if (measured.length === 0) return

          const drawable = measured.map((item) => item.el)
          const lengths = measured.map((item) => item.length)

          ScrollTrigger.create({
            trigger: root,
            start: DRAW_START,
            once: true,
            onEnter: () => {
              gsap
                .timeline()
                .set(badges, { opacity: 0 })
                .fromTo(
                  drawable,
                  {
                    strokeDasharray: (i: number) => lengths[i],
                    strokeDashoffset: (i: number) => lengths[i],
                  },
                  {
                    strokeDashoffset: 0,
                    duration: 0.9,
                    ease: 'power2.out',
                    stagger: 0.05,
                    clearProps: 'strokeDasharray',
                  },
                  0,
                )
                .to(badges, { opacity: 1, duration: 0.35, stagger: 0.05 }, '-=0.45')
            },
          })
        },
      )

      return () => mm.revert()
    },
    { scope, dependencies: [...dependencies] },
  )
}

/** jsdom and some older engines have no `getTotalLength` — treat those as "do not animate". */
function measureLength(el: SVGGeometryElement): number {
  if (typeof el.getTotalLength !== 'function') return 0
  try {
    return el.getTotalLength()
  } catch {
    return 0
  }
}
