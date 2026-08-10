import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { AboutBrandColors } from '../webgl/aboutBrandColors'
import type { AboutResolvedOrb } from '../content/aboutContent.defaults'
import { altarOrbitParams } from './altarOrbs'
import type { AltarState } from './altarState'
import { AltarAnvil, ANVIL_FACE_Y } from './AltarAnvil'
import { AltarHammer } from './AltarHammer'
import { AltarOrb } from './AltarOrb'
import { AltarStrikeEmbers } from './AltarStrikeEmbers'

/** Shipped defaults so the altar works before any CMS upload. */
const DEFAULT_ANVIL_GLB = '/about/anvil.glb'
const DEFAULT_HAMMER_GLB = '/about/hammer.glb'

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
 * The Forge Altar as an in-canvas stage — everything the old standalone altar
 * canvas held (lights, grabbable anvil, strike hammer, the CMS orb ring, the
 * struck orb's ember disintegration), parked as ONE group at the end of the
 * film's camera path (`ABOUT_ALTAR_STAGE_Z`). Every spatial constant inside
 * is stage-local and unchanged, and the depth rig's final knot reproduces the
 * old camera framing exactly, so the stage looks identical to its standalone
 * days — it is simply somewhere the camera *arrives* now.
 *
 * Mounting this component IS the GLB prefetch: the canvas mounts it as soon
 * as `altarApproach` leaves zero (~2 chapters out), its `useGLTF` Suspense
 * starts streaming, and the DOM load bar tracks `useProgress` until
 * `onLoaded` fires from the post-Suspense tree.
 *
 * The directional lights share one explicit target at the stage's own centre
 * — the three.js default target is the WORLD origin, which now sits 6.4 units
 * down the path and would skew every beam.
 */
export function AltarStage({
  state,
  colors,
  orbs,
  anvilUrl,
  hammerUrl,
  stageZ,
  onSelect,
  onLoaded,
}: {
  state: AltarState
  colors: AboutBrandColors
  orbs: AboutResolvedOrb[]
  anvilUrl?: string
  hammerUrl?: string
  stageZ: number
  onSelect: (index: number) => void
  onLoaded: () => void
}) {
  const lightTarget = useMemo(() => new THREE.Object3D(), [])
  const anvil = anvilUrl?.trim() || DEFAULT_ANVIL_GLB
  const hammer = hammerUrl?.trim() || DEFAULT_HAMMER_GLB

  return (
    <group position={[0, 0, stageZ]}>
      <primitive object={lightTarget} position={[0, 0.2, 0]} />

      {/* Warm-bone key + fills (no environment map — keep metalness legible). */}
      <ambientLight intensity={0.55} color={colors.emblem} />
      <directionalLight
        color={colors.emblem}
        intensity={1.7}
        position={[-2.5, 3.5, 4]}
        target={lightTarget}
      />
      <directionalLight
        color={colors.accent}
        intensity={0.6}
        position={[3, 1.2, 2.5]}
        target={lightTarget}
      />
      <directionalLight
        color={colors.emblem}
        intensity={0.4}
        position={[0, -1, 5]}
        target={lightTarget}
      />
      <StrikeFlash state={state} colors={colors} />

      {/* The forge idles UNSEEN (forgeT = 0 keeps both hidden) — the stage
          rests as a bare orb ring until a strike summons it. */}
      <Suspense fallback={null}>
        <LoadedMark onLoaded={onLoaded} />
        <AltarAnvil url={anvil} state={state} />
        <AltarHammer url={hammer} state={state} />
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
      <AltarStrikeEmbers state={state} orbs={orbs} />
    </group>
  )
}

/** Renders nothing — its mount simply proves the Suspense above it resolved,
 *  which is the one truthful "the GLBs are here" signal the DOM bar needs. */
function LoadedMark({ onLoaded }: { onLoaded: () => void }) {
  useEffect(() => {
    onLoaded()
  }, [onLoaded])
  return null
}
