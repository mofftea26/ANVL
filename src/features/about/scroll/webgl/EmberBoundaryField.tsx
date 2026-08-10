import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { gsap } from '@/shared/lib/gsap'
import { resolveForgeRamp } from '@/shared/lib/forge/emberForge'
import {
  normalizeToFit,
  sampleImageSilhouette,
  type SilhouetteCloud,
} from '@/shared/webgl/particleShapes'
import type { AboutScrollMotion } from '../motion/aboutMotionState'
import { ABOUT_SCROLL } from '../motion/aboutScrollTiming'
import { BOUNDARY_FRAGMENT, BOUNDARY_VERTEX } from './emberBoundaryShaders'

/** One fixed pool, morphed in the vertex shader — never resized. */
const PARTICLE_COUNT = 10000
/** Largest dim of a sampled chapter silhouette, world units. */
const CLOUD_FIT = 3.0
/** Slab depth so the cloud reads volumetric as the camera passes. */
const CLOUD_THICKNESS = 0.5
/** How far ahead of the lens a burst stages itself. */
const BURST_AHEAD = 3.5
/** Sampled-cloud cache — adjacent chapters only ever need a few. */
const CACHE_LIMIT = 4

/** What the DOM side tells the field about the chapters' imagery. */
export interface AboutBoundaryChapters {
  heroImage?: string
  images: (string | undefined)[]
  colors: string[]
}

/** Chapterless frames (the marquee, the altar) hand over through a slow ember
 *  ring rather than a picture — always available, never blank. */
function ringCloud(): SilhouetteCloud {
  const positions = new Float32Array(PARTICLE_COUNT * 3)
  const shades = new Float32Array(PARTICLE_COUNT)
  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    const a = Math.random() * Math.PI * 2
    const r = 0.72 + Math.random() * 0.24
    positions.set([Math.cos(a) * r, Math.sin(a) * r * 0.62, 0], i * 3)
    shades[i] = 0.4 + Math.random() * 0.3
  }
  normalizeToFit(positions, CLOUD_FIT * 0.8)
  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    positions[i * 3 + 2] = (Math.random() * 2 - 1) * CLOUD_THICKNESS
  }
  return { positions, shades }
}

/**
 * The film's boundary dissolve — the signature transition. Every chapter
 * crossing (`motion.boundaryBurst` bump) stages a burst just ahead of the
 * lens: the outgoing chapter's backdrop, silhouette-sampled to real pixels,
 * lets go into brand-tinted embers and condenses into the incoming
 * chapter's — while the DOM layers crossfade underneath. Built to the
 * particle-forge standard: one fixed pool, `aFrom→aTo` + per-seed stagger in
 * the vertex shader, the `uMorph`/`uBurst`/`uTime` vocabulary, GSAP scheduled
 * against the `aboutScrollTiming` clock, ramp colors from the incoming orb's
 * own CMS color via `resolveForgeRamp` (site ramp when untinted), additive,
 * `depthWrite: false`, hard-capped point size. Idle frames draw nothing.
 *
 * Clouds sample lazily with a small LRU; a pending or missing image falls
 * back to the ember ring, so a slow CMS asset can never blank a transition.
 */
export function EmberBoundaryField({
  motion,
  chapters,
}: {
  motion: AboutScrollMotion
  chapters: AboutBoundaryChapters
}) {
  const points = useRef<THREE.Points>(null)
  const { camera } = useThree()
  const lastBurst = useRef(0)
  const lastWarmed = useRef(-2)
  const armToken = useRef(0)
  const anim = useRef({ morph: 0, burst: 0 })
  const cache = useRef(new Map<string, Promise<SilhouetteCloud>>())
  const fallback = useMemo(() => ringCloud(), [])
  const siteRamp = useMemo(() => resolveForgeRamp(), [])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const zeros = () => new Float32Array(PARTICLE_COUNT * 3)
    const seed = new Float32Array(PARTICLE_COUNT)
    const size = new Float32Array(PARTICLE_COUNT)
    const shade = () => new Float32Array(PARTICLE_COUNT)
    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      seed[i] = Math.random()
      size[i] = 2.6 + Math.random() * 4.6
    }
    geo.setAttribute('position', new THREE.BufferAttribute(zeros(), 3))
    geo.setAttribute('aFrom', new THREE.BufferAttribute(zeros(), 3))
    geo.setAttribute('aTo', new THREE.BufferAttribute(zeros(), 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    geo.setAttribute('aShadeFrom', new THREE.BufferAttribute(shade(), 1))
    geo.setAttribute('aShadeTo', new THREE.BufferAttribute(shade(), 1))
    return geo
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uBurst: { value: 0 },
      uColdColor: { value: new THREE.Color(siteRamp.cold) },
      uEmberColor: { value: new THREE.Color(siteRamp.ember) },
      uHotColor: { value: new THREE.Color(siteRamp.hot) },
      uPixelRatio: {
        value: typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio, 2),
      },
    }),
    [siteRamp],
  )

  const imageFor = (index: number): string | undefined => {
    if (index === -1) return chapters.heroImage
    return chapters.images[index]
  }

  const getCloud = (url: string | undefined): Promise<SilhouetteCloud> => {
    if (!url) return Promise.resolve(fallback)
    const cached = cache.current.get(url)
    if (cached) return cached
    const promise = sampleImageSilhouette(url, PARTICLE_COUNT, CLOUD_FIT, CLOUD_THICKNESS)
    cache.current.set(url, promise)
    if (cache.current.size > CACHE_LIMIT) {
      const oldest = cache.current.keys().next().value
      if (oldest !== undefined) cache.current.delete(oldest)
    }
    return promise
  }

  const arm = (from: number, to: number) => {
    const token = ++armToken.current
    void Promise.all([getCloud(imageFor(from)), getCloud(imageFor(to))]).then(
      ([fromCloud, toCloud]) => {
        // A newer boundary superseded this one mid-sample — drop it.
        if (token !== armToken.current) return
        const mesh = points.current
        if (!mesh) return
        ;(geometry.getAttribute('aFrom') as THREE.BufferAttribute).copyArray(fromCloud.positions)
        ;(geometry.getAttribute('aTo') as THREE.BufferAttribute).copyArray(toCloud.positions)
        ;(geometry.getAttribute('aShadeFrom') as THREE.BufferAttribute).copyArray(fromCloud.shades)
        ;(geometry.getAttribute('aShadeTo') as THREE.BufferAttribute).copyArray(toCloud.shades)
        for (const name of ['aFrom', 'aTo', 'aShadeFrom', 'aShadeTo'] as const) {
          ;(geometry.getAttribute(name) as THREE.BufferAttribute).needsUpdate = true
        }
        // Stage the burst just ahead of wherever the lens is right now.
        mesh.position.set(0, 0.35, camera.position.z - BURST_AHEAD)
        // The incoming chapter's own color heats the ramp (site ramp default).
        const tint = to >= 0 ? chapters.colors[to]?.trim() : undefined
        const ramp = tint ? resolveForgeRamp(tint) : siteRamp
        uniforms.uColdColor.value.set(ramp.cold)
        uniforms.uEmberColor.value.set(ramp.ember)
        uniforms.uHotColor.value.set(ramp.hot)

        gsap.killTweensOf(anim.current)
        anim.current.morph = 0
        anim.current.burst = 1
        gsap.to(anim.current, {
          morph: 1,
          duration: ABOUT_SCROLL.boundaryMorphS,
          ease: 'power2.inOut',
        })
        gsap.to(anim.current, {
          burst: 0,
          duration: ABOUT_SCROLL.boundaryBurstS,
          ease: 'power2.out',
          delay: ABOUT_SCROLL.boundaryMorphS * 0.35,
        })
      },
    )
  }

  useEffect(() => {
    return () => {
      gsap.killTweensOf(anim.current)
    }
  }, [])

  useFrame(({ clock }) => {
    // Warm the cache for wherever the reader is (and both neighbours), so a
    // boundary's clouds are usually resident before it fires.
    if (motion.chapterIndex !== lastWarmed.current) {
      lastWarmed.current = motion.chapterIndex
      for (const i of [motion.chapterIndex - 1, motion.chapterIndex, motion.chapterIndex + 1]) {
        const url = imageFor(i)
        if (url) void getCloud(url)
      }
    }
    if (motion.boundaryBurst !== lastBurst.current) {
      lastBurst.current = motion.boundaryBurst
      arm(motion.boundaryFrom, motion.boundaryTo)
    }
    const mesh = points.current
    if (!mesh) return
    const active = anim.current.burst > 0.012
    mesh.visible = active
    if (!active) return
    uniforms.uMorph.value = anim.current.morph
    uniforms.uBurst.value = anim.current.burst
    uniforms.uTime.value = clock.elapsedTime
  })

  return (
    <points ref={points} geometry={geometry} frustumCulled={false} visible={false}>
      <shaderMaterial
        vertexShader={BOUNDARY_VERTEX}
        fragmentShader={BOUNDARY_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
