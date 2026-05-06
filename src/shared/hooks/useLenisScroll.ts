import { useEffect } from 'react'
import Lenis from 'lenis'
import { useReducedMotion } from './useReducedMotion'

export function useLenisScroll(enabled: boolean) {
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!enabled || reduced) {
      return
    }

    const lenis = new Lenis({ duration: 1.05, smoothWheel: true })
    let raf = 0
    const onFrame = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(onFrame)
    }
    raf = requestAnimationFrame(onFrame)

    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [enabled, reduced])
}
