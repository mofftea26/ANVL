import {
  Suspense,
  lazy,
  useEffect,
  useState,
  type RefObject,
} from 'react'
import { isWebglAvailable } from '@/features/story/lib/webgl'
import { useCanvasMountGate, useCanvasTeardownMark } from '@/shared/webgl/canvasTeardownGuard'
import type { OathMotionState } from '../motion/oathMotionState'
import { OATH_DESKTOP_CINEMATIC_MQ } from '../oathBreakpoints'

const OathCanvas = lazy(() => import('./OathCanvas'))

/**
 * Mount gate for the WebGL layer: client-mounted + WebGL-capable + ≥1280px + no
 * reduced motion. Only then does the lazy import pull three.js (the
 * `vendor-three` chunk) — phones, tablets (incl. iPad Pro below xl), reduced-
 * motion, and no-WebGL devices never download it and keep the DOM hero film +
 * static logo fallback. While mounted, the page root carries `data-webgl="on"`
 * so the DOM logo fallback can hand off.
 *
 * Also waits out `useCanvasMountGate` (see `canvasTeardownGuard.ts`) so a fast
 * return to `/` doesn't race any other route's WebGL canvas teardown (Story's
 * shelf/book, the About altar, the site-wide dust layer), and self-heals via
 * `onContextLost` if the browser ever does evict this canvas's context.
 */
export function OathCanvasGate({
  root,
  motion,
}: {
  root: RefObject<HTMLElement | null>
  motion: OathMotionState
}) {
  const [active, setActive] = useState(false)
  const [instanceKey, setInstanceKey] = useState(0)
  const mountable = useCanvasMountGate(active)
  useCanvasTeardownMark()

  useEffect(() => {
    const media = window.matchMedia(OATH_DESKTOP_CINEMATIC_MQ)
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
      <OathCanvas
        key={instanceKey}
        motion={motion}
        onContextLost={() => setInstanceKey((k) => k + 1)}
      />
    </Suspense>
  )
}
