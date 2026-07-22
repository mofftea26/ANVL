import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { readThemeCssColor } from '@/shared/lib/themeColor'
import type { AboutResolvedOrb } from '../content/aboutContent.defaults'
import type { AltarState } from './altarState'
import { ORB_RADIUS, ORB_SEAT, ORB_SEAT_SCALE } from './AltarOrb'

/**
 * The site's particle standard (aFrom→aTo + per-seed stagger): enough embers
 * to read as the orb's own matter AND to draw a legible plate when they land.
 */
const PARTICLE_COUNT = 2400
/** Share of embers assigned to the rect's perimeter (the rest fill it). */
const EDGE_SHARE = 0.6
/** The seated (shrunken) orb's radius — the embers are born ON this sphere. */
const SPHERE_R = ORB_RADIUS * ORB_SEAT_SCALE * 1.1
/** Molten debris chunks that fly with the embers and die before the gather. */
const SHARD_COUNT = 22

const BURST_VERTEX = /* glsl */ `
precision highp float;

attribute vec3 aFrom;
attribute vec3 aDir;
attribute vec3 aTo;
attribute float aSeed;
attribute float aSize;

uniform float uBurst;
uniform float uForm;
uniform float uFormFade;
uniform float uTime;
uniform float uPixelRatio;

varying float vAlpha;
varying float vSeed;
varying float vGlow;

void main() {
  // Two-phase disperse, so the ORB-ORIGIN reads unmistakably:
  // 1) ERUPTION — the first beats of uBurst are a tight, fast radial blast
  //    straight off the seated orb's sphere (every ember is born ON it), a
  //    clear point-source explosion at the hit point…
  // 2) DRIFT — …which then relaxes into the slower outward spread + sag as
  //    the hanging cloud settles around the anvil.
  float erupt = smoothstep(0.0, 0.35, uBurst);
  float spread = smoothstep(0.22, 1.0, uBurst);
  vec3 scattered = aFrom * (1.0 + erupt * 0.5 + spread * 1.0)
    + aDir * (erupt * erupt * (0.3 + aSeed * 0.25) + spread * (0.6 + aSeed * 0.85));
  scattered.y -= spread * spread * 0.45;

  // The hanging cloud slowly revolves around the anvil — alive, not frozen.
  float drift = uTime * 0.12 * spread;
  float dc = cos(drift);
  float ds = sin(drift);
  scattered = vec3(dc * scattered.x + ds * scattered.z, scattered.y, -ds * scattered.x + dc * scattered.z);
  scattered += 0.04 * spread * vec3(
    sin(uTime * 1.3 + aSeed * 17.0),
    cos(uTime * 1.1 + aSeed * 23.0),
    sin(uTime * 0.9 + aSeed * 31.0)
  );

  // …then, per-seed staggered, the swarm turns and SPIRALS IN to form the
  // modal plate: each ember unwinds its own arc as its radius collapses.
  float f = smoothstep(aSeed * 0.35, aSeed * 0.35 + 0.65, uForm);
  float spiralOn = smoothstep(0.0, 0.18, uForm);
  vec3 d = scattered - aTo;
  float ang = (1.0 - f) * spiralOn * (1.2 + aSeed * 2.6) * (aSeed > 0.5 ? 1.0 : -1.0);
  float c = cos(ang);
  float s = sin(ang);
  vec3 dr = vec3(c * d.x - s * d.y, s * d.x + c * d.y, d.z);
  vec3 pos = aTo + dr * (1.0 - f);

  // Heat life (the site's ember ramp): WHITE-HOT right at the orb as the
  // eruption leaves it (ignition), cooling as the cloud spreads and drifts,
  // re-heating as each ember lands on the forming plate.
  float ignition = (1.0 - erupt) * step(0.0001, uBurst);
  float burstPulse = sin(clamp(uBurst, 0.0, 1.0) * 3.14159265);
  float breath = 0.5 + 0.5 * sin(uTime * (0.55 + aSeed) + aSeed * 12.0);
  vGlow = clamp(ignition + burstPulse * 0.8 + f * 0.55 + breath * 0.12, 0.0, 1.0);

  // Alive for the whole flight; dissolved by uFormFade as the real panel
  // materializes inside the formed frame.
  vAlpha = mix(1.0, 0.92, f) * (1.0 - uFormFade);
  vSeed = aSeed;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  // Hard cap — a near-camera additive point would rasterize screen-sized.
  float sizePx = aSize * uPixelRatio * mix(1.0, 0.6, f) * (1.0 + vGlow * 0.9) * (300.0 / -mv.z);
  gl_PointSize = min(sizePx, 15.0 * uPixelRatio);
}
`

/** The armory / Coming Soon ember look — cold steel → ember → white-hot ramp
 *  with a hot core and per-seed twinkle (the particle-forge standard). */
const BURST_FRAGMENT = /* glsl */ `
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

function buildBurstGeometry(): THREE.BufferGeometry {
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

    // Explosion radial = the surface normal, biased upward — sparks off an anvil.
    const bx = nx
    const by = ny + 0.35
    const bz = nz
    const bl = Math.hypot(bx, by, bz) || 1
    dirs[i * 3] = bx / bl
    dirs[i * 3 + 1] = by / bl
    dirs[i * 3 + 2] = bz / bl

    seed[i] = Math.random()
    size[i] = 2.4 + Math.random() * 4.2
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

interface ShardSpec {
  dir: THREE.Vector3
  speed: number
  axis: THREE.Vector3
  rate: number
  size: number
  phase: number
}

function buildShardSpecs(): ShardSpec[] {
  return Array.from({ length: SHARD_COUNT }, () => {
    const theta = Math.random() * Math.PI * 2
    const up = 0.15 + Math.random() * 0.75
    const dir = new THREE.Vector3(Math.cos(theta), up, Math.sin(theta) * 0.7).normalize()
    return {
      dir,
      speed: 0.9 + Math.random() * 1.5,
      axis: new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5,
      ).normalize(),
      rate: 3 + Math.random() * 7,
      size: 0.028 + Math.random() * 0.05,
      phase: Math.random() * Math.PI * 2,
    }
  })
}

/**
 * Molten debris — a handful of tumbling tetrahedron chunks flung with the
 * embers (the anime "heavy matter" of the explosion). They arc under gravity,
 * tumble, and burn out as the swarm turns toward the plate — only the light
 * embers make the journey.
 */
function BurstShards({ state }: { state: AltarState }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const material = useRef<THREE.MeshBasicMaterial>(null)
  const specs = useMemo(buildShardSpecs, [])
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame(({ clock }) => {
    const m = mesh.current
    if (!m || !material.current) return
    // Shards live from the impact until the gather takes over.
    const die = Math.min(1, Math.max(0, (state.formT - 0.05) / 0.45))
    const active = state.burstT > 0.001 && die < 0.999
    m.visible = active
    if (!active) return
    const b = state.burstT
    const flight = 1 - Math.pow(1 - b, 3)
    for (let i = 0; i < SHARD_COUNT; i++) {
      const spec = specs[i]!
      dummy.position
        .copy(spec.dir)
        .multiplyScalar(flight * spec.speed)
      dummy.position.y -= b * b * 0.55
      dummy.quaternion.setFromAxisAngle(spec.axis, spec.phase + clock.elapsedTime * spec.rate)
      dummy.scale.setScalar(spec.size * (1 - 0.35 * b) * (1 - die))
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
    material.current.opacity = (0.9 - 0.4 * b) * (1 - die)
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, SHARD_COUNT]} frustumCulled={false} visible={false}>
      <tetrahedronGeometry args={[1, 0]} />
      <meshBasicMaterial
        ref={material}
        color={readThemeCssColor('--color-highlight-bright', '#e08a4a')}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  )
}

/**
 * The strike's particle life — the site's disperse-and-rearrange embers. At
 * impact the seated palantír EXPLODES INTO this pool (each ember is born on
 * the orb's sphere, so the stone hands its matter over 1:1); `state.burstT`
 * flings them out with molten shard debris, the hanging cloud slowly revolves,
 * and once the modal has measured itself (`state.modalNdc` + `formSeq`),
 * `state.formT` spirals the swarm back in to FORM the modal's plate;
 * `state.formFade` dissolves it as the real panel materializes. A shockwave
 * ring marks the impact. Idle frames render nothing.
 */
export function AltarBurst({ orbs, state }: { orbs: AboutResolvedOrb[]; state: AltarState }) {
  const points = useRef<THREE.Points>(null)
  const ring = useRef<THREE.Mesh>(null)
  const ringMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const lastColored = useRef(-1)
  const builtSeq = useRef(0)

  const geometry = useMemo(() => buildBurstGeometry(), [])
  useEffect(() => () => geometry.dispose(), [geometry])

  const uniforms = useMemo(
    () => ({
      uBurst: { value: 0 },
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

    // The pool lives from the moment the orb bursts until the formed plate
    // has fully dissolved into the real panel (or the stage resets).
    const active = state.burstT > 0.001 && state.formFade < 0.999

    // The embers stay in the site's heat ramp; only the shockwave ring takes
    // the struck orb's color (the orb's identity survives in the impact).
    if (state.activeIndex >= 0 && state.activeIndex !== lastColored.current) {
      const color = orbs[state.activeIndex]?.color
      if (color) ringMaterial.current?.color.set(color)
      lastColored.current = state.activeIndex
    }
    if (state.activeIndex === -1) lastColored.current = -1

    if (points.current) {
      points.current.visible = active
      uniforms.uBurst.value = state.burstT
      uniforms.uForm.value = state.formT
      uniforms.uFormFade.value = state.formFade
      uniforms.uTime.value = clock.elapsedTime
    }
    if (ring.current && ringMaterial.current) {
      const bursting = state.burstT > 0.001 && state.burstT < 0.999
      ring.current.visible = bursting
      const s = 0.25 + state.burstT * 3.4
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
      <BurstShards state={state} />
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
