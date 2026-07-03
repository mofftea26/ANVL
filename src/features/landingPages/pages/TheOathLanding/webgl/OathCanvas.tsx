import { useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { createDustDrive, DustField, type DustDrive } from '@/shared/webgl/DustField'
import type { OathMotionState } from '../motion/oathMotionState'
import { readOathBrandColors } from './oathBrandColors'
import { Monolith } from './Monolith'

/** Maps the Oath scroll/pointer motion state onto the shared dust drive each
 *  frame — scene pins still the field, the finale and product hover lift it. */
function OathDustDriver({ motion, drive }: { motion: OathMotionState; drive: DustDrive }) {
  useFrame(() => {
    drive.lift = 1 - motion.manifestoProgress * 0.4
    drive.glint = Math.min(1, motion.finaleProgress * 0.5 + (motion.hoveredPiece >= 0 ? 0.25 : 0))
    drive.pointerX = motion.pointerX
    drive.pointerY = motion.pointerY
    drive.pointerVX = motion.pointerVX
    drive.pointerVY = motion.pointerVY
  })
  return null
}

/**
 * The Oath's persistent WebGL layer — one fixed, pointer-transparent canvas
 * above the hero film but behind all content (lazy `vendor-three` chunk;
 * mounted only by `OathCanvasGate`). It paints the drop-emblem monument posed
 * by scroll and the shared site {@link DustField} (scene-integrated here so
 * the global dust layer skips the home route — one field, never two). Layers
 * read the shared motion state in `useFrame` and lerp toward it; nothing here
 * subscribes to React state.
 */
export default function OathCanvas({ motion }: { motion: OathMotionState }) {
  const colors = useMemo(() => readOathBrandColors(), [])
  const drive = useMemo(() => createDustDrive(), [])
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
        <OathDustDriver motion={motion} drive={drive} />
        <DustField drive={drive} count={dustCount} />
      </Canvas>
    </div>
  )
}
