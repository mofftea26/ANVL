import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import type { AboutMotionState } from '../motion/aboutMotionState'
import { readAboutBrandColors } from './aboutBrandColors'
import { AboutMonolith } from './AboutMonolith'
import { AboutDust } from './AboutDust'

/**
 * About's persistent WebGL layer — one fixed, pointer-transparent canvas
 * behind all content (lazy `vendor-three` chunk; mounted only by
 * `AboutCanvasGate` once a monolith GLB is CMS-assigned). Mirrors `OathCanvas`.
 */
export default function AboutCanvas({
  modelUrl,
  motion,
}: {
  modelUrl: string
  motion: AboutMotionState
}) {
  const colors = useMemo(() => readAboutBrandColors(), [])
  const coarse =
    typeof window !== 'undefined' && window.matchMedia('(max-width: 1023.98px)').matches
  const dustCount = coarse ? 300 : 600

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10" data-about-canvas>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 40 }}
        gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
        dpr={[1, coarse ? 1.5 : 2]}
        style={{ pointerEvents: 'none' }}
      >
        <AboutMonolith modelUrl={modelUrl} motion={motion} colors={colors} />
        <AboutDust motion={motion} colors={colors} count={dustCount} />
      </Canvas>
    </div>
  )
}
