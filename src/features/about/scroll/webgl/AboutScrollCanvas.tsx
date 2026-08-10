import { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { createDustDrive, DustField, type DustDrive } from '@/shared/webgl/DustField'
import { readAboutBrandColors } from '../../webgl/aboutBrandColors'
import { AltarAurora } from '../../altar/AltarAurora'
import { AltarStage } from '../../altar/AltarStage'
import type { AltarState } from '../../altar/altarState'
import type { AboutResolvedOrb } from '../../content/aboutContent.defaults'
import type { AboutScrollMotion } from '../motion/aboutMotionState'
import { AboutDepthRig } from './AboutDepthRig'
import { ABOUT_ALTAR_STAGE_Z, ABOUT_DEPTH } from './aboutDepthPath'
import { AltarLoadProgress } from './AltarLoadProgress'

/** Everything the DOM side hands the canvas about the altar finale. */
export interface AboutAltarCanvasProps {
  state: AltarState
  orbs: AboutResolvedOrb[]
  anvilUrl?: string
  hammerUrl?: string
  onSelect: (index: number) => void
}

/** Maps the film's motion state onto the shared dust drive each frame —
 *  pointer parting always, a glint pulse every chapter boundary, and the
 *  altar's impact flash re-igniting the whole field. */
function AboutDustDriver({
  motion,
  altarState,
  drive,
}: {
  motion: AboutScrollMotion
  altarState: AltarState
  drive: DustDrive
}) {
  const lastBurst = useRef(0)
  useFrame(() => {
    if (motion.boundaryBurst !== lastBurst.current) {
      lastBurst.current = motion.boundaryBurst
      drive.glint = 1
    }
    if (altarState.flash > drive.glint) drive.glint = altarState.flash
    drive.pointerX = motion.pointerX
    drive.pointerY = motion.pointerY
    drive.pointerVX = motion.pointerVX
    drive.pointerVY = motion.pointerVY
  })
  return null
}

function AltarStageGate({
  motion,
  altar,
  colors,
  onApproached,
  onLoaded,
}: {
  motion: AboutScrollMotion
  altar: AboutAltarCanvasProps
  colors: ReturnType<typeof readAboutBrandColors>
  onApproached: (v: boolean) => void
  onLoaded: () => void
}) {
  // Flips true (once) the moment the approach ramp leaves zero — the mount
  // signal that starts the altar's GLB stream ~2 chapters early.
  const [approached, setApproached] = useState(false)
  useFrame(() => {
    if (!approached && motion.altarApproach > 0.001) {
      setApproached(true)
      onApproached(true)
    }
  })
  if (!approached) return null
  return (
    <Suspense fallback={null}>
      <AltarStage
        state={altar.state}
        colors={colors}
        orbs={altar.orbs}
        anvilUrl={altar.anvilUrl}
        hammerUrl={altar.hammerUrl}
        stageZ={ABOUT_ALTAR_STAGE_Z}
        onSelect={altar.onSelect}
        onLoaded={onLoaded}
      />
    </Suspense>
  )
}

/**
 * The film's ONE persistent WebGL layer — a fixed, pointer-transparent canvas
 * behind every chapter (lazy `vendor-three`; mounted only by
 * `AboutScrollCanvasGate`). The camera dollies down the z path with scroll
 * (`AboutDepthRig`), through the shared cursor dust (scene-integrated: /about
 * is a full-bleed route, so the global dust layer skips it — one field, never
 * two) under the aurora's slow shimmer, and ARRIVES at the Forge Altar stage
 * parked at the path's end. The stage mounts as the approach ramp starts
 * (its Suspense IS the GLB prefetch) and the DOM load bar tracks it in.
 *
 * Pointer events: none by default (the film scrolls THROUGH this layer); the
 * `data-altar-live` attribute the altar pin flips on the experience root
 * turns them on via CSS exactly while the finale is on stage, so the anvil
 * becomes grabbable. Everything reads the mutable motion state in
 * `useFrame`; nothing here subscribes to React state.
 */
export default function AboutScrollCanvas({
  motion,
  altar,
  onContextLost,
}: {
  motion: AboutScrollMotion
  altar: AboutAltarCanvasProps
  /** Fires if the GPU/browser evicts this canvas's WebGL context so the
   *  gate can force a fresh remount instead of leaving a blank scene. */
  onContextLost?: () => void
}) {
  const colors = useMemo(() => readAboutBrandColors(), [])
  const drive = useMemo(() => createDustDrive({ decayGlint: true }), [])
  const [approached, setApproached] = useState(false)
  const [stageLoaded, setStageLoaded] = useState(false)

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
        onCreated={({ gl }) => {
          const onLost = (event: Event) => {
            event.preventDefault()
            onContextLost?.()
          }
          gl.domElement.addEventListener('webglcontextlost', onLost)
        }}
      >
        <AboutDepthRig motion={motion} altarState={altar.state} />
        <AltarAurora colors={colors} />
        <AboutDustDriver motion={motion} altarState={altar.state} drive={drive} />
        <DustField drive={drive} count={500} />
        <AltarStageGate
          motion={motion}
          altar={altar}
          colors={colors}
          onApproached={setApproached}
          onLoaded={() => setStageLoaded(true)}
        />
      </Canvas>
      <AltarLoadProgress approached={approached} ready={stageLoaded} />
    </div>
  )
}
