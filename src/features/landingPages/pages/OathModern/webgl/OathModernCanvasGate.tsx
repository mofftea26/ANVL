import { Suspense, lazy, useEffect, useState, type RefObject } from 'react'
import { isWebglAvailable } from '@/features/story/lib/webgl'
import { LANDING_DESKTOP_CINEMATIC_MQ } from '@/features/landingPages/landingBreakpoints'
import type { OathModernMotionState } from '../motion/oathModernMotionState'

const OathModernCanvas = lazy(() => import('./OathModernCanvas'))

/**
 * Mount gate for the persistent WebGL layer: client-mounted + WebGL-capable +
 * `≥1280px` + no reduced motion. Only then does the lazy import pull three.js
 * (the `vendor-three` chunk) — phones, tablets, reduced-motion, and no-WebGL
 * devices never download it and keep the SSR-first static chapters. While
 * mounted, the page root carries `data-om-webgl="on"` so the static hero stage
 * hands off to the live scene (see styles.css).
 */
export function OathModernCanvasGate({
  root,
  motion,
  modelUrl,
}: {
  root: RefObject<HTMLElement | null>
  motion: OathModernMotionState
  modelUrl: string | null
}) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(LANDING_DESKTOP_CINEMATIC_MQ)
    const update = () => setActive(media.matches && isWebglAvailable())
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const host = root.current
    if (!host || !active) return
    host.setAttribute('data-om-webgl', 'on')
    return () => host.removeAttribute('data-om-webgl')
  }, [active, root])

  if (!active) return null

  return (
    <Suspense fallback={null}>
      <OathModernCanvas motion={motion} modelUrl={modelUrl} />
    </Suspense>
  )
}
