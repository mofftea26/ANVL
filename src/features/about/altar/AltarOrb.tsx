import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html, useCursor } from '@react-three/drei'
import type { AboutResolvedOrb } from '../content/aboutContent.defaults'
import type { AltarOrbitParams } from './altarOrbs'
import type { AltarState } from './altarState'
import { ANVIL_FACE_Y } from './AltarAnvil'
import { PALANTIR_FRAGMENT, PALANTIR_VERTEX } from './shaders/palantir'

export const ORB_RADIUS = 0.17
/** Orbit ellipse around the anvil (x wide, z shallow for perspective depth). */
const ORBIT_RX = 2.75
const ORBIT_RZ = 1.15
const ORBIT_Y = 0.62
/** Slow, ceremonial ring — a full lap takes ~80s. */
const ORBIT_RATE = 0.08
/** Seated orbs shrink to rest on the anvil face like a workpiece. */
export const ORB_SEAT_SCALE = 0.62
/** Where a focused orb seats for the strike — resting ON the anvil face
 *  (shrunken radius + a hair of squish), shared with the hammer/burst. */
export const ORB_SEAT = new THREE.Vector3(
  0,
  ANVIL_FACE_Y + ORB_RADIUS * ORB_SEAT_SCALE + 0.02,
  0.28,
)

const FRESNEL_VERTEX = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`

const FRESNEL_FRAGMENT = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform float uStrength;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.4);
  gl_FragColor = vec4(uColor, fresnel * uStrength);
}
`

/**
 * One orbiting **palantír** — a near-black polished seeing-stone with a storm
 * of smoke and fire swirling in its depths, tinted by the orb's own CMS
 * color, wrapped in a faint fresnel aura, with a DOM label. Hovering wakes
 * the stone (the storm quickens and brightens); when focused it glides onto
 * the anvil seat, shrinking like a workpiece; at impact it blooms and
 * **bursts apart** (`explodeT` — the burst particles take over), then
 * re-materializes in orbit on release. Clicks raycast on the stone.
 */
export function AltarOrb({
  orb,
  index,
  orbit,
  state,
  onSelect,
}: {
  orb: AboutResolvedOrb
  index: number
  orbit: AltarOrbitParams
  state: AltarState
  onSelect: (index: number) => void
}) {
  const group = useRef<THREE.Group>(null)
  const stone = useRef<THREE.ShaderMaterial | null>(null)
  const halo = useRef<THREE.ShaderMaterial | null>(null)
  const label = useRef<HTMLSpanElement | null>(null)
  const angle = useRef(orbit.phase)
  const hoverLift = useRef(0)
  const swirlClock = useRef(Math.random() * 20)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)

  const color = useMemo(() => new THREE.Color(orb.color), [orb.color])

  const stoneUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSeed: { value: index * 1.618 + 0.37 },
      uColor: { value: color.clone() },
      uIntensity: { value: 0.85 },
      uDissolve: { value: 1 },
    }),
    // Rebuilt only when the orb's color changes (CMS edit → remount).
    [color, index],
  )
  const haloUniforms = useMemo(
    () => ({ uColor: { value: color.clone() }, uStrength: { value: 0.5 } }),
    [color],
  )

  useFrame((frame, delta) => {
    const g = group.current
    if (!g) return
    const t = frame.clock.elapsedTime
    const k = Math.min(1, delta * 5)

    angle.current += delta * ORBIT_RATE * orbit.speed * state.orbitSpeed

    const focus = state.focusT[index] ?? 0
    const isActive = state.activeIndex === index
    const explode = isActive ? state.explodeT : 0

    hoverLift.current += ((hovered && state.activeIndex === -1 ? 1 : 0) - hoverLift.current) * k

    const ox = Math.cos(angle.current) * ORBIT_RX
    const oz = Math.sin(angle.current) * ORBIT_RZ
    const oy = ORBIT_Y + Math.sin(t * 0.8 + orbit.bobPhase) * 0.16 + hoverLift.current * 0.08

    g.position.set(
      ox + (ORB_SEAT.x - ox) * focus,
      oy + (ORB_SEAT.y - oy) * focus,
      oz + (ORB_SEAT.z - oz) * focus,
    )

    // Seated orbs shrink onto the face like a workpiece; at impact they bloom
    // out and dissolve — the burst particles carry the energy on.
    const squash = isActive ? state.flash * 0.3 : 0
    const grow =
      (1 + hoverLift.current * 0.12) *
      (1 - focus * (1 - ORB_SEAT_SCALE)) *
      (1 + explode * 1.15)
    g.scale.set(grow * (1 + squash * 0.5), grow * (1 - squash), grow * (1 + squash * 0.5))
    g.visible = explode < 0.985

    const dissolve = Math.pow(1 - explode, 1.5)
    const dim = state.activeIndex >= 0 && !isActive ? 1 - state.ringDim * 0.78 : 1

    // The stone wakes under the hand: the storm quickens and brightens.
    swirlClock.current += delta * (1 + hoverLift.current * 1.6 + (isActive ? 1.2 : 0))
    if (stone.current) {
      const u = stone.current.uniforms
      u.uTime.value = swirlClock.current
      u.uIntensity.value =
        dim * (0.85 + hoverLift.current * 0.5 + (isActive ? state.flash * 2.6 + explode * 1.6 : 0))
      u.uDissolve.value = dissolve
    }
    if (halo.current) {
      halo.current.uniforms.uStrength.value =
        (0.5 + hoverLift.current * 0.4 + explode * 1.6) * dim * dissolve
    }
    if (label.current) {
      label.current.style.opacity = String(0.9 * dim * (1 - focus))
    }
  })

  return (
    <group ref={group}>
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          onSelect(index)
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[ORB_RADIUS, 48, 48]} />
        <shaderMaterial
          ref={stone}
          vertexShader={PALANTIR_VERTEX}
          fragmentShader={PALANTIR_FRAGMENT}
          uniforms={stoneUniforms}
          transparent
        />
      </mesh>
      {/* Faint mystical aura around the stone. */}
      <mesh scale={1.45}>
        <sphereGeometry args={[ORB_RADIUS, 24, 24]} />
        <shaderMaterial
          ref={halo}
          vertexShader={FRESNEL_VERTEX}
          fragmentShader={FRESNEL_FRAGMENT}
          uniforms={haloUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <Html center position={[0, -0.42, 0]} style={{ pointerEvents: 'none' }} zIndexRange={[10, 0]}>
        <span
          ref={label}
          className="anvl-display select-none whitespace-nowrap text-[10px] tracking-[0.28em] text-[var(--color-heading)]/90"
        >
          {orb.label}
        </span>
      </Html>
    </group>
  )
}
