import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import {
  ContactShadows,
  Environment,
  Lightformer,
  Sparkles,
} from '@react-three/drei'
import type { OathModernColors } from './oathModernColors'
import type { OathModernMotionState } from '../motion/oathModernMotionState'
import { cameraForProgress } from './oathModernCamera'
import { OathMonument } from './OathMonument'

// Lower = slower, more cinematic follow (elegant lag behind the scroll).
const CAMERA_LERP = 1.7

/**
 * The forged chamber. Lit by an in-scene environment built from Lightformers
 * (image-based reflections + form WITHOUT a network HDR — self-contained), a warm
 * cursor-tracked key light (the signature), soft contact shadows for grounding,
 * and a faint warm backdrop glow for depth. Sparse, slow dust. The camera follows
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

  const waxHex = `#${colors.wax.getHexString()}`
  const boneHex = `#${colors.bone.getHexString()}`
  const bgHex = `#${colors.bg.getHexString()}`

  useFrame((_, delta) => {
    const k = Math.min(1, delta * CAMERA_LERP)
    const pose = cameraForProgress(motion.progress)

    // Subtle pointer parallax layered on the authored path (life, not control).
    const px = pose.px + motion.pointerX * 0.18
    const py = pose.py - motion.pointerY * 0.12
    camera.position.x += (px - camera.position.x) * k
    camera.position.y += (py - camera.position.y) * k
    camera.position.z += (pose.pz - camera.position.z) * k
    lookAt.current.set(pose.tx, pose.ty, pose.tz)
    camera.lookAt(lookAt.current)

    // Cursor-tracked warm light glides across the monument face.
    const light = cursorLight.current
    if (light) {
      const tx = motion.pointerX * 3
      const ty = 0.8 - motion.pointerY * 2
      light.position.x += (tx - light.position.x) * k
      light.position.y += (ty - light.position.y) * k
    }
  })

  return (
    <>
      <color attach="background" args={[colors.bg.r, colors.bg.g, colors.bg.b]} />
      <fog attach="fog" args={[bgHex, 8, 18]} />

      {/* Image-based lighting from in-scene light shapes — gives the garment form
          and soft reflections without loading an external HDR. Baked once. */}
      <Environment resolution={256} frames={1}>
        <Lightformer
          intensity={2.4}
          color={waxHex}
          position={[3, 3.5, 2]}
          scale={[5, 5, 1]}
        />
        <Lightformer
          intensity={1}
          color={boneHex}
          position={[-4.5, 1.5, -1]}
          scale={[3, 6, 1]}
        />
        <Lightformer
          intensity={0.7}
          color={boneHex}
          position={[0, 2.5, -5]}
          scale={[8, 3, 1]}
        />
      </Environment>

      {/* Direct lights — a soft warm key + a cool rim for edge separation, plus the
          cursor signature light. Kept gentle; the environment does the modelling. */}
      <ambientLight intensity={0.18} color={colors.bone} />
      <directionalLight position={[3.5, 4, 5]} intensity={0.7} color={colors.wax} />
      <directionalLight position={[-4.5, 2.5, -3]} intensity={0.5} color={colors.bone} />
      <pointLight
        ref={cursorLight}
        position={[0, 0.8, 3]}
        intensity={7}
        distance={11}
        decay={2}
        color={colors.wax}
      />

      <OathMonument modelUrl={modelUrl} motion={motion} colors={colors} />

      {/* Soft grounded shadow — premium contact without a hard floor edge. */}
      <ContactShadows
        position={[0, -0.62, 0]}
        scale={11}
        blur={2.8}
        opacity={0.6}
        far={4}
        color="#000000"
        resolution={512}
      />

      {/* Faint warm backdrop glow, far behind, for depth (fades into fog). */}
      <mesh position={[0, 0.8, -7]} scale={[18, 12, 1]}>
        <planeGeometry />
        <meshBasicMaterial color={colors.iron} transparent opacity={0.12} />
      </mesh>

      {/* Sparse, slow, dim bone dust — atmosphere, never glitter. */}
      <Sparkles
        count={dustCount}
        scale={[12, 8, 6]}
        position={[0, 1, -1]}
        size={1.3}
        speed={0.12}
        opacity={0.3}
        color={boneHex}
      />
    </>
  )
}
