import { lazy, Suspense, useEffect, useState } from 'react'
import { isWebglAvailable } from '@/shared/webgl/isWebglAvailable'
import { useCanvasMountGate } from '@/shared/webgl/canvasTeardownGuard'
import type { PassportMotionState } from './passportMotionState'

const PassportForgeCanvas = lazy(() => import('./PassportForgeCanvas'))

/** Console-tier gate: ≥1280px, motion allowed, WebGL capable. */
export const PASSPORT_CONSOLE_MQ =
  '(min-width: 1280px) and (prefers-reduced-motion: no-preference)'

/**
 * Gate + lazy mount for the passport forge canvas (OathCanvasGate pattern):
 * the `lazy()` import is what pulls `vendor-three`, so it only happens after
 * the gate passes; context-lost self-heals via a keyed remount.
 */
export function PassportForgeGate({
  motion,
  imageUrl,
}: {
  motion: PassportMotionState
  imageUrl: string | null
}) {
  const [active, setActive] = useState(false)
  const mountable = useCanvasMountGate(active)

  useEffect(() => {
    const mq = window.matchMedia(PASSPORT_CONSOLE_MQ)
    const update = () => {
      setActive(mq.matches && isWebglAvailable())
    }
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  if (!active || !mountable) return null

  return (
    <Suspense fallback={null}>
      <PassportForgeCanvas motion={motion} imageUrl={imageUrl} />
    </Suspense>
  )
}
