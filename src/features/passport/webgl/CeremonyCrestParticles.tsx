import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { gsap } from '@/shared/lib/gsap'
import { readThemeCssColor } from '@/shared/lib/themeColor'
import {
  sampleImageSilhouette,
  type SilhouetteCloud,
} from '@/shared/webgl/particleShapes'
import {
  CEREMONY_CREST_AT,
  CEREMONY_CREST_DURATION,
  CEREMONY_SEAL_AT,
  CEREMONY_SEAL_DURATION,
} from './ceremonyTiming'
import { PASSPORT_FORGE_FRAGMENT, PASSPORT_FORGE_VERTEX } from './passportForgeShaders'

const COUNT = 7_000
/** World size the crest forms at (camera z=5, fov 40 ⇒ ~3.64 tall viewport). */
const CREST_FIT = 1.5
/** The real brand mark — the embers sample ITS pixels, not an approximation. */
const CREST_URL = '/brand/mark.svg'

/**
 * The ceremony's centrepiece (particle-forge standard): embers scattered in the
 * dark gather into the ANVL crest, then vanish INTO the solid seal as it
 * resolves — the DOM seal and this cloud are registered by sampling the same
 * mark and sharing the ceremony clock, so the hand-off reads as one object
 * solidifying rather than two things crossfading.
 */
export function CeremonyCrestParticles() {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const [crest, setCrest] = useState<SilhouetteCloud | null>(null)

  useEffect(() => {
    let cancelled = false
    void sampleImageSilhouette(CREST_URL, COUNT, CREST_FIT, 0.14).then((cloud) => {
      if (!cancelled) setCrest(cloud)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const geometry = useMemo(() => {
    if (!crest) return null
    const scatters = new Float32Array(COUNT * 3)
    const seeds = new Float32Array(COUNT)
    const v = new THREE.Vector3()
    for (let i = 0; i < COUNT; i += 1) {
      // Wide, shallow nebula — the embers drift in from the dark around the
      // piece rather than from a point.
      v.randomDirection().multiplyScalar(2.6 + Math.random() * 3.2)
      scatters.set([v.x * 1.6, v.y * 1.1, v.z * 0.4 - 0.8], i * 3)
      seeds[i] = Math.random()
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(scatters.slice(), 3))
    geo.setAttribute('aFrom', new THREE.BufferAttribute(crest.positions.slice(), 3))
    geo.setAttribute('aTo', new THREE.BufferAttribute(crest.positions.slice(), 3))
    geo.setAttribute('aShadeFrom', new THREE.BufferAttribute(crest.shades.slice(), 1))
    geo.setAttribute('aShadeTo', new THREE.BufferAttribute(crest.shades.slice(), 1))
    geo.setAttribute('aScatter', new THREE.BufferAttribute(scatters, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12)
    return geo
  }, [crest])

  useEffect(() => () => geometry?.dispose(), [geometry])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAssemble: { value: 0 },
      // The morph targets are identical (scatter→crest is uAssemble's job), so
      // the morph stage stays settled at 1.
      uMorph: { value: 1 },
      uZoom: { value: 1 },
      uBurst: { value: 0 },
      uReveal: { value: 0 },
      uSize: { value: 0.12 },
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
    }),
    // Colors read once per mount (the ceremony never re-themes mid-flight).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  // The ceremony clock: gather into the crest, flash, then fuse into the seal.
  useEffect(() => {
    const u = materialRef.current?.uniforms
    if (!u || !crest) return
    const tl = gsap.timeline()
    tl.to(
      u.uAssemble,
      { value: 1, duration: CEREMONY_CREST_DURATION, ease: 'power2.inOut' },
      CEREMONY_CREST_AT,
    )
    tl.fromTo(
      u.uBurst,
      { value: 0.55 },
      { value: 0, duration: 1.3, ease: 'sine.out' },
      CEREMONY_CREST_AT + CEREMONY_CREST_DURATION - 0.35,
    )
    // uReveal = fusion: the cloud condenses and all but vanishes as the solid
    // seal takes its place (never a crossfade of two separate things).
    tl.to(
      u.uReveal,
      { value: 1, duration: CEREMONY_SEAL_DURATION, ease: 'power2.out' },
      CEREMONY_SEAL_AT,
    )
    return () => {
      tl.kill()
    }
  }, [crest])

  useFrame((state) => {
    const u = materialRef.current?.uniforms
    const points = pointsRef.current
    if (!u || !points) return
    u.uTime.value = state.clock.elapsedTime
    // Once fused there is nothing left to draw.
    points.visible = u.uReveal.value < 0.995
  })

  if (!geometry) return null

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <primitive object={geometry} attach="geometry" />
      <shaderMaterial
        ref={materialRef}
        vertexShader={PASSPORT_FORGE_VERTEX}
        fragmentShader={PASSPORT_FORGE_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
