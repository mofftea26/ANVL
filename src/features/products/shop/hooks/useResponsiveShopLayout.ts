import { useEffect, useState } from 'react'

export type ShopLayoutState = {
  /** ≥1024px — desktop quick-view modal + sticky filter rail. */
  isDesktop: boolean
}

const DESKTOP_MQ = '(min-width: 1024px)'

/**
 * Minimal viewport gate for shop layout decisions that genuinely need JS (e.g.
 * desktop modal vs. mobile bottom-sheet quick view). Most responsive layout is
 * CSS/container-query driven — only branch in JS when CSS cannot express it.
 * SSR-safe: defaults to mobile until mounted.
 */
export function useResponsiveShopLayout(): ShopLayoutState {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia(DESKTOP_MQ)
    const sync = () => setIsDesktop(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return { isDesktop }
}
