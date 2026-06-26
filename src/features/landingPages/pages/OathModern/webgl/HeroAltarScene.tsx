import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import type { OathModernColors } from './oathModernColors'
import type { OathModernMotionState } from '../motion/oathModernMotionState'
import { cameraForProgress } from './oathModernCamera'
import { OathMonument } from './OathMonument'

const CAMERA_LERP = 2.6

/**
 * The forged world: explicit low-metalness lighting (no environment map — see
 * {@link OathMonument}), the central monument, an altar floor, drifting dust, and
 * a cursor-tracked warm key light (the signature interaction). The camera follows
 * the single `progress` source through {@link cameraForProgress}; nothing here
 * subscribes to React state — it reads the motion bridge and lerps each frame.
 */
export function HeroAltarScene({
  motion,
  colors,
  modelUrl,
  dustCount,
}: {
  motion: OathModernMotionState
  colors: OathModernColors
  modelUrl: string | null
  dustCount: number
}) {
  const cursorLight = useRef<THREE.PointLight | null>(null)
  const lookAt = useRef(new THREE.Vector3())
  const { camera } = useThree()

  useFrame((_, delta) => {
    const k = Math.min(1, delta * CAMERA_LERP)
    const pose = cameraForProgress(motion.progress)

    // Subtle pointer parallax layered on the authored path (life, not control).
    const px = pose.px + motion.pointerX * 0.25
    const py = pose.py - motion.pointerY * 0.18
    camera.position.x += (px - camera.position.x) * k
    camera.position.y += (py - camera.position.y) * k
    camera.position.z += (pose.pz - camera.position.z) * k
    lookAt.current.set(pose.tx, pose.ty, pose.tz)
    camera.lookAt(lookAt.current)

    // Cursor-tracked warm light glides across the monument face.
    const light = cursorLight.current
    if (light) {
      const tx = motion.pointerX * 3.2
      const ty = 0.8 - motion.pointerY * 2.2
      light.position.x += (tx - light.position.x) * k
      light.position.y += (ty - light.position.y) * k
    }
  })

  return (
    <>
      <color attach="background" args={[colors.bg.r, colors.bg.g, colors.bg.b]} />
      <fog attach="fog" args={[`#${colors.bg.getHexString()}`, 6, 13]} />

      {/* Explicit lighting — the scene has no env map, so PBR is lit by hand. */}
      <ambientLight intensity={0.32} color={colors.bone} />
      <directionalLight position={[3.5, 4, 5]} intensity={1.5} color={colors.wax} />
      <directionalLight position={[-4.5, 2.5, -3]} intensity={0.7} color={colors.bone} />
      <pointLight
        ref={cursorLight}
        position={[0, 0.8, 3]}
        intensity={9}
        distance={11}
        decay={2}
        color={colors.wax}
      />

      <OathMonument modelUrl={modelUrl} motion={motion} colors={colors} />

      {/* Altar floor — a dark disc that grounds the monument. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.62, 0]}>
        <circleGeometry args={[6, 48]} />
        <meshStandardMaterial
          color={colors.bg}
          metalness={0.1}
          roughness={0.9}
          emissive={colors.iron}
          emissiveIntensity={0.04}
        />
      </mesh>

      {/* Bone dust drifting through the void. */}
      <Sparkles
        count={dustCount}
        scale={[11, 7, 5]}
        position={[0, 1, -1]}
        size={2.2}
        speed={0.3}
        opacity={0.5}
        color={`#${colors.dust.getHexString()}`}
      />
    </>
  )
}
