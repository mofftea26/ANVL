import type { RefObject } from 'react'
import type { LandingAct } from '@/features/cms/landing/landingActs.types'
import { gsap, useGSAP } from '@/shared/lib/gsap'
import {
  getActMotionTokens,
  resolveActAnimation,
  shouldRunActMotion,
} from './actAnimationConfig'
import { applyActMotionByType, bindMicroHover } from './actMotionHelpers'

const MOTION_OK = '(min-width: 768px) and (prefers-reduced-motion: no-preference)'
const REDUCED = '(max-width: 767px), (prefers-reduced-motion: reduce)'
const MOBILE = '(max-width: 767px)'

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
  /** Per-word reveal selector (also used by applyActMotionByType). */
  words?: string
  /** Extra selectors forced to final state on mobile / reduced motion. */
  snapSelectors?: string[]
  /** Custom desktop animation; return cleanup if needed. */
  onAnimate?: (
    host: HTMLElement,
    ctx?: { tokens: ReturnType<typeof getActMotionTokens> },
  ) => (() => void) | void
  /** Default entrance: scroll-linked stagger when `staggerSelector` is set. */
  scrollTrigger?: ActScrollTriggerVars
  /** Bind subtle hover micro-interactions on `[data-act-micro]` controls. */
  microInteractions?: boolean
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
  const { staggerSelector, snapSelectors = [], onAnimate, scrollTrigger, microInteractions = true } = options

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

      mm.add(MOBILE, () => {
        if (snapAll.length) {
          gsap.set(snapAll, { opacity: 1, x: 0, y: 0, scale: 1 })
        }
      })

      mm.add(MOTION_OK, () => {
        const ctx = gsap.context(() => {
          if (onAnimate) {
            const animation = resolveActAnimation(undefined)
            const tokens = getActMotionTokens(animation.intensity)
            const cleanup = onAnimate(host, { tokens })
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

      if (microInteractions) {
        mm.add(MOTION_OK, () => bindMicroHover(host))
      }

      return () => mm.revert()
    },
    { scope: rootRef },
  )
}

/** Act preset motion with CMS animation config (enabled / desktopOnly / intensity). */
export function useActPresetMotion(
  rootRef: RefObject<HTMLElement | null>,
  row: LandingAct | undefined,
  options: ActScrollRevealOptions = {},
) {
  const animation = resolveActAnimation(row)
  const tokens = getActMotionTokens(animation.intensity)

  useGSAP(
    () => {
      const host = rootRef.current
      if (!host) return

      const mm = gsap.matchMedia()
      const snapAll = collectElements(host, [
        options.staggerSelector,
        ...(options.snapSelectors ?? []),
      ])

      mm.add(REDUCED, () => {
        if (snapAll.length) gsap.set(snapAll, { opacity: 1, x: 0, y: 0, scale: 1 })
      })

      mm.add(MOBILE, () => {
        if (!shouldRunActMotion(animation, 'mobile')) {
          if (snapAll.length) gsap.set(snapAll, { opacity: 1, x: 0, y: 0, scale: 1 })
        }
      })

      mm.add(MOTION_OK, () => {
        if (!shouldRunActMotion(animation, 'desktop')) {
          if (snapAll.length) gsap.set(snapAll, { opacity: 1, x: 0, y: 0, scale: 1 })
          return
        }

        const ctx = gsap.context(() => {
          if (options.onAnimate) {
            const cleanup = options.onAnimate(host, { tokens })
            if (typeof cleanup === 'function') return cleanup
            return
          }

          const typeCleanup = applyActMotionByType(host, animation, tokens, {
            blocks: options.staggerSelector ?? '[data-act-block]',
            words: options.words ?? '[data-act-word]',
            floatTarget: '[data-act-float]',
          })
          if (typeCleanup) return typeCleanup

          if (!options.staggerSelector) return
          const targets = gsap.utils.toArray<HTMLElement>(options.staggerSelector, host)
          if (!targets.length) return

          gsap.set(targets, { opacity: 0, y: tokens.enterY })
          gsap.to(targets, {
            opacity: 1,
            y: 0,
            duration: tokens.duration,
            stagger: tokens.stagger,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: host,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
              ...options.scrollTrigger,
            },
          })
        }, host)

        return () => ctx.revert()
      })

      if (options.microInteractions !== false) {
        mm.add(MOTION_OK, () => {
          if (!shouldRunActMotion(animation, 'desktop')) return
          return bindMicroHover(host)
        })
      }

      return () => mm.revert()
    },
    { scope: rootRef, dependencies: [animation.enabled, animation.desktopOnly, animation.intensity, animation.type] },
  )
}
