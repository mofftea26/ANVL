import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { resolveForgeRamp } from '@/shared/lib/forge/emberForge'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import type { AltarState } from './altarState'
import { ORB_RADIUS, ORB_SEAT, ORB_SEAT_SCALE } from './AltarOrb'

/**
 * The site's particle-forge standard (fixed pool, per-seed staggered release):
 * enough embers to read as the orb's own matter as the stone comes apart.
 */
const PARTICLE_COUNT = 2400
/** The seated (shrunken) orb's radius — the embers are born ON this sphere. */
const SPHERE_R = ORB_RADIUS * ORB_SEAT_SCALE * 1.1
/**
 * How far a fully-released ember eases out along its surface normal, in world
 * units: the `0.45 + aSeed * 0.85` reach in `FORGE_VERTEX`'s `hover`, at
 * `aSeed = 1`. **Keep in sync with that expression.**
 */
const SHROUD_REACH = 0.45 + 0.85
/**
 * The shroud's OUTER radius around the seat once the release completes (born on
 * the sphere, then eased out). Exported because the DOM hand-off needs it: the
 * shared ember swarm launches from a ring this wide (projected to screen pixels
 * through the same camera) instead of the engine's much wider default, so the
 * DOM embers appear exactly where these embers are as the two cross-fade.
 */
export const SHROUD_OUTER_RADIUS = SPHERE_R + SHROUD_REACH
/**
 * Paints after the orbs (ORB_RENDER_ORDER = 1) so the glowing shroud is never
 * dimmed by a passing stone, and before the hammer (10) — the hammer stays
 * the top actor even through the disintegration. depthTest is off (the shroud
 * spreads across the stage), so paint order alone decides.
 */
const FORGE_RENDER_ORDER = 5

const FORGE_VERTEX = /* glsl */ `
precision highp float;

attribute vec3 aFrom;
attribute vec3 aDir;
attribute float aSeed;
attribute float aSize;

uniform float uScatter;
uniform float uFade;
uniform float uTime;
uniform float uPixelRatio;

varying float vAlpha;
varying float vSeed;
varying float vGlow;

void main() {
  // DISINTEGRATION (deliberately NOT an explosion): per-seed staggered
  // release — the stone's surface lets go a few embers at a time. Each ember
  // eases a short way outward along its surface normal into a loose hovering
  // shroud around the seat. No radial blast, no shockwave, no gravity sag —
  // the stone quietly comes apart into the app's embers.
  float release = smoothstep(aSeed * 0.5, aSeed * 0.5 + 0.5, uScatter);
  // A WIDE shroud — the freed embers must read across the whole stage, not
  // hug the stone (user-verified: the tight 0.1-0.3 cloud was invisible).
  vec3 hover = aFrom + aDir * release * (0.45 + aSeed * 0.85);
  // Living drift while the shroud hangs — embers, not smoke.
  hover += release * 0.07 * vec3(
    sin(uTime * 1.1 + aSeed * 17.0),
    cos(uTime * 0.9 + aSeed * 23.0),
    sin(uTime * 0.7 + aSeed * 31.0)
  );

  // Heat life (the site's ember ramp): each ember IGNITES as it tears off the
  // stone, and the shroud cools as the disintegration completes.
  float ignite = release * (1.0 - uScatter * 0.3);
  float breath = 0.5 + 0.5 * sin(uTime * (0.55 + aSeed) + aSeed * 12.0);
  vGlow = clamp(ignite * 1.0 + breath * 0.15, 0.0, 1.0);

  // Embers exist only once released — a 1:1 hand-off from the dissolving
  // stone — and cross-fade out as the DOM ember swarm takes the same matter
  // on to form the modal panel (uFade, the hand-off window).
  vAlpha = release * (1.0 - uFade);
  vSeed = aSeed;

  vec4 mv = modelViewMatrix * vec4(hover, 1.0);
  gl_Position = projectionMatrix * mv;
  // Hard cap — a near-camera additive point would rasterize screen-sized.
  float sizePx = aSize * uPixelRatio * (1.0 + vGlow * 0.9) * (300.0 / -mv.z);
  gl_PointSize = min(sizePx, 18.0 * uPixelRatio);
}
`

/** The forge ember look — cold → ember → white-hot ramp with a hot core and
 *  per-seed twinkle (the particle-forge standard). The three stops come from
 *  `resolveForgeRamp`, so they are the struck orb's colour, derived exactly the
 *  way the DOM swarm derives its own — see the component doc below. */
const FORGE_FRAGMENT = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec3 uColdColor;
uniform vec3 uEmberColor;
uniform vec3 uHotColor;

varying float vAlpha;
varying float vSeed;
varying float vGlow;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d2 = dot(uv, uv);
  if (d2 > 0.25) discard;
  float core = smoothstep(0.25, 0.0, d2);
  float twinkle = 0.75 + 0.25 * sin(uTime * (1.5 + vSeed * 3.0) + vSeed * 40.0);
  vec3 base = mix(uColdColor, uEmberColor, 0.3 + 0.7 * vSeed);
  vec3 color = mix(base, uHotColor, vGlow);
  float alpha = core * (0.6 + 0.4 * twinkle) * (0.75 + 0.25 * vGlow) * vAlpha;
  gl_FragColor = vec4(color * (1.25 + twinkle * 0.5 + vGlow * 1.9), alpha);
}
`

function buildForgeGeometry(): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry()
  const positions = new Float32Array(PARTICLE_COUNT * 3)
  const from = new Float32Array(PARTICLE_COUNT * 3)
  const dirs = new Float32Array(PARTICLE_COUNT * 3)
  const seed = new Float32Array(PARTICLE_COUNT)
  const size = new Float32Array(PARTICLE_COUNT)

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // A point on (mostly the shell of) the seated orb's sphere — at rest the
    // pool IS the orb, so the hand-off from the dissolving stone is 1:1.
    const theta = Math.random() * Math.PI * 2
    const cosPhi = Math.random() * 2 - 1
    const sinPhi = Math.sqrt(Math.max(0, 1 - cosPhi * cosPhi))
    const nx = Math.cos(theta) * sinPhi
    const ny = cosPhi
    const nz = Math.sin(theta) * sinPhi
    const r = SPHERE_R * (0.78 + 0.22 * Math.random())
    from[i * 3] = nx * r
    from[i * 3 + 1] = ny * r
    from[i * 3 + 2] = nz * r

    // Loosen direction = the surface normal, slightly buoyant — the freed
    // embers drift a touch upward off the stone, never blasting outward.
    const bx = nx
    const by = ny + 0.15
    const bz = nz
    const bl = Math.hypot(bx, by, bz) || 1
    dirs[i * 3] = bx / bl
    dirs[i * 3 + 1] = by / bl
    dirs[i * 3 + 2] = bz / bl

    seed[i] = Math.random()
    size[i] = 3.4 + Math.random() * 5.2
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('aFrom', new THREE.BufferAttribute(from, 3))
  geo.setAttribute('aDir', new THREE.BufferAttribute(dirs, 3))
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
  return geo
}

/**
 * The struck orb's DISINTEGRATION — the app's particle-forge standard applied
 * to the About altar. At hammer impact the seated palantír comes apart into
 * this fixed pool (each ember is born on the orb's own sphere, so the stone
 * hands its matter over 1:1) and `state.scatterT` releases them, per-seed
 * staggered, into a hovering shroud off the surface.
 *
 * THE POOL STOPS THERE. It does **not** form the modal any more: at the
 * hand-off beat (`ALTAR_FORGE.handoffAfterImpact`) `state.emberFade`
 * cross-fades this shroud out while the DOM ember swarm — the SAME canvas-2D
 * forge that materializes every `<Modal>` and every toast in the app, tinted
 * with the struck orb's colour — streams in from the same screen point and
 * forms the panel (`AboutAltar` mounts `<ForgeEmberCanvas>`; the seat is
 * projected to screen pixels through `state.seatNdc`). The two overlap by
 * design, so it reads as one continuous swarm crossing canvas → DOM.
 *
 * THE SHROUD CARRIES THE STRUCK ORB'S COLOUR. It used to stay on the site's own
 * steel→ember→white-hot tokens on purpose ("never a per-orb neon"), leaving the
 * orb's colour to the DOM half — but the two populations overlap in the same
 * band for 350ms, so that read as the swarm changing hue mid-flight. The three
 * shader stops now come from the same `resolveForgeRamp(tint)` the DOM engine
 * uses, off `state.activeIndex`'s orb, which keeps the near-white hot stop (a
 * tinted-toward-white core) so it still reads as forged metal rather than flat
 * neon. Untinted orbs fall back to the site ramp, exactly as an untinted modal
 * or toast does. Idle frames render nothing; reduced motion renders the pool not
 * at all (the modal simply fades in).
 */
export function AltarModalForge({
  state,
  orbs,
}: {
  state: AltarState
  /** Only each orb's colour is read; structurally typed so this module stays
   *  independent of the About content schema. */
  orbs: readonly { color?: string }[]
}) {
  const points = useRef<THREE.Points>(null)
  const reducedMotion = useReducedMotion()

  const geometry = useMemo(() => buildForgeGeometry(), [])
  useEffect(() => () => geometry.dispose(), [geometry])

  /** The untinted fallback — the site's own ember ramp, resolved once. */
  const siteRamp = useMemo(() => resolveForgeRamp(), [])

  const uniforms = useMemo(
    () => ({
      uScatter: { value: 0 },
      uFade: { value: 0 },
      uTime: { value: 0 },
      // Re-pointed at the struck orb's ramp on every strike (see useFrame).
      uColdColor: { value: new THREE.Color(siteRamp.cold) },
      uEmberColor: { value: new THREE.Color(siteRamp.ember) },
      uHotColor: { value: new THREE.Color(siteRamp.hot) },
      uPixelRatio: {
        value: typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio, 2),
      },
    }),
    [siteRamp],
  )

  /** Whose ramp the uniforms currently hold — `-1` is the site ramp. */
  const rampIndex = useRef(-1)

  useFrame(({ clock }) => {
    // The struck orb is chosen through the mutable state bridge, not through
    // React, so the ramp is re-derived here — once per strike, not per frame.
    if (state.activeIndex !== rampIndex.current) {
      rampIndex.current = state.activeIndex
      const tint = state.activeIndex >= 0 ? orbs[state.activeIndex]?.color?.trim() : undefined
      const ramp = tint ? resolveForgeRamp(tint) : siteRamp
      uniforms.uColdColor.value.set(ramp.cold)
      uniforms.uEmberColor.value.set(ramp.ember)
      uniforms.uHotColor.value.set(ramp.hot)
    }

    // The pool lives from the disintegration until the hand-off cross-fade has
    // fully retired it (or the stage resets on release).
    const active = !reducedMotion && state.scatterT > 0.001 && state.emberFade < 0.999

    if (points.current) {
      points.current.visible = active
      uniforms.uScatter.value = state.scatterT
      uniforms.uFade.value = state.emberFade
      uniforms.uTime.value = clock.elapsedTime
    }
  })

  if (reducedMotion) return null

  return (
    <group position={ORB_SEAT.toArray()}>
      <points
        ref={points}
        geometry={geometry}
        frustumCulled={false}
        visible={false}
        renderOrder={FORGE_RENDER_ORDER}
      >
        <shaderMaterial
          vertexShader={FORGE_VERTEX}
          fragmentShader={FORGE_FRAGMENT}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
