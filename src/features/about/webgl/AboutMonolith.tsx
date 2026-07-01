import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import type { AboutMotionState } from '../motion/aboutMotionState'
import type { AboutBrandColors } from './aboutBrandColors'

const LERP = 3.2
const BONE_FALLBACK = '#e8e3d8'
/** Steady turn rate (rad/s) the monolith rotates at in the hero — slow and ceremonial. */
const BASE_SPIN = 0.22

type LogoTone = 'primary' | 'mid' | 'highlight'
const TONES: LogoTone[] = ['primary', 'mid', 'highlight']

/**
 * The About Monolith — a CMS-uploaded 3D model (GLB, generated from a still
 * via Higgsfield image→3D) floating in the void behind the hero copy. At rest
 * it drifts to screen centre through the hero (`heroProgress`) without
 * changing size; as the page moves into the philosophy/process scenes it
 * recedes, stops spinning, faces the viewer, and darkens; it returns
 * centre/front, **enlarges**, and its colour lerps to a primary→accent theme
 * gradient for the finale (`finaleProgress`) — mirrors The Oath's `Monolith`
 * choreography, adapted for an arbitrary loaded mesh instead of an extruded
 * SVG (materials are tagged with a tone on load since a GLB's palette is not
 * known ahead of time).
 */
export function AboutMonolith({
  modelUrl,
  motion,
  colors,
}: {
  modelUrl: string
  motion: AboutMotionState
  colors: AboutBrandColors
}) {
  const { viewport } = useThree()
  const group = useRef<THREE.Group>(null)
  const { scene } = useGLTF(modelUrl)
  const cloned = useMemo(() => scene.clone(true), [scene])

  const finaleTone = useMemo(() => {
    const primary = colors.primary ?? new THREE.Color(BONE_FALLBACK)
    const accent = colors.accent ?? new THREE.Color(BONE_FALLBACK)
    return {
      primary: primary.clone(),
      mid: primary.clone().lerp(accent, 0.5),
      highlight: accent.clone(),
    } satisfies Record<LogoTone, THREE.Color>
  }, [colors])

  useEffect(() => {
    let i = 0
    cloned.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const mat = mesh.material as THREE.MeshStandardMaterial
      if (!mat || !mat.color) return
      mat.userData.tone = TONES[i % TONES.length]
      i += 1
    })
  }, [cloned])

  const startRef = useRef<number | null>(null)
  const yaw = useRef(0)
  const spinVel = useRef(1.4)
  const tmpColor = useRef(new THREE.Color())

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const k = Math.min(1, delta * LERP)
    const t = state.clock.elapsedTime
    if (startRef.current === null) startRef.current = t

    // Entrance: rises from below and scales in over ~1.5s.
    const age = t - startRef.current
    const introT = Math.min(1, age / 1.5)
    const intro = 1 - Math.pow(1 - introT, 4)
    const introScale = 0.6 + 0.4 * intro
    const introLift = (1 - intro) * -0.9

    const recede = Math.max(
      motion.philosophyProgress,
      motion.materialsProgress,
      motion.constructionProgress,
      motion.testingProgress,
    )
    const rise = motion.finaleProgress
    const heroCenter = motion.heroProgress
    const settle = (1 - recede) * (1 - rise)

    const restX = -viewport.width * 0.24
    const restY = 0
    const bob = Math.sin(t * 0.6) * 0.09
    const breath = Math.sin(t * 0.4 + 1.2) * 0.18

    const targetX = restX * (1 - heroCenter) * settle
    const targetY =
      restY * (1 - heroCenter) * settle + bob + introLift + heroCenter * 0.12 * settle + rise * 0.15
    const targetZ = -recede * 5 + rise * 3.6 + breath
    const SMALL = 0.5
    const FINALE = 1.55
    const baseScale = SMALL + (FINALE - SMALL) * rise
    const targetScale = baseScale * introScale

    g.position.x += (targetX - g.position.x) * k
    g.position.y += (targetY - g.position.y) * k
    g.position.z += (targetZ - g.position.z) * k
    const s = g.scale.x + (targetScale - g.scale.x) * k
    g.scale.setScalar(s)

    const dim = 1 - recede * 0.6
    g.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const mat = mesh.material as THREE.MeshStandardMaterial
      if (!mat || !mat.color) return
      const ud = mat.userData as { baseColor?: THREE.Color; baseEmissive?: number; tone?: LogoTone }
      if (!ud.baseColor) {
        ud.baseColor = mat.color.clone()
        ud.baseEmissive = mat.emissiveIntensity ?? 0
      }
      tmpColor.current.copy(ud.baseColor)
      if (rise > 0.001) {
        tmpColor.current.lerp(finaleTone[ud.tone ?? 'primary'], rise)
      }
      mat.color.copy(tmpColor.current).multiplyScalar(dim)
      if (mat.emissive) mat.emissiveIntensity = (ud.baseEmissive ?? 0) * dim
    })

    const atBack = recede > 0.04 || rise > 0.04
    if (atBack) {
      const front = Math.round(yaw.current / (Math.PI * 2)) * (Math.PI * 2)
      yaw.current += (front - yaw.current) * Math.min(1, delta * 2.5)
      spinVel.current = 0
    } else {
      spinVel.current += (BASE_SPIN - spinVel.current) * Math.min(1, delta * 0.8)
      yaw.current += spinVel.current * delta
    }
    g.rotation.y = yaw.current
    const targetRotX = atBack ? 0 : Math.sin(t * 0.27) * 0.08
    g.rotation.x += (targetRotX - g.rotation.x) * k
    g.rotation.z += (0 - g.rotation.z) * k
  })

  const emblem = colors.emblem ?? new THREE.Color(BONE_FALLBACK)

  return (
    <>
      {/* Steady key + front fill + rim so the mesh is legible at rest. Low
          metalness assumption: the scene has no environment map, so
          high-metalness PBR materials render near-black. */}
      <ambientLight intensity={0.6} color={emblem} />
      <directionalLight color={emblem} intensity={2.0} position={[-2.5, 3, 4]} />
      <directionalLight color={emblem} intensity={0.85} position={[0, 0.5, 6]} />
      <directionalLight color={emblem} intensity={0.5} position={[3, -1.5, 1]} />
      <pointLight color={emblem} intensity={22} distance={18} decay={1.6} position={[1.6, 1.2, 3]} />

      <group ref={group} position={[-1.7, 0.9, 0]} scale={0.5}>
        <primitive object={cloned} />
      </group>
    </>
  )
}
