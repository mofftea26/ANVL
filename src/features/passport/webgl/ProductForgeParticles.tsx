import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { gsap } from '@/shared/lib/gsap'
import { readThemeCssColor } from '@/shared/lib/themeColor'
import { sampleImageSilhouette, type SilhouetteCloud } from '@/shared/webgl/particleShapes'
import { PASSPORT_FORGE_FRAGMENT, PASSPORT_FORGE_VERTEX } from './passportForgeShaders'

const COUNT = 4_000
/** World height the product silhouette forms at (camera z=5, fov 40). */
const FIT = 3.25

/**
 * A one-shot forge of the product render: embers gather out of the dark into
 * the piece's silhouette, then dissolve as the crisp image is revealed. Plays
 * once on first load (the parent unmounts it after `onComplete`). Particle-
 * forge standard — samples the real image, reuses the passport forge shaders.
 */
export function ProductForgeParticles({
  src,
  onReveal,
  onComplete,
}: {
  src: string
  onReveal: () => void
  onComplete: () => void
}) {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const [cloud, setCloud] = useState<SilhouetteCloud | null>(null)

  useEffect(() => {
    let cancelled = false
    void sampleImageSilhouette(src, COUNT, FIT, 0.12)
      .then((c) => {
        if (!cancelled) setCloud(c)
      })
      .catch(() => {
        // Sampling failed (CORS, decode) — reveal the image immediately.
        if (!cancelled) {
          onReveal()
          onComplete()
        }
      })
    return () => {
      cancelled = true
    }
    // src is stable for the life of this one-shot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  const geometry = useMemo(() => {
    if (!cloud) return null
    const scatters = new Float32Array(COUNT * 3)
    const seeds = new Float32Array(COUNT)
    const v = new THREE.Vector3()
    for (let i = 0; i < COUNT; i += 1) {
      v.randomDirection().multiplyScalar(2.4 + Math.random() * 3.0)
      scatters.set([v.x * 1.4, v.y * 1.2, v.z * 0.4 - 0.6], i * 3)
      seeds[i] = Math.random()
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(scatters.slice(), 3))
    geo.setAttribute('aFrom', new THREE.BufferAttribute(cloud.positions.slice(), 3))
    geo.setAttribute('aTo', new THREE.BufferAttribute(cloud.positions.slice(), 3))
    geo.setAttribute('aShadeFrom', new THREE.BufferAttribute(cloud.shades.slice(), 1))
    geo.setAttribute('aShadeTo', new THREE.BufferAttribute(cloud.shades.slice(), 1))
    geo.setAttribute('aScatter', new THREE.BufferAttribute(scatters, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10)
    return geo
  }, [cloud])

  useEffect(() => () => geometry?.dispose(), [geometry])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAssemble: { value: 0 },
      uMorph: { value: 1 },
      uZoom: { value: 1 },
      uBurst: { value: 0 },
      uReveal: { value: 0 },
      uSize: { value: 0.11 },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useEffect(() => {
    const u = materialRef.current?.uniforms
    if (!u || !cloud) return
    const tl = gsap.timeline()
    // Gather into the silhouette — fast and clean (was ~2.6s total).
    tl.to(u.uAssemble, { value: 1, duration: 0.8, ease: 'power3.out' }, 0.05)
    tl.fromTo(u.uBurst, { value: 0.45 }, { value: 0, duration: 0.7, ease: 'sine.out' }, 0.05)
    // Reveal: the image fades in as the embers dissolve.
    tl.add(onReveal, 0.9)
    tl.to(u.uReveal, { value: 1, duration: 0.45, ease: 'power2.out' }, 0.9)
    tl.add(onComplete, 1.3)
    return () => {
      tl.kill()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloud])

  useFrame((state) => {
    const u = materialRef.current?.uniforms
    const points = pointsRef.current
    if (!u || !points) return
    u.uTime.value = state.clock.elapsedTime
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
