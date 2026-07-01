import { Suspense, lazy, useEffect, useState, type RefObject } from 'react'
import { isWebglAvailable } from '@/features/story/lib/webgl'
import type { AboutMotionState } from '../motion/aboutMotionState'
import { ABOUT_DESKTOP_CINEMATIC_MQ } from '../aboutBreakpoints'

const AboutCanvas = lazy(() => import('./AboutCanvas'))

/**
 * Mount gate for the WebGL layer: client-mounted + WebGL-capable + ≥1280px +
 * no reduced motion + a monolith GLB is CMS-assigned. Only then does the lazy
 * import pull three.js (the `vendor-three` chunk) — phones, tablets, reduced-
 * motion, no-WebGL devices, and an unassigned monolith slot never download it;
 * the page reads perfectly well without the 3D layer. Mirrors `OathCanvasGate`.
 */
export function AboutCanvasGate({
  root,
  modelUrl,
  motion,
}: {
  root: RefObject<HTMLElement | null>
  modelUrl?: string
  motion: AboutMotionState
}) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!modelUrl) {
      setActive(false)
      return
    }
    const media = window.matchMedia(ABOUT_DESKTOP_CINEMATIC_MQ)
    const update = () => setActive(media.matches && isWebglAvailable())
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [modelUrl])

  useEffect(() => {
    const host = root.current
    if (!host || !active) return
    host.setAttribute('data-webgl', 'on')
    return () => host.removeAttribute('data-webgl')
  }, [active, root])

  if (!active || !modelUrl) return null

  return (
    <Suspense fallback={null}>
      <AboutCanvas modelUrl={modelUrl} motion={motion} />
    </Suspense>
  )
}
