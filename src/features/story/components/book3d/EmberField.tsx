import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { readThemeCssColor } from '@/shared/lib/themeColor'

/** Volume the embers drift through (centered on the book, mostly behind it). */
const FIELD_W = 5.2
const FIELD_H = 3.4
const FIELD_NEAR = 0.4
const FIELD_FAR = -2.2

const VERT = /* glsl */ `
  attribute float aSeed;
  attribute float aSize;
  uniform float uTime;
  uniform float uDpr;
  varying float vFlicker;
  void main() {
    vec3 p = position;
    float rise = 0.05 + 0.07 * fract(aSeed * 3.7);
    p.y = mod(p.y + ${(FIELD_H / 2).toFixed(2)} + uTime * rise, ${FIELD_H.toFixed(2)}) - ${(FIELD_H / 2).toFixed(2)};
    p.x += sin(uTime * (0.3 + 0.5 * fract(aSeed * 5.1)) + aSeed * 40.0) * 0.16;
    p.z += sin(uTime * (0.2 + 0.3 * fract(aSeed * 8.3)) + aSeed * 17.0) * 0.1;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = aSize * uDpr * (6.5 / -mv.z);
    vFlicker = 0.45 + 0.55 * sin(uTime * (1.2 + 2.2 * fract(aSeed * 9.7)) + aSeed * 20.0);
    gl_Position = projectionMatrix * mv;
  }
`

const FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uFade;
  varying float vFlicker;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = 1.0 - smoothstep(0.05, 0.5, d);
    gl_FragColor = vec4(uColor, a * max(vFlicker, 0.0) * uFade);
  }
`

interface EmberFieldProps {
  /** CMS foil color of the chapter — embers warm toward it. */
  color: string
  /** Embers only glow once the book is open and reading. */
  active: boolean
}

/**
 * Floating forge embers around the open book — all motion lives in the vertex
 * shader (one time uniform per frame, no CPU attribute writes). The cloud
 * parallaxes gently against the cursor so the reading room feels deep.
 * The material is built imperatively: r3f clones a `uniforms` prop object, so
 * per-frame updates must target the material's own uniforms.
 */
export function EmberField({ color, active }: EmberFieldProps) {
  const group = useRef<THREE.Group>(null)
  const viewport = useThree((s) => s.viewport)
  const count =
    typeof window !== 'undefined' && window.innerWidth < 1024 ? 64 : 110

  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    const sizes = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * FIELD_W
      positions[i * 3 + 1] = (Math.random() - 0.5) * FIELD_H
      positions[i * 3 + 2] = FIELD_FAR + Math.random() * (FIELD_NEAR - FIELD_FAR)
      seeds[i] = Math.random() * 100
      sizes[i] = 2.4 + Math.random() * 5
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    // The cloud never leaves the view; skip per-frame sphere checks.
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), FIELD_W)
    // Embers warm from the chapter foil toward the active theme ember, so the
    // story atmosphere complements the CMS theme (falls back to a warm orange).
    const themeEmber = readThemeCssColor('--color-highlight', '#ff8a3a')
    const warm = new THREE.Color(color).lerp(new THREE.Color(themeEmber), 0.45)
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uFade: { value: 0 },
        uDpr: { value: 1 },
        uColor: { value: warm },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return { geometry: geo, material: mat }
  }, [color, count])

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame((state, delta) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
    material.uniforms.uDpr.value = state.gl.getPixelRatio()
    const target = active ? 0.85 : 0
    material.uniforms.uFade.value +=
      (target - material.uniforms.uFade.value) * Math.min(1, delta * 1.6)
    // Gentle parallax toward the cursor — the room has depth, the book stays put.
    const g = group.current
    if (g) {
      const k = Math.min(1, delta * 2.5)
      g.position.x += (state.pointer.x * viewport.width * 0.018 - g.position.x) * k
      g.position.y += (state.pointer.y * viewport.height * 0.014 - g.position.y) * k
    }
  })

  return (
    <group ref={group}>
      <points geometry={geometry} material={material} frustumCulled={false} />
    </group>
  )
}
