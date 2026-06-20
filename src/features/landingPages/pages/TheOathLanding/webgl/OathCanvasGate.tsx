import {
  Suspense,
  lazy,
  useEffect,
  useState,
  type RefObject,
} from 'react'
import { isWebglAvailable } from '@/features/story/lib/webgl'
import type { OathMotionState } from '../motion/oathMotionState'

const OathCanvas = lazy(() => import('./OathCanvas'))

const GL_MEDIA_QUERY =
  '(min-width: 768px) and (prefers-reduced-motion: no-preference)'

/**
 * Mount gate for the WebGL layer: client-mounted + WebGL-capable + ≥768px + no
 * reduced motion. Only then does the lazy import pull three.js (the
 * `vendor-three` chunk) — phones, reduced-motion, and no-WebGL devices never
 * download it and keep the DOM hero film + static logo fallback. While mounted,
 * the page root carries `data-webgl="on"` so the DOM logo fallback can hand off.
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
    const media = window.matchMedia(GL_MEDIA_QUERY)
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
