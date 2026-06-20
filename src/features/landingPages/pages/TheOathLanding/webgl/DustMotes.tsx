import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { OathMotionState } from '../motion/oathMotionState'
import type { OathBrandColors } from './oathBrandColors'
import { DUST_FRAGMENT, DUST_VERTEX } from './shaders/dust'

const LERP = 3.4

function buildDustGeometry(count: number): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  const phase = new Float32Array(count)
  const speed = new Float32Array(count)
  const size = new Float32Array(count)
  const depth = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 12
    positions[i * 3 + 1] = (Math.random() - 0.5) * 7
    positions[i * 3 + 2] = -3 + Math.random() * 4
    phase[i] = Math.random()
    speed[i] = 0.4 + Math.random() * 1.0
    size[i] = 1.5 + Math.random() * 3.5
    depth[i] = Math.random()
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
  geo.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1))
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
  geo.setAttribute('aDepth', new THREE.BufferAttribute(depth, 1))
  return geo
}

/**
 * Bone-grey dust drifting through the void around the monolith — barely there,
 * GPU-animated, parted by the pointer. Hover/finale lift the field's breath
 * slightly (`uGlint`), never into a glow.
 */
export function DustMotes({
  motion,
  colors,
  count,
}: {
  motion: OathMotionState
  colors: OathBrandColors
  count: number
}) {
  const material = useRef<THREE.ShaderMaterial | null>(null)

  const geometry = useMemo(() => buildDustGeometry(count), [count])
  useEffect(() => () => geometry.dispose(), [geometry])

  // Built once. Theme color edits are pushed into the live uniforms below
  // instead of recreating the material/canvas.
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uLift: { value: 1 },
      uGlint: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uPointerForce: { value: 0 },
      uPixelRatio: {
        value: typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio, 2),
      },
      uColorPrimary: { value: colors.particlePrimary.clone() },
      uColorSecondary: { value: colors.particleSecondary.clone() },
      uColorHighlight: { value: colors.particleHighlight.clone() },
    }),
    // Intentionally built once (no deps); colors are synced into these same
    // uniform objects by the effect below so the material is never recreated.
    [],
  )

  // Sync theme particle colors into the existing uniforms when the theme
  // changes — no geometry or canvas teardown.
  useEffect(() => {
    const mat = material.current
    if (!mat) return
    ;(mat.uniforms.uColorPrimary.value as THREE.Color).copy(colors.particlePrimary)
    ;(mat.uniforms.uColorSecondary.value as THREE.Color).copy(colors.particleSecondary)
    ;(mat.uniforms.uColorHighlight.value as THREE.Color).copy(colors.particleHighlight)
  }, [colors])

  // Pause animation when the tab is hidden.
  const visibleRef = useRef(true)
  useEffect(() => {
    const onVisibility = () => {
      visibleRef.current = document.visibilityState === 'visible'
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useFrame((state, delta) => {
    const mat = material.current
    if (!mat || !visibleRef.current) return
    const k = Math.min(1, delta * LERP)
    const u = mat.uniforms

    u.uTime.value += delta
    const liftTarget = 1 - motion.manifestoProgress * 0.4
    const glintTarget =
      motion.finaleProgress * 0.5 + (motion.hoveredPiece >= 0 ? 0.25 : 0)
    u.uLift.value += (liftTarget - u.uLift.value) * k
    u.uGlint.value += (Math.min(1, glintTarget) - u.uGlint.value) * k

    const p = u.uPointer.value as THREE.Vector2
    const targetX = (motion.pointerX * state.viewport.width) / 2
    const targetY = (-motion.pointerY * state.viewport.height) / 2
    p.x += (targetX - p.x) * k
    p.y += (targetY - p.y) * k
    const speed = Math.min(
      1,
      Math.hypot(motion.pointerVX, motion.pointerVY) * 0.35,
    )
    u.uPointerForce.value += (0.4 + speed * 0.6 - u.uPointerForce.value) * k
  })

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        vertexShader={DUST_VERTEX}
        fragmentShader={DUST_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
