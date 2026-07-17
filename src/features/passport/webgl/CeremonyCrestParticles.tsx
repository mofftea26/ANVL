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
  CEREMONY_CREST_HOLD,
  CEREMONY_MORPH_DURATION,
  CEREMONY_REVEAL_AT,
  CEREMONY_REVEAL_DURATION,
} from './ceremonyTiming'
import { PASSPORT_FORGE_FRAGMENT, PASSPORT_FORGE_VERTEX } from './passportForgeShaders'

const COUNT = 5_000
/** World sizes (camera z=5, fov 40 ⇒ ~3.64 tall viewport). */
const CREST_FIT = 1.6
const PRODUCT_FIT = 3.1
/** The real brand mark — the embers sample ITS pixels, not an approximation. */
const CREST_URL = '/brand/mark.svg'

/**
 * The ceremony forge: the ANVL crest stands in embers for half a second, the
 * embers disperse (a burst mid-morph), then reassemble into the registered
 * piece's silhouette — sampled from the real product image — and finally
 * dissolve into the crisp DOM render. One buffer, one morph: `aFrom` = crest,
 * `aTo` = product, with the shader's per-seed stagger + uBurst supplying the
 * disperse-and-recollect in between.
 */
export function CeremonyCrestParticles({ productImageUrl }: { productImageUrl: string | null }) {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const [shapes, setShapes] = useState<{ crest: SilhouetteCloud; product: SilhouetteCloud } | null>(
    null,
  )

  useEffect(() => {
    let cancelled = false
    const crestP = sampleImageSilhouette(CREST_URL, COUNT, CREST_FIT, 0.14)
    // No product image (or sampling fails) → the crest disperses into a wide
    // drift instead; the DOM still resolves the plate + button on the clock.
    const productP = productImageUrl
      ? sampleImageSilhouette(productImageUrl, COUNT, PRODUCT_FIT, 0.12).catch(() => null)
      : Promise.resolve(null)
    void Promise.all([crestP, productP]).then(([crest, product]) => {
      if (cancelled) return
      setShapes({ crest, product: product ?? driftCloud(crest) })
    })
    return () => {
      cancelled = true
    }
    // One-shot per mount (the ceremony plays once).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const geometry = useMemo(() => {
    if (!shapes) return null
    const scatters = new Float32Array(COUNT * 3)
    const seeds = new Float32Array(COUNT)
    const v = new THREE.Vector3()
    for (let i = 0; i < COUNT; i += 1) {
      v.randomDirection().multiplyScalar(2.2 + Math.random() * 2.6)
      scatters.set([v.x * 1.5, v.y * 1.1, v.z * 0.4 - 0.6], i * 3)
      seeds[i] = Math.random()
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(shapes.crest.positions.slice(), 3))
    geo.setAttribute('aFrom', new THREE.BufferAttribute(shapes.crest.positions.slice(), 3))
    geo.setAttribute('aTo', new THREE.BufferAttribute(shapes.product.positions.slice(), 3))
    geo.setAttribute('aShadeFrom', new THREE.BufferAttribute(shapes.crest.shades.slice(), 1))
    geo.setAttribute('aShadeTo', new THREE.BufferAttribute(shapes.product.shades.slice(), 1))
    geo.setAttribute('aScatter', new THREE.BufferAttribute(scatters, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12)
    return geo
  }, [shapes])

  useEffect(() => () => geometry?.dispose(), [geometry])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      // Fully assembled from frame one — the crest is simply PRESENT.
      uAssemble: { value: 1 },
      uMorph: { value: 0 },
      uZoom: { value: 1 },
      uBurst: { value: 0 },
      uReveal: { value: 0 },
      uSize: { value: 0.115 },
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

  // The ceremony clock: hold the crest, then one continuous
  // disperse-and-reassemble into the piece, then dissolve into the DOM image.
  useEffect(() => {
    const u = materialRef.current?.uniforms
    if (!u || !shapes) return
    const tl = gsap.timeline()
    tl.to(
      u.uMorph,
      { value: 1, duration: CEREMONY_MORPH_DURATION, ease: 'power2.inOut' },
      CEREMONY_CREST_HOLD,
    )
    // The burst peaks early in the morph — that's the visible disperse —
    // and decays as the embers land in the silhouette.
    tl.fromTo(
      u.uBurst,
      { value: 0.85 },
      { value: 0, duration: CEREMONY_MORPH_DURATION, ease: 'sine.out' },
      CEREMONY_CREST_HOLD + 0.05,
    )
    tl.to(
      u.uReveal,
      { value: 1, duration: CEREMONY_REVEAL_DURATION, ease: 'power2.out' },
      CEREMONY_REVEAL_AT,
    )
    return () => {
      tl.kill()
    }
  }, [shapes])

  useFrame((state) => {
    const u = materialRef.current?.uniforms
    const points = pointsRef.current
    if (!u || !points) return
    u.uTime.value = state.clock.elapsedTime
    // Once dissolved there is nothing left to draw.
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

/** Fallback target when no product image can be sampled: a soft wide drift. */
function driftCloud(like: SilhouetteCloud): SilhouetteCloud {
  const positions = new Float32Array(like.positions.length)
  const shades = new Float32Array(like.shades.length)
  for (let i = 0; i < shades.length; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 6
    positions[i * 3 + 1] = (Math.random() - 0.5) * 4
    positions[i * 3 + 2] = (Math.random() - 0.5) * 1.2
    shades[i] = 0.25 + Math.random() * 0.2
  }
  return { positions, shades }
}
