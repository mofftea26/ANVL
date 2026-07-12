import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { gsap } from '@/shared/lib/gsap'
import {
  EMBER_ANVIL_FRAGMENT,
  EMBER_ANVIL_VERTEX,
} from './emberForgeShaders'
import {
  buildBarbell,
  buildShirt,
  sampleMeshSurface,
  sampleSvgSilhouette,
} from './comingSoonShapes'

const ANVIL_GLB = '/about/anvil.glb'
const HAMMER_GLB = '/about/hammer.glb'
const ANVL_MARK_SVG = '/brand/mark.svg'
const ANVL_WORDMARK_SVG = '/brand/wordmark.svg'
const OATH_SVG = '/brand/the-oath-shape.svg'

/**
 * The forms the ember cloud re-forges through, in cycle order. Index 0 (anvil)
 * is the resting shape; a hammer strike advances to the next available one.
 */
export const SHAPE_ORDER = ['anvil', 'anvl', 'wordmark', 'oath', 'shirt', 'barbell', 'hammer'] as const
export type ShapeKey = (typeof SHAPE_ORDER)[number]

export type EmberAnvilHandle = {
  /** Fire the hammer-strike shockwave from a world-space point. */
  strike: (point: THREE.Vector3) => void
  /** Pointer position on the z=0 plane + how energetic it currently is. */
  setPointer: (point: THREE.Vector3, activity: number) => void
  /** Re-forge the cloud into the next shape in {@link SHAPE_ORDER}. */
  cycleShape: () => void
}

/**
 * The centerpiece: an ember-particle cloud that assembles from a scattered
 * nebula into the bundled anvil, breathes and shimmers forever, ignites around
 * the pointer, detonates a radial shockwave on strike — and re-forges through
 * the ANVL crest, The Oath emblem, a compression shirt, a barbell and a hammer
 * on each strike before returning to the anvil. All motion is vertex-shader
 * work; React only drives uniforms and swaps the two morph-target attributes.
 */
export function EmberAnvil({
  count,
  accent,
  handleRef,
  scale = 1,
}: {
  count: number
  accent: string
  /** Imperative bridge the scene uses to feed pointer / strike / morph events. */
  handleRef: React.MutableRefObject<EmberAnvilHandle | null>
  /** Uniform scale of the forged shape — shrunk on small screens so it fits
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
  const { scene: anvilScene } = useGLTF(ANVIL_GLB)
  const { scene: hammerScene } = useGLTF(HAMMER_GLB)

  // The two 3D targets are ready synchronously from the loaded GLBs; the SVG
  // marks and canvas solids fill in asynchronously (see the effect below).
  const anvilTarget = useMemo(
    () => sampleMeshSurface(anvilScene, count),
    [anvilScene, count],
  )
  const hammerTarget = useMemo(
    () => sampleMeshSurface(hammerScene, count),
    [hammerScene, count],
  )

  // Live shape table (indexed by SHAPE_ORDER) + the currently-shown index.
  const shapesRef = useRef<(Float32Array | null)[]>([])
  const indexRef = useRef(0)

  const geometry = useMemo(() => {
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
    // Both morph targets start on the anvil so the entrance forges the anvil.
    geo.setAttribute('position', new THREE.BufferAttribute(anvilTarget.slice(), 3))
    geo.setAttribute('aFrom', new THREE.BufferAttribute(anvilTarget.slice(), 3))
    geo.setAttribute('aTo', new THREE.BufferAttribute(anvilTarget.slice(), 3))
    geo.setAttribute('aScatter', new THREE.BufferAttribute(scatters, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    // The shader displaces freely — a generous static sphere avoids culling.
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 14)
    return geo
  }, [anvilTarget, count])

  const uniforms = useMemo(() => {
    const hot = new THREE.Color(accent)
    const ember = hot.clone().multiplyScalar(0.62)
    const cold = new THREE.Color('#8a857c')
    return {
      uTime: { value: 0 },
      uAssemble: { value: 0 },
      uMorph: { value: 0 },
      uPointer: { value: new THREE.Vector3(0, 0, 99) },
      uPointerActive: { value: 0 },
      uShockCenter: { value: new THREE.Vector3() },
      uShockRadius: { value: 0 },
      uShockAmp: { value: 0 },
      uHeat: { value: 0 },
      // Final on-screen point size ≈ uSize × seed(0.55–1.45) × glow(1–2.4)
      // × (280 / cameraZ≈8.4) device px — 0.155 lands brighter, fuller embers.
      uSize: { value: 0.155 },
      uColdColor: { value: cold },
      uEmberColor: { value: ember },
      uHotColor: { value: hot },
    }
    // Colors are fixed per mount — accent changes remount via key upstream.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => geometry.dispose(), [geometry])

  // Build the morph-target table: 3D GLBs are ready now; the SVG marks and the
  // shirt canvas resolve asynchronously (all cheap, one-time work).
  useEffect(() => {
    let cancelled = false
    // Index order must match SHAPE_ORDER.
    shapesRef.current = [anvilTarget, null, null, null, null, buildBarbell(count), hammerTarget]
    indexRef.current = 0
    ;(async () => {
      try {
        const [mark, wordmark, oath] = await Promise.all([
          sampleSvgSilhouette(ANVL_MARK_SVG, count),
          sampleSvgSilhouette(ANVL_WORDMARK_SVG, count),
          sampleSvgSilhouette(OATH_SVG, count),
        ])
        if (cancelled) return
        shapesRef.current[1] = mark
        shapesRef.current[2] = wordmark
        shapesRef.current[3] = oath
        shapesRef.current[4] = buildShirt(count)
      } catch {
        // Silhouette sourcing failed → those slots stay null and cycleShape
        // simply skips them; the anvil/barbell/hammer morphs still work.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [anvilTarget, hammerTarget, count])

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

  // Imperative bridge for the scene's pointer/strike/morph wiring. Points arrive
  // in world space; the cloud rotates, so convert into its local frame first.
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
      cycleShape: () => {
        const u = materialRef.current?.uniforms
        const geo = pointsRef.current?.geometry as THREE.BufferGeometry | undefined
        const shapes = shapesRef.current
        if (!u || !geo || shapes.length === 0) return

        const from = shapes[indexRef.current]
        // Skip forward over any target that hasn't finished loading yet.
        let next = (indexRef.current + 1) % shapes.length
        let guard = 0
        while (!shapes[next] && guard < shapes.length) {
          next = (next + 1) % shapes.length
          guard += 1
        }
        const to = shapes[next]
        if (!from || !to || next === indexRef.current) return

        const aFrom = geo.getAttribute('aFrom') as THREE.BufferAttribute
        const aTo = geo.getAttribute('aTo') as THREE.BufferAttribute
        ;(aFrom.array as Float32Array).set(from)
        ;(aTo.array as Float32Array).set(to)
        aFrom.needsUpdate = true
        aTo.needsUpdate = true

        gsap.killTweensOf(u.uMorph)
        u.uMorph.value = 0
        gsap.to(u.uMorph, { value: 1, duration: 1.7, ease: 'power2.inOut' })
        // Heat surge sells the re-forge (on top of the strike's own bloom).
        gsap.fromTo(
          u.uHeat,
          { value: 0.7 },
          { value: 0, duration: 1.6, ease: 'power2.out' },
        )
        indexRef.current = next
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
      // Gentle sway that always returns near front-facing — a full continuous
      // spin would turn the flat morphed emblems (crest, oath, shirt) edge-on
      // and unreadable. The parallax still gives the 3D shapes their depth.
      pointsRef.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.28) * 0.16 + state.pointer.x * 0.28
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
useGLTF.preload(HAMMER_GLB)
