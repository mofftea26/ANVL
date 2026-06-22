import {
  Suspense,
  lazy,
  useEffect,
  useState,
  type RefObject,
} from 'react'
import { isWebglAvailable } from '@/features/story/lib/webgl'
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
 */
export function OathCanvasGate({
  root,
  motion,
}: {
  root: RefObject<HTMLElement | null>
  motion: OathMotionState
}) {
  const [active, setActive] = useState(false)

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

  if (!active) return null

  return (
    <Suspense fallback={null}>
      <OathCanvas motion={motion} />
    </Suspense>
  )
}
