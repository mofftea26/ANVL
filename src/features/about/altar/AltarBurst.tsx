import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { AboutResolvedOrb } from '../content/aboutContent.defaults'
import type { AltarState } from './altarState'
import { ORB_SEAT } from './AltarOrb'

const PARTICLE_COUNT = 80

const BURST_VERTEX = /* glsl */ `
precision highp float;

attribute vec3 aDir;
attribute float aSpread;
attribute float aSize;

uniform float uT;
uniform float uPixelRatio;

varying float vAlpha;

void main() {
  float t = clamp(uT, 0.0, 1.0);
  // Shards fly out fast, ease off, and sag under a little gravity.
  vec3 pos = aDir * (0.1 + t * 1.9 * aSpread);
  pos.y -= t * t * 0.6;
  vAlpha = pow(1.0 - t, 1.7);
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uPixelRatio * (1.0 - 0.55 * t) * (300.0 / -mv.z);
}
`

const BURST_FRAGMENT = /* glsl */ `
precision highp float;

uniform vec3 uColor;
varying float vAlpha;

void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float d = dot(p, p);
  if (d > 1.0) discard;
  float soft = exp(-d * 2.2);
  gl_FragColor = vec4(uColor, vAlpha * soft);
}
`

function buildBurstGeometry(): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry()
  const positions = new Float32Array(PARTICLE_COUNT * 3)
  const dirs = new Float32Array(PARTICLE_COUNT * 3)
  const spread = new Float32Array(PARTICLE_COUNT)
  const size = new Float32Array(PARTICLE_COUNT)

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Random unit direction, biased slightly upward — sparks off an anvil.
    const theta = Math.random() * Math.PI * 2
    const y = Math.random() * 1.4 - 0.4
    const r = Math.sqrt(Math.max(0, 1 - Math.min(1, y * y)))
    dirs[i * 3] = Math.cos(theta) * r
    dirs[i * 3 + 1] = y
    dirs[i * 3 + 2] = Math.sin(theta) * r
    spread[i] = 0.6 + Math.random() * 0.8
    size[i] = 2.0 + Math.random() * 3.5
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('aDir', new THREE.BufferAttribute(dirs, 3))
  geo.setAttribute('aSpread', new THREE.BufferAttribute(spread, 1))
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
  return geo
}

/**
 * The strike explosion — the seated orb bursts into a spray of shards plus an
 * expanding shockwave ring, both in the struck orb's own color. Driven by
 * `state.burstT` (GSAP-tweened 0→1 at impact); idle frames render nothing.
 */
export function AltarBurst({ orbs, state }: { orbs: AboutResolvedOrb[]; state: AltarState }) {
  const points = useRef<THREE.Points>(null)
  const ring = useRef<THREE.Mesh>(null)
  const ringMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const lastColored = useRef(-1)

  const geometry = useMemo(() => buildBurstGeometry(), [])
  useEffect(() => () => geometry.dispose(), [geometry])

  const uniforms = useMemo(
    () => ({
      uT: { value: 0 },
      uColor: { value: new THREE.Color('#E7E4DF') },
      uPixelRatio: {
        value: typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio, 2),
      },
    }),
    [],
  )

  useFrame(() => {
    const active = state.burstT > 0.001 && state.burstT < 0.999

    // Tint shards + ring with the struck orb's color once per strike.
    if (state.activeIndex >= 0 && state.activeIndex !== lastColored.current) {
      const color = orbs[state.activeIndex]?.color
      if (color) {
        ;(uniforms.uColor.value as THREE.Color).set(color)
        ringMaterial.current?.color.set(color)
      }
      lastColored.current = state.activeIndex
    }
    if (state.activeIndex === -1) lastColored.current = -1

    if (points.current) {
      points.current.visible = active
      uniforms.uT.value = state.burstT
    }
    if (ring.current && ringMaterial.current) {
      ring.current.visible = active
      const s = 0.25 + state.burstT * 3.2
      ring.current.scale.setScalar(s)
      ringMaterial.current.opacity = (1 - state.burstT) * 0.85
    }
  })

  return (
    <group position={ORB_SEAT.toArray()}>
      <points ref={points} geometry={geometry} frustumCulled={false} visible={false}>
        <shaderMaterial
          vertexShader={BURST_VERTEX}
          fragmentShader={BURST_FRAGMENT}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      {/* Shockwave ring — expands flat toward the camera. */}
      <mesh ref={ring} visible={false}>
        <ringGeometry args={[0.32, 0.4, 48]} />
        <meshBasicMaterial
          ref={ringMaterial}
          transparent
          opacity={0}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}
