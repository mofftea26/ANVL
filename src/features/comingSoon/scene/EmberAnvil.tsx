import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { gsap } from '@/shared/lib/gsap'
import {
  EMBER_ANVIL_FRAGMENT,
  EMBER_ANVIL_VERTEX,
} from './emberForgeShaders'

const ANVIL_GLB = '/about/anvil.glb'
/** World size the sampled anvil is normalized to — oversized on purpose so
 *  its shoulders spill beyond the text column, outside the legibility shield,
 *  where they read at full ember brightness. */
const ANVIL_FIT = 3.9

export type EmberAnvilHandle = {
  /** Fire the hammer-strike shockwave from a world-space point. */
  strike: (point: THREE.Vector3) => void
  /** Pointer position on the z=0 plane + how energetic it currently is. */
  setPointer: (point: THREE.Vector3, activity: number) => void
}

type Triangle = { ax: number; ay: number; az: number; bx: number; by: number; bz: number; cx: number; cy: number; cz: number; cumArea: number }

/**
 * Collect every finite, non-degenerate world-space triangle in the GLB.
 * Reads positions through the attribute getters so indexed, non-indexed, and
 * interleaved geometries all work (MeshSurfaceSampler chokes silently on some
 * exporter layouts — NaNs in, nothing on screen).
 */
function collectTriangles(scene: THREE.Object3D): Triangle[] {
  scene.updateMatrixWorld(true)
  const triangles: Triangle[] = []
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  const ab = new THREE.Vector3()
  const ac = new THREE.Vector3()
  let cumArea = 0

  scene.traverse((node) => {
    const mesh = node as THREE.Mesh
    if (!mesh.isMesh) return
    const position = mesh.geometry?.getAttribute('position')
    if (!position) return
    const index = mesh.geometry.getIndex()
    const triCount = (index ? index.count : position.count) / 3
    const vertexAt = (tri: number, corner: number, out: THREE.Vector3) => {
      const i = index ? index.getX(tri * 3 + corner) : tri * 3 + corner
      out.set(position.getX(i), position.getY(i), position.getZ(i))
      out.applyMatrix4(mesh.matrixWorld)
    }
    for (let t = 0; t < triCount; t += 1) {
      vertexAt(t, 0, a)
      vertexAt(t, 1, b)
      vertexAt(t, 2, c)
      const area = ab.subVectors(b, a).cross(ac.subVectors(c, a)).length() / 2
      if (!Number.isFinite(area) || area <= 0) continue
      if (!Number.isFinite(a.x + a.y + a.z + b.x + b.y + b.z + c.x + c.y + c.z)) continue
      cumArea += area
      triangles.push({
        ax: a.x, ay: a.y, az: a.z,
        bx: b.x, by: b.y, bz: b.z,
        cx: c.x, cy: c.y, cz: c.z,
        cumArea,
      })
    }
  })
  return triangles
}

/** Area-weighted surface sampling of `count` points across the anvil GLB. */
function sampleAnvilSurface(scene: THREE.Object3D, count: number): Float32Array {
  const out = new Float32Array(count * 3)
  const triangles = collectTriangles(scene)

  if (triangles.length === 0) {
    // Defensive: an empty/atypical GLB degrades to a sphere, never a crash.
    const v = new THREE.Vector3()
    for (let i = 0; i < count; i += 1) {
      v.randomDirection().multiplyScalar(1.4 + Math.random() * 0.1)
      out.set([v.x, v.y, v.z], i * 3)
    }
    return out
  }

  const totalArea = triangles[triangles.length - 1].cumArea
  const pickTriangle = (r: number): Triangle => {
    // Binary search the cumulative-area table.
    let lo = 0
    let hi = triangles.length - 1
    const needle = r * totalArea
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (triangles[mid].cumArea < needle) lo = mid + 1
      else hi = mid
    }
    return triangles[lo]
  }

  for (let i = 0; i < count; i += 1) {
    const tri = pickTriangle(Math.random())
    // Uniform barycentric point.
    let u = Math.random()
    let v = Math.random()
    if (u + v > 1) {
      u = 1 - u
      v = 1 - v
    }
    const w = 1 - u - v
    out[i * 3] = tri.ax * w + tri.bx * u + tri.cx * v
    out[i * 3 + 1] = tri.ay * w + tri.by * u + tri.cy * v
    out[i * 3 + 2] = tri.az * w + tri.bz * u + tri.cz * v
  }

  // Normalize: center on origin, fit to ANVIL_FIT world units.
  const box = new THREE.Box3()
  const v = new THREE.Vector3()
  for (let i = 0; i < count; i += 1) {
    box.expandByPoint(v.fromArray(out, i * 3))
  }
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const scale = ANVIL_FIT / (Math.max(size.x, size.y, size.z) || 1)
  for (let i = 0; i < count; i += 1) {
    out[i * 3] = (out[i * 3] - center.x) * scale
    out[i * 3 + 1] = (out[i * 3 + 1] - center.y) * scale
    out[i * 3 + 2] = (out[i * 3 + 2] - center.z) * scale
  }
  return out
}

/**
 * The centerpiece: the bundled About-altar anvil, forged out of `count` GPU
 * ember particles. Assembles from a scattered nebula on mount, breathes and
 * shimmers forever, ignites around the pointer, and detonates a radial
 * shockwave on strike. All motion is vertex-shader work; React only drives
 * uniforms.
 */
export function EmberAnvil({
  count,
  accent,
  handleRef,
  scale = 1,
}: {
  count: number
  accent: string
  /** Imperative bridge the scene uses to feed pointer + strike events. */
  handleRef: React.MutableRefObject<EmberAnvilHandle | null>
  /** Uniform scale of the forged anvil — shrunk on small screens so it fits
   *  the viewport. Pointer/strike coords stay correct: they convert through
   *  `worldToLocal`, which accounts for this scale. */
  scale?: number
}) {
  const pointsRef = useRef<THREE.Points>(null)
  // All runtime mutation goes through the mounted material's uniform slots —
  // R3F/three does not preserve the identity of the `uniforms` prop object
  // (see DustField for the same pattern), so tweening the memoized object
  // would silently animate nothing.
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { scene } = useGLTF(ANVIL_GLB)

  const geometry = useMemo(() => {
    const targets = sampleAnvilSurface(scene, count)
    const scatters = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    const v = new THREE.Vector3()
    for (let i = 0; i < count; i += 1) {
      // Scatter cloud: a wide nebula kept WELL behind the camera plane
      // (camera z ≈ 8.4) — points near z=0 in view space rasterize huge.
      v.randomDirection().multiplyScalar(4.5 + Math.random() * 4.5)
      scatters.set([v.x * 1.5, v.y, v.z * 0.45 - 1.2], i * 3)
      seeds[i] = Math.random()
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(targets.slice(), 3))
    geo.setAttribute('aTarget', new THREE.BufferAttribute(targets, 3))
    geo.setAttribute('aScatter', new THREE.BufferAttribute(scatters, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    // The shader displaces freely — a generous static sphere avoids culling.
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 14)
    return geo
  }, [scene, count])

  const uniforms = useMemo(() => {
    const hot = new THREE.Color(accent)
    const ember = hot.clone().multiplyScalar(0.62)
    const cold = new THREE.Color('#8a857c')
    return {
      uTime: { value: 0 },
      uAssemble: { value: 0 },
      uPointer: { value: new THREE.Vector3(0, 0, 99) },
      uPointerActive: { value: 0 },
      uShockCenter: { value: new THREE.Vector3() },
      uShockRadius: { value: 0 },
      uShockAmp: { value: 0 },
      uHeat: { value: 0 },
      // Final on-screen point size ≈ uSize × seed(0.55–1.45) × glow(1–2.4)
      // × (280 / cameraZ≈8.4) device px — 0.13 lands fine 2–6px embers.
      uSize: { value: 0.13 },
      uColdColor: { value: cold },
      uEmberColor: { value: ember },
      uHotColor: { value: hot },
    }
    // Colors are fixed per mount — accent changes remount via key upstream.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    geometry.getAttribute('position')
    return () => geometry.dispose()
  }, [geometry])

  // Entrance: forge the nebula into the anvil, with a heat bloom at landing.
  useEffect(() => {
    const u = materialRef.current?.uniforms
    if (!u) return
    const tl = gsap.timeline({ delay: 0.35 })
    tl.to(u.uAssemble, { value: 1, duration: 2.8, ease: 'power2.inOut' })
    tl.fromTo(
      u.uHeat,
      { value: 0 },
      { value: 0.55, duration: 0.5, ease: 'power2.in' },
      '-=0.55',
    )
    tl.to(u.uHeat, { value: 0, duration: 1.4, ease: 'power2.out' })
    return () => {
      tl.kill()
    }
  }, [])

  // Imperative bridge for the scene's pointer/strike wiring. Points arrive in
  // world space; the cloud rotates, so convert into its local frame first.
  useEffect(() => {
    const target = handleRef
    const local = new THREE.Vector3()
    const toLocal = (point: THREE.Vector3) => {
      local.copy(point)
      pointsRef.current?.worldToLocal(local)
      return local
    }
    target.current = {
      setPointer: (point, activity) => {
        const u = materialRef.current?.uniforms
        if (!u) return
        ;(u.uPointer.value as THREE.Vector3).lerp(toLocal(point), 0.2)
        u.uPointerActive.value = activity
      },
      strike: (point) => {
        const u = materialRef.current?.uniforms
        if (!u) return
        ;(u.uShockCenter.value as THREE.Vector3).copy(toLocal(point))
        gsap.killTweensOf([u.uShockRadius, u.uShockAmp])
        u.uShockRadius.value = 0
        u.uShockAmp.value = 1
        gsap.to(u.uShockRadius, { value: 8, duration: 1.15, ease: 'power2.out' })
        gsap.to(u.uShockAmp, { value: 0, duration: 1.3, ease: 'power3.out' })
        gsap.fromTo(
          u.uHeat,
          { value: 0.85 },
          { value: 0, duration: 1.0, ease: 'power2.out' },
        )
      },
    }
    return () => {
      target.current = null
    }
  }, [handleRef])

  useFrame((state) => {
    const u = materialRef.current?.uniforms
    if (u) {
      u.uTime.value = state.clock.elapsedTime
      // Pointer energy cools off on its own so idle scenes settle.
      u.uPointerActive.value = (u.uPointerActive.value as number) * 0.96
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y =
        state.clock.elapsedTime * 0.1 + state.pointer.x * 0.3
    }
  })

  return (
    <points ref={pointsRef} position={[0, -0.35, 0]} scale={scale} frustumCulled={false}>
      <primitive object={geometry} attach="geometry" />
      <shaderMaterial
        ref={materialRef}
        vertexShader={EMBER_ANVIL_VERTEX}
        fragmentShader={EMBER_ANVIL_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

useGLTF.preload(ANVIL_GLB)
