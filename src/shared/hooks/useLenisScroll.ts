import { useEffect } from 'react'
import { useReducedMotion } from './useReducedMotion'

const MD_UP = '(min-width: 768px)'

/**
 * Drives Lenis from GSAP's ticker so every scroll-linked animation
 * stays in lockstep with the smooth-scrolled viewport.
 *
 * Lenis + GSAP are dynamically imported only on the client, at
 * `min-width: 768px`, and never when `prefers-reduced-motion` is set,
 * so phones and low-motion users avoid the extra bundle and work.
 */
export function useLenisScroll(enabled: boolean) {
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!enabled || reduced) return
    if (typeof window === 'undefined') return

    let cancelled = false
    let teardown: (() => void) | undefined

    const mq = window.matchMedia(MD_UP)

    const start = async () => {
      if (!mq.matches) {
        teardown?.()
        teardown = undefined
        return
      }
      if (cancelled) return

      const [{ default: Lenis }, { gsap, ScrollTrigger }] = await Promise.all([
        import('lenis'),
        import('@/shared/lib/gsap'),
      ])

      if (cancelled || !mq.matches) return

      const lenis = new Lenis({
        lerp: 0.07,
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.4,
      })

      const onScroll = () => ScrollTrigger.update()
      lenis.on('scroll', onScroll)

      const ticker = (time: number) => lenis.raf(time * 1000)
      gsap.ticker.add(ticker)
      gsap.ticker.lagSmoothing(0)

      const refresh = () => ScrollTrigger.refresh()
      if (typeof document !== 'undefined' && document.fonts?.ready) {
        document.fonts.ready.then(refresh).catch(() => {})
      }
      window.addEventListener('load', refresh)

      teardown = () => {
        window.removeEventListener('load', refresh)
        lenis.off('scroll', onScroll)
        gsap.ticker.remove(ticker)
        gsap.ticker.lagSmoothing(500, 33)
        lenis.destroy()
      }
    }

    void start()

    const onMq = () => {
      if (!mq.matches) {
        teardown?.()
        teardown = undefined
      } else {
        void start()
      }
    }
    mq.addEventListener('change', onMq)

    return () => {
      cancelled = true
      mq.removeEventListener('change', onMq)
      teardown?.()
    }
  }, [enabled, reduced])
}
