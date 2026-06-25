import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import {
  readOathBrandColors,
  type OathBrandColors,
} from '@/features/landingPages/pages/TheOathLanding/webgl/oathBrandColors'
import type { TmMotionState } from '../motion/tmMotionState'

const LERP = 3.2

/**
 * Procedural engineered platform: concentric metallic rings + a base disc beneath
 * the product. Rotates slowly, resolves with `platformProgress`, and parallaxes
 * to the pointer (clamped). Materials read the theme palette so the platform
 * tracks the CMS theme — never hardcoded.
 */
function ForgePlatform({
  motion,
  colors,
}: {
  motion: TmMotionState
  colors: OathBrandColors
}) {
  const group = useRef<THREE.Group>(null)
  const spin = useRef<THREE.Group>(null)

  const steel = useMemo(() => colors.steel.clone(), [colors])
  const champagne = useMemo(() => colors.ember.clone(), [colors])
  const bone = useMemo(() => colors.emblem.clone(), [colors])

  useFrame((_, delta) => {
    const k = Math.min(1, delta * LERP)
    if (spin.current) spin.current.rotation.y += delta * 0.18
    const g = group.current
    if (!g) return
    // Pointer parallax (clamped) + reveal/scale from scroll progress.
    const targetRotY = motion.pointerX * 0.18
    const targetRotX = -0.9 + motion.pointerY * 0.12
    g.rotation.y += (targetRotY - g.rotation.y) * k
    g.rotation.x += (targetRotX - g.rotation.x) * k
    const s = 0.8 + motion.platformProgress * 0.25
    g.scale.x += (s - g.scale.x) * k
    g.scale.y = g.scale.x
    g.scale.z = g.scale.x
  })

  return (
    <group ref={group} position={[0, -1.15, 0]} rotation={[-0.9, 0, 0]}>
      <group ref={spin}>
        <mesh>
          <torusGeometry args={[1.7, 0.012, 16, 120]} />
          <meshStandardMaterial color={steel} metalness={0.9} roughness={0.35} />
        </mesh>
        <mesh>
          <torusGeometry args={[1.25, 0.02, 16, 120]} />
          <meshStandardMaterial
            color={champagne}
            metalness={0.85}
            roughness={0.3}
            emissive={champagne}
            emissiveIntensity={0.25}
          />
        </mesh>
        <mesh>
          <torusGeometry args={[0.8, 0.012, 16, 96]} />
          <meshStandardMaterial color={steel} metalness={0.9} roughness={0.4} />
        </mesh>
      </group>
      <mesh position={[0, 0, -0.06]}>
        <cylinderGeometry args={[1.55, 1.6, 0.04, 96]} />
        <meshStandardMaterial
          color={bone}
          metalness={0.6}
          roughness={0.6}
          transparent
          opacity={0.06}
        />
      </mesh>
    </group>
  )
}

export default function TechForgeScene({ motion }: { motion: TmMotionState }) {
  const colors = useMemo(() => readOathBrandColors(), [])
  const wrapper = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)

  const coarse =
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 1023.98px)').matches

  // Pause rendering when the stage scrolls offscreen or the tab is hidden.
  useEffect(() => {
    const el = wrapper.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) =>
        setVisible(entry.isIntersecting && document.visibilityState === 'visible'),
      { threshold: 0.01 },
    )
    io.observe(el)
    const onVis = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVis)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return (
    <div ref={wrapper} className="absolute inset-0">
      <Canvas
        frameloop={visible ? 'always' : 'never'}
        camera={{ position: [0, 1.2, 4.2], fov: 38 }}
        gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
        dpr={[1, coarse ? 1.5 : 2]}
        style={{ pointerEvents: 'none' }}
      >
        <ambientLight intensity={0.45} />
        <directionalLight position={[3, 5, 4]} intensity={0.8} color={colors.bone} />
        <pointLight position={[-2, 1.5, 2]} intensity={18} color={colors.ember} distance={9} />
        <ForgePlatform motion={motion} colors={colors} />
        <Sparkles
          count={coarse ? 90 : 220}
          scale={[6, 4, 3]}
          size={2}
          speed={0.3}
          opacity={0.5}
          noise={0.6}
          color={colors.particlePrimary}
        />
      </Canvas>
    </div>
  )
}
