import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { AboutBrandColors } from '../webgl/aboutBrandColors'
import { AURORA_FRAGMENT, AURORA_VERTEX } from './shaders/aurora'

/**
 * The aurora — a large shader plane behind the anvil, breathing slow bands of
 * ember/bone/steel light. Transparent + additive so it reads as a magical
 * shimmer *over* the forge backdrop photo (the altar section's `-z-20`
 * layer), never occluding it. Theme-driven via the brand color uniforms;
 * time is the only per-frame write.
 */
export function AltarAurora({ colors }: { colors: AboutBrandColors }) {
  const material = useRef<THREE.ShaderMaterial | null>(null)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColorA: { value: colors.accent.clone() },
      uColorB: { value: colors.emblem.clone() },
      uColorC: { value: colors.primary.clone() },
    }),
    // Built once per mount — the canvas remounts on navigation/theme change.
    [],
  )

  useFrame((_state, delta) => {
    if (material.current) material.current.uniforms.uTime.value += delta
  })

  return (
    <mesh position={[0, 0.6, -7]} renderOrder={-1}>
      <planeGeometry args={[26, 14]} />
      <shaderMaterial
        ref={material}
        vertexShader={AURORA_VERTEX}
        fragmentShader={AURORA_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}
