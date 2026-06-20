import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import type { OathMotionState } from '../motion/oathMotionState'
import { readOathBrandColors } from './oathBrandColors'
import { Monolith } from './Monolith'
import { DustMotes } from './DustMotes'

/**
 * The Oath's persistent WebGL layer — one fixed, pointer-transparent canvas
 * above the hero film but behind all content (lazy `vendor-three` chunk;
 * mounted only by `OathCanvasGate`). It paints the drop-emblem monument posed
 * by scroll and drifting dust. Layers read the shared motion state in
 * `useFrame` and lerp toward it; nothing here subscribes to React state.
 */
export default function OathCanvas({ motion }: { motion: OathMotionState }) {
  const colors = useMemo(() => readOathBrandColors(), [])
  const coarse =
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 1023.98px)').matches
  const dustCount = coarse ? 350 : 700

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
      data-oath-canvas
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 40 }}
        gl={{
          alpha: true,
          antialias: false,
          powerPreference: 'high-performance',
        }}
        dpr={[1, coarse ? 1.5 : 2]}
        style={{ pointerEvents: 'none' }}
      >
        <Monolith motion={motion} colors={colors} />
        <DustMotes motion={motion} colors={colors} count={dustCount} />
      </Canvas>
    </div>
  )
}
