import { Suspense, lazy, useEffect, useState, type RefObject } from 'react'
import { isWebglAvailable } from '@/shared/webgl/isWebglAvailable'
import { useCanvasMountGate, useCanvasTeardownMark } from '@/shared/webgl/canvasTeardownGuard'
import { ABOUT_CINEMATIC_MQ } from '../../aboutBreakpoints'
import type { AboutScrollMotion } from '../motion/aboutMotionState'
import type { AboutAltarCanvasProps } from './AboutScrollCanvas'

const AboutScrollCanvas = lazy(() => import('./AboutScrollCanvas'))

/**
 * Mount gate for the film's WebGL layer: client-mounted + WebGL-capable +
 * ≥1280px + no reduced motion. Only then does the lazy import pull three.js
 * (the `vendor-three` chunk) — the DOM film stands alone without it, per the
 * particle-forge standard's "WebGL is a layer, never a dependency."
 *
 * While mounted, the experience root carries `data-webgl="on"` so DOM layers
 * can hand off. Waits out `useCanvasMountGate` (see `canvasTeardownGuard.ts`)
 * so a fast route change doesn't race another canvas's teardown, and
 * self-heals via `onContextLost` remount.
 */
export function AboutScrollCanvasGate({
  root,
  motion,
  altar,
}: {
  root: RefObject<HTMLElement | null>
  motion: AboutScrollMotion
  altar: AboutAltarCanvasProps
}) {
  const [active, setActive] = useState(false)
  const [instanceKey, setInstanceKey] = useState(0)
  const mountable = useCanvasMountGate(active)
  useCanvasTeardownMark()

  useEffect(() => {
    const media = window.matchMedia(ABOUT_CINEMATIC_MQ)
    const update = () => setActive(media.matches && isWebglAvailable())
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const host = root.current
    if (!host || !active) return
    host.setAttribute('data-webgl', 'on')
    return () => host.removeAttribute('data-webgl')
  }, [active, root])

  if (!active || !mountable) return null

  return (
    <Suspense fallback={null}>
      <AboutScrollCanvas
        key={instanceKey}
        motion={motion}
        altar={altar}
        onContextLost={() => setInstanceKey((k) => k + 1)}
      />
    </Suspense>
  )
}
