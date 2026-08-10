import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { createDustDrive, DustField, type DustDrive } from '@/shared/webgl/DustField'
import { readAboutBrandColors } from '../../webgl/aboutBrandColors'
import { AltarAurora } from '../../altar/AltarAurora'
import type { AboutScrollMotion } from '../motion/aboutMotionState'
import { AboutDepthRig } from './AboutDepthRig'
import { ABOUT_DEPTH } from './aboutDepthPath'

/** Maps the film's motion state onto the shared dust drive each frame —
 *  pointer parting always, plus a glint pulse every chapter boundary. */
function AboutDustDriver({
  motion,
  drive,
}: {
  motion: AboutScrollMotion
  drive: DustDrive
}) {
  const lastBurst = useRef(0)
  useFrame(() => {
    if (motion.boundaryBurst !== lastBurst.current) {
      lastBurst.current = motion.boundaryBurst
      drive.glint = 1
    }
    drive.pointerX = motion.pointerX
    drive.pointerY = motion.pointerY
    drive.pointerVX = motion.pointerVX
    drive.pointerVY = motion.pointerVY
  })
  return null
}

/**
 * The film's ONE persistent WebGL layer — a fixed, pointer-transparent canvas
 * behind every chapter (lazy `vendor-three`; mounted only by
 * `AboutScrollCanvasGate`). The camera dollies down the z path with scroll
 * (`AboutDepthRig`), through the shared cursor dust (scene-integrated: /about
 * is a full-bleed route, so the global dust layer skips it — one field, never
 * two) under the aurora's slow shimmer. The altar stage and the ember
 * boundary field join this same canvas in later phases. Everything reads the
 * mutable motion state in `useFrame`; nothing subscribes to React state.
 */
export default function AboutScrollCanvas({
  motion,
  onContextLost,
}: {
  motion: AboutScrollMotion
  /** Fires if the GPU/browser evicts this canvas's WebGL context so the
   *  gate can force a fresh remount instead of leaving a blank scene. */
  onContextLost?: () => void
}) {
  const colors = useMemo(() => readAboutBrandColors(), [])
  const drive = useMemo(() => createDustDrive({ decayGlint: true }), [])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
      data-about-canvas
    >
      <Canvas
        camera={{
          position: [0, ABOUT_DEPTH.cameraHeight, ABOUT_DEPTH.cameraStartZ],
          fov: 38,
        }}
        gl={{
          alpha: true,
          antialias: false,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
        style={{ pointerEvents: 'none' }}
        onCreated={({ gl }) => {
          const onLost = (event: Event) => {
            event.preventDefault()
            onContextLost?.()
          }
          gl.domElement.addEventListener('webglcontextlost', onLost)
        }}
      >
        <AboutDepthRig motion={motion} />
        <AltarAurora colors={colors} />
        <AboutDustDriver motion={motion} drive={drive} />
        <DustField drive={drive} count={500} />
      </Canvas>
    </div>
  )
}
