import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { AltarState } from './altarState'
import { useFittedGltf } from './useFittedGltf'

/** World Y of the anvil's top face — orbs land here, the hammer strikes here. */
export const ANVIL_FACE_Y = 0.05
/** Largest anvil dimension in world units. */
const ANVIL_SIZE = 2.3
/** Pixels of horizontal drag per radian of spin. */
const DRAG_RATE = 0.0085
/** Inertia decay — spin momentum halves roughly every 0.3s after release. */
const SPIN_DECAY = 2.4
/** How far beneath the frame the unsummoned anvil rests, world units — deep
 *  enough that the camera's frustum never clips its horns at rest. */
const SUBMERGE_DEPTH = 2.8
/** Drag only engages once the forge is essentially risen. */
const GRABBABLE_FROM = 0.6

/**
 * The anvil — the altar's centrepiece, summoned rather than parked:
 * `state.forgeT` (the strike timeline's SUMMON/OUTRO beats) rises it from
 * beneath the frame with a slow settling yaw, and sinks it away on release —
 * the idle stage is a bare orb ring. While risen it is grabbable: drag to
 * spin (with momentum on release), proving the 3D. A barely-there breathing
 * bob and a subtle pointer-following tilt when idle; the strike shake
 * rattles it.
 */
export function AltarAnvil({ url, state }: { url: string; state: AltarState }) {
  const group = useRef<THREE.Group>(null)
  const { object, scale, size } = useFittedGltf(url, ANVIL_SIZE)

  const [hovered, setHovered] = useState(false)
  const [grabbing, setGrabbing] = useState(false)
  const dragging = useRef(false)
  const spinY = useRef(0)
  const spinVel = useRef(0)
  const lastX = useRef(0)
  const lastT = useRef(0)

  const worldHeight = size.y * scale
  const baseY = ANVIL_FACE_Y - worldHeight / 2

  // Grab cursor states (drei's useCursor only covers 'pointer').
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.style.cursor = grabbing ? 'grabbing' : hovered ? 'grab' : ''
    return () => {
      document.body.style.cursor = ''
    }
  }, [hovered, grabbing])

  // Window-level move/up so the drag survives leaving the mesh mid-swing.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return
      const dt = Math.max(8, e.timeStamp - lastT.current) / 1000
      const dx = e.clientX - lastX.current
      const dRot = dx * DRAG_RATE
      spinY.current += dRot
      spinVel.current = dRot / dt
      lastX.current = e.clientX
      lastT.current = e.timeStamp
    }
    const onUp = () => {
      if (!dragging.current) return
      dragging.current = false
      setGrabbing(false)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('pointercancel', onUp, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [])

  useFrame((frame, delta) => {
    const g = group.current
    if (!g) return
    const t = frame.clock.elapsedTime

    // THE SUMMON: forgeT (GSAP-shaped on the strike timeline) rises the anvil
    // from beneath the frame. Fully sunk, it neither renders nor raycasts.
    const forge = state.forgeT
    g.visible = forge > 0.015
    if (!g.visible) return

    // Momentum after release.
    if (!dragging.current && Math.abs(spinVel.current) > 0.0001) {
      spinY.current += spinVel.current * delta
      spinVel.current *= Math.exp(-delta * SPIN_DECAY)
    }

    const breathe = Math.sin(t * 0.5) * 0.015
    const shakeX = state.shake > 0.001 ? (Math.random() - 0.5) * state.shake * 0.05 : 0
    const shakeY = state.shake > 0.001 ? (Math.random() - 0.5) * state.shake * 0.035 : 0
    g.position.x = shakeX
    g.position.y = baseY + breathe + shakeY - (1 - forge) * SUBMERGE_DEPTH

    // Drag owns the yaw; the idle pointer tilt stays as a faint garnish. The
    // rise carries a settling quarter-turn — the anvil arrives TURNING, and
    // the same term plays backwards as the outro sinks it.
    const k = Math.min(1, delta * (dragging.current ? 10 : 3.2))
    const summonYaw = (1 - forge) * 0.85
    const targetY = spinY.current + state.pointerX * 0.05 + summonYaw
    const targetX = state.pointerY * 0.03
    g.rotation.y += (targetY - g.rotation.y) * k
    g.rotation.x += (targetX - g.rotation.x) * k
  })

  return (
    <group ref={group} position={[0, baseY, 0]}>
      <group
        scale={scale}
        onPointerOver={() => {
          if (state.forgeT >= GRABBABLE_FROM) setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
        onPointerDown={(e) => {
          if (state.forgeT < GRABBABLE_FROM) return
          e.stopPropagation()
          dragging.current = true
          spinVel.current = 0
          lastX.current = e.clientX
          lastT.current = e.timeStamp
          setGrabbing(true)
        }}
      >
        <primitive object={object} />
      </group>
    </group>
  )
}
