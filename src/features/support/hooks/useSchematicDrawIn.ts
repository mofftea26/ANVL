import type { RefObject } from 'react'
import { gsap, useGSAP } from '@/shared/lib/gsap'

/**
 * Draws the measurement schematic on screen the way a pattern cutter marks a
 * spec sheet: outline first, then seams, then the dimension lines, then the
 * lettered badges fade in behind them.
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
      const el = scope.current
      if (!el) return

      const strokes = Array.from(el.querySelectorAll<SVGGeometryElement>('[data-draw]'))
      const badges = Array.from(el.querySelectorAll<SVGGElement>('[data-badge]'))
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

          const lengths = strokes.map(measureLength)
          const drawable = strokes.filter((_, i) => lengths[i] > 0)
          const drawableLengths = lengths.filter((length) => length > 0)
          if (drawable.length === 0) return

          gsap.set(drawable, {
            strokeDasharray: (i: number) => drawableLengths[i],
            strokeDashoffset: (i: number) => drawableLengths[i],
          })
          gsap.set(badges, { opacity: 0 })

          gsap
            .timeline({ scrollTrigger: { trigger: el, start: DRAW_START, once: true } })
            .to(drawable, {
              strokeDashoffset: 0,
              duration: 0.9,
              ease: 'power2.out',
              stagger: 0.05,
            })
            .to(badges, { opacity: 1, duration: 0.35, stagger: 0.05 }, '-=0.45')
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
