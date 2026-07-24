import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { readThemeCssColor } from '@/shared/lib/themeColor'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import type { AltarState } from './altarState'
import { ORB_RADIUS, ORB_SEAT, ORB_SEAT_SCALE } from './AltarOrb'

/**
 * The site's particle-forge standard (fixed pool, aFrom→aTo vertex morph,
 * per-seed stagger): enough embers to read as the orb's own matter AND to
 * draw a legible plate when they land on the modal's rectangle.
 */
const PARTICLE_COUNT = 2400
/** Share of embers assigned to the rect's perimeter (the rest fill it). */
const EDGE_SHARE = 0.6
/** The seated (shrunken) orb's radius — the embers are born ON this sphere. */
const SPHERE_R = ORB_RADIUS * ORB_SEAT_SCALE * 1.1
/**
 * Paints after the orbs (ORB_RENDER_ORDER = 1) so the glowing stream is never
 * dimmed by a passing stone, and before the hammer (10) — the hammer stays
 * the top actor even through the formation. depthTest is off (the stream
 * crosses the whole stage), so paint order alone decides.
 */
const FORGE_RENDER_ORDER = 5

const FORGE_VERTEX = /* glsl */ `
precision highp float;

attribute vec3 aFrom;
attribute vec3 aDir;
attribute vec3 aTo;
attribute float aSeed;
attribute float aSize;

uniform float uScatter;
uniform float uForm;
uniform float uFormFade;
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

  // FORMATION: per-seed staggered spiral onto the modal plate (the same
  // aFrom→aTo morph vocabulary as the passport/Coming Soon forges) — each
  // ember unwinds its own arc as its radius collapses onto its plate target.
  float f = smoothstep(aSeed * 0.35, aSeed * 0.35 + 0.65, uForm);
  float spiralOn = smoothstep(0.0, 0.18, uForm);
  vec3 d = hover - aTo;
  float ang = (1.0 - f) * spiralOn * (1.2 + aSeed * 2.6) * (aSeed > 0.5 ? 1.0 : -1.0);
  float c = cos(ang);
  float s = sin(ang);
  vec3 dr = vec3(c * d.x - s * d.y, s * d.x + c * d.y, d.z);
  vec3 pos = aTo + dr * (1.0 - f);

  // Heat life (the site's ember ramp): each ember IGNITES as it tears off the
  // stone, the shroud cools as the disintegration completes, and embers
  // re-heat as they land on the forming plate.
  float ignite = release * (1.0 - uScatter * 0.3);
  float breath = 0.5 + 0.5 * sin(uTime * (0.55 + aSeed) + aSeed * 12.0);
  vGlow = clamp(ignite * 1.0 + f * 0.9 + breath * 0.15, 0.0, 1.0);

  // Embers exist only once released — a 1:1 hand-off from the dissolving
  // stone — and dissolve away as the real panel materializes over the plate.
  vAlpha = release * (1.0 - uFormFade);
  vSeed = aSeed;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  // Hard cap — a near-camera additive point would rasterize screen-sized.
  float sizePx = aSize * uPixelRatio * mix(1.0, 0.7, f) * (1.0 + vGlow * 0.9) * (300.0 / -mv.z);
  gl_PointSize = min(sizePx, 18.0 * uPixelRatio);
}
`

/** The armory / Coming Soon ember look — cold steel → ember → white-hot ramp
 *  with a hot core and per-seed twinkle (the particle-forge standard). */
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
  const targets = new Float32Array(PARTICLE_COUNT * 3)
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
  geo.setAttribute('aTo', new THREE.BufferAttribute(targets, 3))
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
  return geo
}

/** Where a ray from the camera through an NDC point crosses the seat plane. */
function ndcToSeatPlane(
  ndcX: number,
  ndcY: number,
  camera: THREE.Camera,
  out: THREE.Vector3,
): THREE.Vector3 {
  out.set(ndcX, ndcY, 0.5).unproject(camera)
  out.sub(camera.position).normalize()
  const t = (ORB_SEAT.z - camera.position.z) / out.z
  return out.multiplyScalar(t).add(camera.position)
}

/**
 * Writes formation targets: embers land on the modal panel's rectangle
 * (its perimeter plus an interior fill so the plate reads as a surface),
 * projected from the measured DOM rect onto the orb-seat plane and expressed
 * in group-local coords.
 */
function buildFormTargets(
  geometry: THREE.BufferGeometry,
  ndc: { x0: number; y0: number; x1: number; y1: number },
  camera: THREE.Camera,
) {
  const attr = geometry.getAttribute('aTo') as THREE.BufferAttribute
  const arr = attr.array as Float32Array
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  ndcToSeatPlane(ndc.x0, ndc.y0, camera, a)
  ndcToSeatPlane(ndc.x1, ndc.y1, camera, b)
  const minX = a.x - ORB_SEAT.x
  const minY = a.y - ORB_SEAT.y
  const w = b.x - a.x
  const h = b.y - a.y
  const z = a.z - ORB_SEAT.z

  const edgeCount = Math.floor(PARTICLE_COUNT * EDGE_SHARE)
  const perimeter = 2 * (Math.abs(w) + Math.abs(h))
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    let x: number
    let y: number
    if (i < edgeCount) {
      // Walk the perimeter at an even pace (with a little jitter).
      let d = ((i + Math.random() * 0.8) / edgeCount) * perimeter
      const aw = Math.abs(w)
      const ah = Math.abs(h)
      if (d < aw) {
        x = d
        y = 0
      } else if (d < aw + ah) {
        x = aw
        y = d - aw
      } else if (d < aw * 2 + ah) {
        d -= aw + ah
        x = aw - d
        y = ah
      } else {
        d -= aw * 2 + ah
        x = 0
        y = ah - d
      }
      x = minX + Math.sign(w) * x
      y = minY + Math.sign(h) * y
    } else {
      // Interior fill so the plate reads as a surface, not a wire.
      x = minX + w * Math.random()
      y = minY + h * Math.random()
    }
    arr[i * 3] = x + (Math.random() - 0.5) * 0.02
    arr[i * 3 + 1] = y + (Math.random() - 0.5) * 0.04
    arr[i * 3 + 2] = z + (Math.random() - 0.5) * 0.04
  }
  attr.needsUpdate = true
}

/**
 * The orb → modal formation — the app's particle-forge standard applied to
 * the About modal (replacing the old explosion/shockwave burst). At hammer
 * impact the seated palantír DISINTEGRATES into this fixed pool (each ember
 * is born on the orb's sphere, so the stone hands its matter over 1:1);
 * `state.scatterT` releases them, per-seed staggered, into a hovering shroud;
 * once the modal has measured itself (`state.modalNdc` + `formSeq`),
 * `state.formT` spirals the SAME embers in to FORM the modal's plate, and
 * `state.formFade` dissolves them as the real panel materializes. Brand-token
 * ember colors only. Idle frames render nothing; reduced motion renders the
 * pool not at all (the modal simply fades — see AboutAltar's measure branch).
 */
export function AltarModalForge({ state }: { state: AltarState }) {
  const points = useRef<THREE.Points>(null)
  const builtSeq = useRef(0)
  const reducedMotion = useReducedMotion()

  const geometry = useMemo(() => buildForgeGeometry(), [])
  useEffect(() => () => geometry.dispose(), [geometry])

  const uniforms = useMemo(
    () => ({
      uScatter: { value: 0 },
      uForm: { value: 0 },
      uFormFade: { value: 0 },
      uTime: { value: 0 },
      // The site ember palette (theme tokens, read on mount) — the same ramp
      // as the passport/Coming Soon forges, never a per-orb neon.
      uColdColor: {
        value: new THREE.Color(readThemeCssColor('--color-surface-elevated', '#34373A')).lerp(
          new THREE.Color(readThemeCssColor('--color-heading', '#E7E4DF')),
          0.35,
        ),
      },
      uEmberColor: { value: new THREE.Color(readThemeCssColor('--color-highlight', '#c2703d')) },
      uHotColor: {
        value: new THREE.Color(readThemeCssColor('--color-highlight-bright', '#e08a4a')),
      },
      uPixelRatio: {
        value: typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio, 2),
      },
    }),
    [],
  )

  useFrame(({ camera, clock }) => {
    // Fresh strike measured — aim the embers at the new modal rect.
    if (state.formSeq !== builtSeq.current && state.modalNdc) {
      buildFormTargets(geometry, state.modalNdc, camera)
      builtSeq.current = state.formSeq
    }

    // The pool lives from the disintegration until the formed plate has fully
    // dissolved into the real panel (or the stage resets on release).
    const active = !reducedMotion && state.scatterT > 0.001 && state.formFade < 0.999

    if (points.current) {
      points.current.visible = active
      uniforms.uScatter.value = state.scatterT
      uniforms.uForm.value = state.formT
      uniforms.uFormFade.value = state.formFade
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
