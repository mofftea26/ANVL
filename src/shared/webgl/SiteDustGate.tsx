import { Suspense, lazy, useEffect, useState } from 'react'
import { isWebglAvailable } from './isWebglAvailable'

const SiteDustLayer = lazy(() => import('./SiteDustLayer'))

/** Cursor-driven particles need a cursor and motion consent. */
const SITE_DUST_MQ = '(pointer: fine) and (prefers-reduced-motion: no-preference)'

/** Idle-defer so vendor-three never competes with any page's LCP. */
const IDLE_FALLBACK_MS = 1500

/**
 * Mount gate for the site-wide cursor dust: client + fine pointer + no
 * reduced motion + WebGL-capable + **post-idle** (the lazy import pulls the
 * `vendor-three` chunk only after the page has settled). Touch devices,
 * reduced-motion users, and no-WebGL browsers never download or render it.
 * Routes that integrate the same `DustField` inside their own scene canvas
 * (home's Oath landing, the About altar) are excluded by the caller so the
 * field is never rendered twice.
 */
export function SiteDustGate() {
  const [active, setActive] = useState(false)
  const [idle, setIdle] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(SITE_DUST_MQ)
    const update = () => setActive(media.matches && isWebglAvailable())
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!active) return
    let cancelled = false
    const arm = () => {
      if (!cancelled) setIdle(true)
    }
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(arm, { timeout: IDLE_FALLBACK_MS })
      return () => {
        cancelled = true
        window.cancelIdleCallback(id)
      }
    }
    const id = window.setTimeout(arm, IDLE_FALLBACK_MS)
    return () => {
      cancelled = true
      window.clearTimeout(id)
    }
  }, [active])

  if (!active || !idle) return null

  return (
    <Suspense fallback={null}>
      <SiteDustLayer />
    </Suspense>
  )
}
