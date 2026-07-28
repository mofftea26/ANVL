import { Suspense, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { DustField, type DustDrive } from '@/shared/webgl/DustField'
import type { AboutBrandColors } from '../webgl/aboutBrandColors'
import type { AboutResolvedOrb } from '../content/aboutContent.defaults'
import { altarOrbitParams } from './altarOrbs'
import type { AltarState } from './altarState'
import { AltarAurora } from './AltarAurora'
import { AltarAnvil, ANVIL_FACE_Y } from './AltarAnvil'
import { AltarHammer } from './AltarHammer'
import { AltarOrb, ORB_SEAT } from './AltarOrb'
import { AltarModalForge, SHROUD_OUTER_RADIUS } from './AltarModalForge'

/** Camera drifts with the pointer and rattles on impact — always looking at
 *  the altar. */
function CameraRig({ state }: { state: AltarState }) {
  const { camera } = useThree()
  const look = useRef(new THREE.Vector3(0, 0.35, 0))

  useFrame((_frame, delta) => {
    const k = Math.min(1, delta * 2.6)
    const jitterX = state.shake > 0.001 ? (Math.random() - 0.5) * state.shake * 0.12 : 0
    const jitterY = state.shake > 0.001 ? (Math.random() - 0.5) * state.shake * 0.09 : 0
    camera.position.x += (state.pointerX * 0.45 - camera.position.x) * k
    camera.position.x += jitterX
    camera.position.y += (0.6 + state.pointerY * -0.28 - camera.position.y) * k
    camera.position.y += jitterY
    camera.lookAt(look.current)
  })
  return null
}

/**
 * The ONE piece of in-canvas → DOM plumbing: the orb seat, and the ember
 * shroud's outer radius around it, projected to NDC by the live scene camera
 * (which drifts with the pointer and rattles on impact) into the mutable altar
 * state every frame. At the hand-off beat the DOM side turns both into viewport
 * pixels — the origin the shared ember swarm scatters from, and how wide its
 * launch ring must be to sit on top of the shroud it is taking over from —
 * using the canvas element's own box. Kept camera-only here (no
 * `getBoundingClientRect`) so nothing in the render loop forces layout.
 * Mounted after {@link CameraRig} so it reads the camera the rig just moved.
 *
 * The radius is measured along world X rather than the camera's right vector:
 * the rig never rolls and yaws by at most a couple of degrees of parallax, so
 * the difference is under a percent — and both points sit on the same depth
 * plane, where the perspective divide is a constant.
 */
function SeatProjector({ state }: { state: AltarState }) {
  const seat = useRef(new THREE.Vector3())
  const rim = useRef(new THREE.Vector3())
  useFrame(({ camera }) => {
    seat.current.copy(ORB_SEAT).project(camera)
    rim.current.set(ORB_SEAT.x + SHROUD_OUTER_RADIUS, ORB_SEAT.y, ORB_SEAT.z).project(camera)
    state.seatNdc.x = seat.current.x
    state.seatNdc.y = seat.current.y
    state.seatNdc.radius = Math.abs(rim.current.x - seat.current.x)
  })
  return null
}

/** The impact flash — a point light over the anvil face spiking with the strike. */
function StrikeFlash({ state, colors }: { state: AltarState; colors: AboutBrandColors }) {
  const light = useRef<THREE.PointLight>(null)
  useFrame(() => {
    if (light.current) light.current.intensity = state.flash * 34
  })
  return (
    <pointLight
      ref={light}
      color={colors.accent}
      intensity={0}
      distance={9}
      decay={1.8}
      position={[0, ANVIL_FACE_Y + 0.5, 1.1]}
    />
  )
}

/**
 * Everything inside the altar canvas: the aurora void, the grabbable anvil +
 * strike hammer (normalized GLBs), the CMS-driven orb ring (each orb its own
 * color), the struck orb's ember disintegration, the seat→DOM projector that
 * places the modal's ember swarm, the shared cursor dust, and the lighting
 * rig. All
 * per-frame motion reads the mutable {@link AltarState} written by the GSAP
 * strike timelines — zero React state in the loop.
 */
export function AltarScene({
  state,
  drive,
  colors,
  orbs,
  anvilUrl,
  hammerUrl,
  onSelect,
}: {
  state: AltarState
  drive: DustDrive
  colors: AboutBrandColors
  orbs: AboutResolvedOrb[]
  anvilUrl: string
  hammerUrl: string
  onSelect: (index: number) => void
}) {
  return (
    <>
      <CameraRig state={state} />
      <SeatProjector state={state} />
      <AltarAurora colors={colors} />

      {/* Warm-bone key + fills (no environment map — keep metalness legible). */}
      <ambientLight intensity={0.55} color={colors.emblem} />
      <directionalLight color={colors.emblem} intensity={1.7} position={[-2.5, 3.5, 4]} />
      <directionalLight color={colors.accent} intensity={0.6} position={[3, 1.2, 2.5]} />
      <directionalLight color={colors.emblem} intensity={0.4} position={[0, -1, 5]} />
      <StrikeFlash state={state} colors={colors} />

      <Suspense fallback={null}>
        <AltarAnvil url={anvilUrl} state={state} />
        <AltarHammer url={hammerUrl} state={state} />
      </Suspense>

      {orbs.map((orb, i) => (
        <AltarOrb
          key={orb.id}
          orb={orb}
          index={i}
          orbit={altarOrbitParams(i, orbs.length)}
          state={state}
          onSelect={onSelect}
        />
      ))}
      <AltarModalForge state={state} orbs={orbs} />

      <DustField drive={drive} count={500} />
    </>
  )
}
