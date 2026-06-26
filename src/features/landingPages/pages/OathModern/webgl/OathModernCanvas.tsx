import { useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { readOathModernColors } from './oathModernColors'
import { HeroAltarScene } from './HeroAltarScene'
import type { OathModernMotionState } from '../motion/oathModernMotionState'

/**
 * The Oath Modern's persistent WebGL layer — one fixed, pointer-transparent
 * canvas behind all content (lazy `vendor-three` chunk; mounted only by
 * `OathModernCanvasGate`). Reads the brand colors once, sizes the dust + DPR to a
 * coarse device tier, pauses the render loop when the tab is hidden, and lets the
 * browser recover a lost context. The scene reads the shared motion state each
 * frame; nothing here subscribes to React state beyond the visibility pause.
 */
export default function OathModernCanvas({
  motion,
  modelUrl,
}: {
  motion: OathModernMotionState
  modelUrl: string | null
}) {
  const colors = useMemo(() => readOathModernColors(), [])

  const tier = useMemo(() => {
    if (typeof navigator === 'undefined') return 'full'
    const cores = navigator.hardwareConcurrency ?? 8
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
    return cores <= 4 || mem <= 4 ? 'reduced' : 'full'
  }, [])
  const dustCount = tier === 'reduced' ? 60 : 130
  const dprMax = tier === 'reduced' ? 1.5 : 2

  // Pause the render loop while the tab is hidden (no wasted GPU/CPU).
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    const onVisibility = () => setPaused(document.visibilityState !== 'visible')
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  return (
    <div
      aria-hidden="true"
      data-oath-modern-canvas
      className="pointer-events-none fixed inset-0 -z-10"
    >
      <Canvas
        camera={{ position: [0, 2.4, 6.2], fov: 42 }}
        frameloop={paused ? 'never' : 'always'}
        dpr={[1, dprMax]}
        gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
        style={{ pointerEvents: 'none' }}
        onCreated={({ gl }) => {
          // Let the browser attempt context restoration instead of going black.
          gl.domElement.addEventListener(
            'webglcontextlost',
            (e) => e.preventDefault(),
            false,
          )
        }}
      >
        <HeroAltarScene
          motion={motion}
          colors={colors}
          modelUrl={modelUrl}
          dustCount={dustCount}
        />
      </Canvas>
    </div>
  )
}
