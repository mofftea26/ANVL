import { Suspense, lazy, useEffect, useState, type RefObject } from 'react'
import { isWebglAvailable } from '@/features/story/lib/webgl'
import { LANDING_DESKTOP_CINEMATIC_MQ } from '@/features/landingPages/landingBreakpoints'
import { useTmMotionState } from '../motion/tmMotionState'

const TechForgeScene = lazy(() => import('./TechForgeScene'))

/**
 * Mount gate for the Tech Forge WebGL platform: client-mounted + WebGL-capable +
 * `≥1280px` + no reduced motion. Only then does the lazy import pull three.js
 * (the `vendor-three` chunk) — phones, tablets, reduced-motion, and no-WebGL
 * devices never download it and keep the CSS platform + product image fallback.
 * While mounted, the page root carries `data-tm-webgl="on"`.
 */
export function TechForgeCanvasGate({
  root,
}: {
  root: RefObject<HTMLElement | null>
}) {
  const motion = useTmMotionState()
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
    host.setAttribute('data-tm-webgl', 'on')
    return () => host.removeAttribute('data-tm-webgl')
  }, [active, root])

  if (!active) return null

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <Suspense fallback={null}>
        <TechForgeScene motion={motion} />
      </Suspense>
    </div>
  )
}
