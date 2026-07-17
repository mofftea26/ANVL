import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { AboutResolvedOrb } from '../content/aboutContent.defaults'
import type { AltarState } from './altarState'
import { ORB_SEAT } from './AltarOrb'

/** Enough shards to draw a legible rectangle when they converge. */
const PARTICLE_COUNT = 620
/** Share of shards assigned to the rect's perimeter (the rest fill it). */
const EDGE_SHARE = 0.68

const BURST_VERTEX = /* glsl */ `
precision highp float;

attribute vec3 aDir;
attribute vec3 aTo;
attribute float aSpread;
attribute float aSize;
attribute float aDelay;

uniform float uT;
uniform float uForm;
uniform float uFormFade;
uniform float uPixelRatio;

varying float vAlpha;

void main() {
  float t = clamp(uT, 0.0, 1.0);
  // Shards fly out fast, ease off, and sag under a little gravity.
  vec3 disperse = aDir * (0.1 + t * 1.9 * aSpread);
  disperse.y -= t * t * 0.6;

  // …then, per-shard staggered, they turn and converge onto the modal rect.
  float f = smoothstep(aDelay * 0.35, aDelay * 0.35 + 0.65, uForm);
  vec3 pos = mix(disperse, aTo, f);

  float burstAlpha = pow(1.0 - t, 1.7);
  vAlpha = mix(burstAlpha, 0.9, f) * (1.0 - uFormFade);

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uPixelRatio * mix(1.0 - 0.55 * t, 0.5, f) * (300.0 / -mv.z);
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
  const targets = new Float32Array(PARTICLE_COUNT * 3)
  const spread = new Float32Array(PARTICLE_COUNT)
  const size = new Float32Array(PARTICLE_COUNT)
  const delay = new Float32Array(PARTICLE_COUNT)

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
    delay[i] = Math.random()
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('aDir', new THREE.BufferAttribute(dirs, 3))
  geo.setAttribute('aTo', new THREE.BufferAttribute(targets, 3))
  geo.setAttribute('aSpread', new THREE.BufferAttribute(spread, 1))
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
  geo.setAttribute('aDelay', new THREE.BufferAttribute(delay, 1))
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
 * Writes formation targets: shards land on the modal panel's rectangle
 * (mostly its perimeter, some interior fill), projected from the measured
 * DOM rect onto the orb-seat plane and expressed in group-local coords.
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
      // Sparse interior fill so the plate reads as a surface, not a wire.
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
 * The strike explosion — the seated orb bursts into a spray of shards plus an
 * expanding shockwave ring, both in the struck orb's own color. Driven by
 * `state.burstT` (GSAP-tweened 0→1 at impact). Once the modal has measured
 * itself (`state.modalNdc` + `formSeq`), `state.formT` pulls the dispersed
 * shards back in to FORM the modal's rectangle; `state.formFade` dissolves
 * them as the real panel materializes inside. Idle frames render nothing.
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
      uT: { value: 0 },
      uForm: { value: 0 },
      uFormFade: { value: 0 },
      uColor: { value: new THREE.Color('#E7E4DF') },
      uPixelRatio: {
        value: typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio, 2),
      },
    }),
    [],
  )

  useFrame(({ camera }) => {
    // Fresh strike measured — aim the shards at the new modal rect.
    if (state.formSeq !== builtSeq.current && state.modalNdc) {
      buildFormTargets(geometry, state.modalNdc, camera)
      builtSeq.current = state.formSeq
    }

    const bursting = state.burstT > 0.001 && state.burstT < 0.999
    const forming = state.formT > 0.001 && state.formFade < 0.999
    const active = bursting || forming

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
      uniforms.uForm.value = state.formT
      uniforms.uFormFade.value = state.formFade
    }
    if (ring.current && ringMaterial.current) {
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
