import type { RefObject } from 'react'
import { gsap, useGSAP } from '@/shared/lib/gsap'

const MOTION_OK = '(min-width: 768px) and (prefers-reduced-motion: no-preference)'
const REDUCED = '(max-width: 767px), (prefers-reduced-motion: reduce)'

export type ActScrollTriggerVars = {
  trigger?: Element | string
  start?: string | number
  end?: string | number
  scrub?: boolean | number
  toggleActions?: string
}

export type ActScrollRevealOptions = {
  /** Stagger targets relative to root (data attributes or class selectors). */
  staggerSelector?: string
  /** Extra selectors forced to final state on mobile / reduced motion. */
  snapSelectors?: string[]
  /** Custom desktop animation; return cleanup if needed. */
  onAnimate?: (host: HTMLElement) => (() => void) | void
  /** Default entrance: scroll-linked stagger when `staggerSelector` is set. */
  scrollTrigger?: ActScrollTriggerVars
}

function collectElements(
  host: HTMLElement,
  selectors: (string | undefined)[],
): HTMLElement[] {
  const out: HTMLElement[] = []
  for (const sel of selectors) {
    if (!sel) continue
    out.push(...gsap.utils.toArray<HTMLElement>(sel, host))
  }
  return out
}

/**
 * ScrollTrigger helper for act presets — gated on viewport + reduced motion.
 * Mobile / reduced-motion users see the static final state (RESP-03 / RESP-15).
 */
export function useActScrollReveal(
  rootRef: RefObject<HTMLElement | null>,
  options: ActScrollRevealOptions = {},
) {
  const { staggerSelector, snapSelectors = [], onAnimate, scrollTrigger } = options

  useGSAP(
    () => {
      const host = rootRef.current
      if (!host) return

      const mm = gsap.matchMedia()
      const snapAll = collectElements(host, [
        staggerSelector,
        ...snapSelectors,
      ])

      mm.add(REDUCED, () => {
        if (snapAll.length) {
          gsap.set(snapAll, { opacity: 1, x: 0, y: 0, scale: 1 })
        }
      })

      mm.add(MOTION_OK, () => {
        const ctx = gsap.context(() => {
          if (onAnimate) {
            const cleanup = onAnimate(host)
            if (typeof cleanup === 'function') return cleanup
            return
          }

          if (!staggerSelector) return

          const targets = gsap.utils.toArray<HTMLElement>(staggerSelector, host)
          if (!targets.length) return

          gsap.set(targets, { opacity: 0, y: 36 })
          gsap.to(targets, {
            opacity: 1,
            y: 0,
            duration: 0.85,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: host,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
              ...scrollTrigger,
            },
          })
        }, host)

        return () => ctx.revert()
      })

      return () => mm.revert()
    },
    { scope: rootRef },
  )
}
