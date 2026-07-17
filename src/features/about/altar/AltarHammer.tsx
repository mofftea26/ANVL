import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { AltarState } from './altarState'
import { ORB_SEAT } from './AltarOrb'
import { useFittedGltf } from './useFittedGltf'

/** Full hammer length (head to handle butt) in world units. */
const HAMMER_SIZE = 1.85
/** Pivot arm length — the distance from the swing pivot to the striking head. */
const ARM = 1.3
/**
 * The pivot sits exactly one arm-length beside the orb seat, a hair above it,
 * so at `rotation = 0` the arm's head end lands ON the seated orb — the
 * impact point is constructed, not eyeballed.
 */
const PIVOT = new THREE.Vector3(ORB_SEAT.x + ARM, ORB_SEAT.y + 0.1, ORB_SEAT.z)
/**
 * Cocked angle. **Negative** raises the head high ABOVE the pivot (rotating a
 * -X arm by a negative Z angle lifts it), so the swing arcs down from
 * upper-right onto the anvil — never up from below. The timeline overshoots
 * it (hammerT < 0) for the windup.
 */
const RAISED_ANGLE = -1.5

/**
 * The hammer — holstered invisibly until a strike runs. `state.hammerT`
 * (GSAP-tweened; slightly negative during the windup, 1 at impact) swings it
 * around a handle-end pivot; because the pivot is placed one arm-length from
 * the orb seat, the head arcs from high overhead precisely down onto the
 * seated orb at `hammerT = 1`. Fades in on the draw and back out after the
 * lift.
 */
export function AltarHammer({ url, state }: { url: string; state: AltarState }) {
  const pivot = useRef<THREE.Group>(null)
  const fade = useRef(0)
  const { object, scale } = useFittedGltf(url, HAMMER_SIZE)

  // Make every material fade-capable once.
  useEffect(() => {
    object.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const mat = mesh.material as THREE.MeshStandardMaterial
      if (!mat) return
      mat.transparent = true
    })
  }, [object])

  useFrame((_frame, delta) => {
    const g = pivot.current
    if (!g) return
    const k = Math.min(1, delta * 6)

    const visibleTarget = state.activeIndex >= 0 ? 1 : 0
    fade.current += (visibleTarget - fade.current) * k
    g.visible = fade.current > 0.02
    g.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const mat = mesh.material as THREE.MeshStandardMaterial
      if (mat) mat.opacity = fade.current
    })

    // Linear in hammerT: windup (< 0) raises past the cocked angle, 1 = impact.
    g.rotation.z = RAISED_ANGLE * (1 - state.hammerT)
  })

  return (
    <group ref={pivot} position={PIVOT.toArray()} rotation={[0, 0, RAISED_ANGLE]} visible={false}>
      {/* The model (vertical, head at +Y) is laid along the pivot arm with the
          head toward the -X (seat) end. The offset is CONSTRUCTED, not tuned:
          the fitted model is bbox-centred, so shifting its centre to
          -ARM + length/2 puts the striking face exactly at the seat. */}
      <group
        position={[-ARM + HAMMER_SIZE / 2, 0.05, 0]}
        rotation={[0, 0, Math.PI / 2]}
        scale={scale}
      >
        <primitive object={object} />
      </group>
    </group>
  )
}
