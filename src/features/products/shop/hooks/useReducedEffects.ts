import { useEffect, useState } from 'react'

export type ReducedEffectsState = {
  /** `prefers-reduced-motion: reduce`. */
  reducedMotion: boolean
  /** Device has a precise pointer (mouse/trackpad) → eligible for hover effects. */
  finePointer: boolean
  /** True until mounted, or when motion is reduced / pointer is coarse. */
  effectsDisabled: boolean
}

/**
 * Capability gate for the tactile card layer. SSR-safe: returns the conservative
 * "effects disabled" state until mounted, then resolves from `matchMedia`. Card
 * motion must additionally respect the CMS `cardAnimationIntensity` setting.
 */
export function useReducedEffects(): ReducedEffectsState {
  const [state, setState] = useState<ReducedEffectsState>({
    reducedMotion: true,
    finePointer: false,
    effectsDisabled: true,
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const pointerMq = window.matchMedia('(pointer: fine)')
    const sync = () => {
      const reducedMotion = motionMq.matches
      const finePointer = pointerMq.matches
      setState({
        reducedMotion,
        finePointer,
        effectsDisabled: reducedMotion || !finePointer,
      })
    }
    sync()
    motionMq.addEventListener('change', sync)
    pointerMq.addEventListener('change', sync)
    return () => {
      motionMq.removeEventListener('change', sync)
      pointerMq.removeEventListener('change', sync)
    }
  }, [])

  return state
}
