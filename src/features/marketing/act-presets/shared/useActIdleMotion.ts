import type { RefObject } from 'react'
import type { LandingAct } from '@/features/cms/landing/landingActs.types'
import { gsap, useGSAP } from '@/shared/lib/gsap'
import {
  getActMotionTokens,
  resolveActAnimation,
  shouldRunActMotion,
} from './actAnimationConfig'
import { applyCalmIdleFloat, applyCalmIdlePulse } from './actMotionHelpers'

const MOTION_OK = '(min-width: 768px) and (prefers-reduced-motion: no-preference)'

export type ActIdleMotionOptions = {
  floatSelector?: string
  pulseSelector?: string
}

/** Subtle idle float/pulse on emblem or focal elements. */
export function useActIdleMotion(
  rootRef: RefObject<HTMLElement | null>,
  row: LandingAct | undefined,
  options: ActIdleMotionOptions = {},
) {
  const animation = resolveActAnimation(row)
  const tokens = getActMotionTokens(animation.intensity)

  useGSAP(
    () => {
      const host = rootRef.current
      if (!host) return

      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        if (!shouldRunActMotion(animation, 'desktop')) return

        const cleanups: Array<() => void> = []
        if (options.floatSelector) {
          const el = host.querySelector(options.floatSelector)
          const c = applyCalmIdleFloat(el, tokens, animation.intensity)
          if (c) cleanups.push(c)
        }
        if (options.pulseSelector) {
          const el = host.querySelector(options.pulseSelector)
          const c = applyCalmIdlePulse(el, animation.intensity)
          if (c) cleanups.push(c)
        }
        return () => {
          for (const fn of cleanups) fn()
        }
      })

      return () => mm.revert()
    },
    {
      scope: rootRef,
      dependencies: [
        animation.enabled,
        animation.intensity,
        options.floatSelector,
        options.pulseSelector,
      ],
    },
  )
}
