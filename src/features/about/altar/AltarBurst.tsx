import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { AboutResolvedOrb } from '../content/aboutContent.defaults'
import type { AltarState } from './altarState'
import { ORB_RADIUS, ORB_SEAT, ORB_SEAT_SCALE } from './AltarOrb'

/**
 * The site's particle standard (aFrom→aTo + per-seed stagger): enough embers
 * to read as the orb's own matter AND to draw a legible plate when they land.
 */
const PARTICLE_COUNT = 1400
/** Share of embers assigned to the rect's perimeter (the rest fill it). */
const EDGE_SHARE = 0.6
/** The seated (shrunken) orb's radius — the embers are born ON this sphere. */
const SPHERE_R = ORB_RADIUS * ORB_SEAT_SCALE * 1.1

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

void main() {
  // Disperse: the sphere the orb was breaks apart — each ember leaves its
  // surface point along its own radial, sags a little, and hangs drifting.
  float sb = smoothstep(0.0, 1.0, uBurst);
  vec3 scattered = aFrom * (1.0 + sb * 1.4) + aDir * (sb * (0.8 + aSeed * 1.0));
  scattered.y -= sb * sb * 0.45;
  scattered += 0.035 * sb * vec3(
    sin(uTime * 1.3 + aSeed * 17.0),
    cos(uTime * 1.1 + aSeed * 23.0),
    sin(uTime * 0.9 + aSeed * 31.0)
  );

  // …then, per-seed staggered, the swarm turns and FORMS the modal plate.
  float f = smoothstep(aSeed * 0.35, aSeed * 0.35 + 0.65, uForm);
  vec3 pos = mix(scattered, aTo, f);

  // Alive for the whole flight; a soft ember flicker; dissolved by uFormFade
  // as the real panel materializes inside the formed frame.
  float flicker = 0.78 + 0.22 * sin(uTime * (2.0 + aSeed * 3.0) + aSeed * 40.0);
  vAlpha = mix(1.0, 0.92, f) * flicker * (1.0 - uFormFade);

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uPixelRatio * mix(1.0, 0.6, f) * (300.0 / -mv.z);
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
    size[i] = 1.8 + Math.random() * 3.4
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
    arr[i * 3 + 1] = y + (Math.random() - 0.5) * 0.02
    arr[i * 3 + 2] = z + (Math.random() - 0.5) * 0.04
  }
  attr.needsUpdate = true
}

/**
 * The strike's particle life — the site's disperse-and-rearrange embers. At
 * impact the seated palantír EXPLODES INTO this pool (each ember is born on
 * the orb's sphere, so the stone hands its matter over 1:1); `state.burstT`
 * scatters them into a drifting cloud, and once the modal has measured itself
 * (`state.modalNdc` + `formSeq`), `state.formT` staggers the swarm back in to
 * FORM the modal's plate; `state.formFade` dissolves it as the real panel
 * materializes. A shockwave ring marks the impact. Idle frames render nothing.
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
      uColor: { value: new THREE.Color('#E7E4DF') },
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

    // Tint embers + ring with the struck orb's color once per strike.
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
      uniforms.uBurst.value = state.burstT
      uniforms.uForm.value = state.formT
      uniforms.uFormFade.value = state.formFade
      uniforms.uTime.value = clock.elapsedTime
    }
    if (ring.current && ringMaterial.current) {
      const bursting = state.burstT > 0.001 && state.burstT < 0.999
      ring.current.visible = bursting
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
