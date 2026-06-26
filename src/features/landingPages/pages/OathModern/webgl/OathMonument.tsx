import { Suspense, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import type { OathModernColors } from './oathModernColors'
import type { OathModernMotionState } from '../motion/oathModernMotionState'

/**
 * The central forged object the journey is built around. A procedural "oath
 * stele" stands in until a real garment GLB is assigned to the CMS
 * `heroProductModel` slot — then that model loads in its place with zero code
 * change (the `modelUrl` prop). Both share the same group transform so the idle
 * sway, pointer parallax, and scroll-driven turn are identical either way.
 *
 * Material law: the scene has NO environment map, so everything is kept
 * low-metalness and lit explicitly (see {@link HeroAltarScene}). High-metalness
 * PBR would render near-black here.
 */

const LERP = 4

function useMonumentMotion(group: React.RefObject<THREE.Group | null>, motion: OathModernMotionState) {
  useFrame((_, delta) => {
    const g = group.current
    if (!g) return
    const k = Math.min(1, delta * LERP)
    // Just a slow ceremonial idle turn — the CAMERA does the orbiting, so the
    // object itself stays calm (double-rotation reads as busy/cheap).
    g.rotation.y += delta * 0.05
    // Pointer parallax tilt (very subtle).
    const tiltX = motion.pointerY * 0.07
    const tiltZ = -motion.pointerX * 0.05
    g.rotation.x += (tiltX - g.rotation.x) * k
    g.rotation.z += (tiltZ - g.rotation.z) * k
    // Rise a hair as the journey settles.
    const yTarget = -0.1 + motion.progress * 0.12
    g.position.y += (yTarget - g.position.y) * k
  })
}

function ProceduralMonument({ colors }: { colors: OathModernColors }) {
  // Forged hex obelisk — faceted, tapered, low-metalness oxidized steel.
  return (
    <group>
      <mesh position={[0, 0.7, 0]} castShadow={false} receiveShadow={false}>
        <cylinderGeometry args={[0.34, 0.52, 2.6, 6, 1]} />
        <meshStandardMaterial
          color={colors.surface}
          metalness={0.22}
          roughness={0.58}
          flatShading
          emissive={colors.iron}
          emissiveIntensity={0.12}
        />
      </mesh>
      {/* The wax-metal vow band near the crown — the one warm accent. */}
      <mesh position={[0, 1.62, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.37, 0.022, 8, 32]} />
        <meshStandardMaterial
          color={colors.wax}
          metalness={0.4}
          roughness={0.35}
          emissive={colors.wax}
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* Carved base ring on the altar. */}
      <mesh position={[0, -0.58, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.72, 0.03, 8, 48]} />
        <meshStandardMaterial color={colors.iron} metalness={0.3} roughness={0.6} />
      </mesh>
    </group>
  )
}

function GltfMonument({ url }: { url: string }) {
  const gltf = useGLTF(url)
  // Clone so repeated mounts (HMR / remount) never share/mutate the cached scene.
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene])
  // Normalize to ~2.6 world units tall and centre on the altar.
  const normalized = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    const maxDim = Math.max(size.x, size.y, size.z) || 1
    const scale = 2.6 / maxDim
    return { scale, center }
  }, [scene])
  return (
    <group scale={normalized.scale} position={[0, 0.5, 0]}>
      <primitive
        object={scene}
        position={[-normalized.center.x, -normalized.center.y, -normalized.center.z]}
      />
    </group>
  )
}

export function OathMonument({
  modelUrl,
  motion,
  colors,
}: {
  modelUrl: string | null
  motion: OathModernMotionState
  colors: OathModernColors
}) {
  const group = useRef<THREE.Group | null>(null)
  useMonumentMotion(group, motion)
  return (
    <group ref={group} position={[0, -0.1, 0]}>
      {modelUrl ? (
        <Suspense fallback={<ProceduralMonument colors={colors} />}>
          <GltfMonument url={modelUrl} />
        </Suspense>
      ) : (
        <ProceduralMonument colors={colors} />
      )}
    </group>
  )
}
