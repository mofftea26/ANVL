import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import type { AltarState } from './altarState'
import { ORB_SEAT } from './AltarOrb'
import { useFittedGltf } from './useFittedGltf'

/** Full hammer length (head to handle butt) in world units. */
const HAMMER_SIZE = 1.85
/** Pivot arm length — the distance from the swing pivot to the striking head. */
const ARM = 1.3
/**
 * How far the swing plane sits IN FRONT of the orb seat (toward the camera).
 *
 * DEPTH FIX (root cause): the swing plane used to sit exactly at the seat's
 * z, which is (a) inside the anvil body's front bulk — the opaque anvil
 * depth-occluded the arc's lower half — and (b) coplanar with the seated
 * palantír, whose transparent shader still WRITES depth, so the transparent-
 * pass sort clipped the head right at the moment of impact. The hammer is a
 * foreground actor: swinging it in a plane just in front of the seat keeps
 * the whole arc nearer the camera than both occluders while the impact still
 * reads dead-on the orb (the camera looks almost straight down -z).
 */
const SWING_FORWARD = 0.5
/**
 * The pivot sits exactly one arm-length beside the orb seat, a hair above it,
 * so at `rotation = 0` the arm's head end lands ON the seated orb — the
 * impact point is constructed, not eyeballed.
 */
const PIVOT = new THREE.Vector3(ORB_SEAT.x + ARM, ORB_SEAT.y + 0.1, ORB_SEAT.z + SWING_FORWARD)
/**
 * Cocked angle. **Negative** raises the head high ABOVE the pivot (rotating a
 * -X arm by a negative Z angle lifts it), so the swing arcs down from
 * upper-right onto the anvil — never up from below. The timeline overshoots
 * it (hammerT < 0) for the windup.
 */
const RAISED_ANGLE = -1.5
/** Draws after the seated stone/halo — settles the transparent-pass sort. */
const HAMMER_RENDER_ORDER = 10

/** Idle sway amplitudes — layered sinusoids, tuned faint (weighty, magical). */
const SWAY_Z = 0.045
const SWAY_Z_WOBBLE = 0.016
const SWAY_X = 0.03
const BOB_Y = 0.028

/**
 * The hammer — holstered invisibly until a strike runs. `state.hammerT`
 * (GSAP-tweened; slightly negative during the windup, 1 at impact) swings it
 * around a handle-end pivot; because the pivot is placed one arm-length from
 * the orb seat, the head arcs from high overhead precisely down onto the
 * seated orb at `hammerT = 1` — the burst fires on that same timeline beat,
 * so the visual impact and the explosion stay locked together.
 *
 * On top of the timeline-driven arc:
 * - **Idle sway** while the hammer hovers cocked (the glide/hold before the
 *   windup): three layered clock-offset sinusoids — a slow drift, a subtle
 *   faster wobble, and a faint vertical bob — irregular on purpose (no single
 *   sin), fading out entirely as the windup/drop takes over and under
 *   reduced motion.
 * - **Follow-through**: the wrist lags the swing — a small x-axis lean driven
 *   by the arc's angular velocity, so the drop reads as accelerating mass and
 *   the recoil settles with a dying wobble instead of stopping dead.
 */
export function AltarHammer({ url, state }: { url: string; state: AltarState }) {
  const pivot = useRef<THREE.Group>(null)
  const fade = useRef(0)
  const prevT = useRef(0)
  const lean = useRef(0)
  const reducedMotion = useReducedMotion()
  const { object, scale } = useFittedGltf(url, HAMMER_SIZE)

  // Make every material fade-capable once, and pin the render order so the
  // (transparent) hammer wins the sort against the seated stone's halo.
  useEffect(() => {
    object.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.renderOrder = HAMMER_RENDER_ORDER
      const mat = mesh.material as THREE.MeshStandardMaterial
      if (!mat) return
      mat.transparent = true
    })
  }, [object])

  useFrame((frame, delta) => {
    const g = pivot.current
    if (!g) return
    const t = frame.clock.elapsedTime
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

    // Angular velocity of the arc (per second) — drives the follow-through.
    const vel = delta > 0 ? (state.hammerT - prevT.current) / delta : 0
    prevT.current = state.hammerT

    // Sway only while the hammer hangs near its cocked rest (|hammerT| small):
    // the windup/drop own the motion completely once the strike is underway.
    const restWeight = reducedMotion
      ? 0
      : Math.max(0, 1 - Math.abs(state.hammerT) * 3) * fade.current

    // Layered, clock-offset sinusoids — deliberately incommensurate rates so
    // the drift never reads as a metronome.
    const swayZ =
      (Math.sin(t * 0.53 + 1.7) * SWAY_Z + Math.sin(t * 1.31 + 0.4) * SWAY_Z_WOBBLE) * restWeight
    const swayX = Math.sin(t * 0.83 + 2.9) * SWAY_X * restWeight
    const bobY =
      (Math.sin(t * 0.71 + 0.9) * BOB_Y + Math.sin(t * 1.93 + 4.2) * BOB_Y * 0.3) * restWeight

    // Base arc: linear in hammerT (the GSAP timeline shapes the velocity —
    // anticipation ease-out, expo drop, recoil), so hammerT = 1 is EXACTLY
    // rotation 0 = head on the orb, in sync with the burst trigger.
    // The wrist lean lags the arc velocity — eased toward it so the drop
    // whips and the settle wobbles out; clamped small so the contact point
    // never drifts off the seat.
    const leanTarget = THREE.MathUtils.clamp(vel * 0.045, -0.16, 0.16)
    lean.current += (leanTarget - lean.current) * Math.min(1, delta * 9)

    g.rotation.z = RAISED_ANGLE * (1 - state.hammerT) + swayZ
    g.rotation.x = swayX + lean.current
    g.position.y = PIVOT.y + bobY
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
