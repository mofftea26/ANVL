import { useLayoutEffect } from 'react'
import {
  applyLandingEntryLock,
  releaseLandingEntryLock,
} from '@/features/landingPages/LandingEntryContext'

/**
 * Locks document scroll while the landing entry overlay is visible.
 * Uses layout effect + html attribute so the scrollbar never paints.
 */
export function useLockPageScroll(locked: boolean) {
  useLayoutEffect(() => {
    if (typeof document === 'undefined') return

    if (!locked) {
      releaseLandingEntryLock()
      return
    }

    const scrollY = window.scrollY
    applyLandingEntryLock()
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'

    return () => {
      const top = document.body.style.top
      releaseLandingEntryLock()
      if (top) {
        const y = Math.abs(Number.parseInt(top, 10)) || 0
        window.scrollTo(0, y)
      }
    }
  }, [locked])
}
