import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { gsap } from '@/shared/lib/gsap'
import { readThemeCssColor } from '@/shared/lib/themeColor'
import {
  sampleImageSilhouette,
  type SilhouetteCloud,
} from '@/shared/webgl/particleShapes'
import type { CeremonyMotionState } from './ceremonyMotionState'
import {
  CEREMONY_DISPERSE_DURATION,
  CEREMONY_REGROUP_AT,
  CEREMONY_REGROUP_DURATION,
  CEREMONY_REVEAL_AT,
  CEREMONY_REVEAL_DURATION,
} from './ceremonyTiming'
import { PASSPORT_FORGE_FRAGMENT, PASSPORT_FORGE_VERTEX } from './passportForgeShaders'

// 3.5k is indistinguishable at crest/product densities and keeps the additive
// overdraw bill low — the ceremony must stay fluid on mid phones.
const COUNT = 3_500
/** The real brand mark — the embers sample ITS pixels, not an approximation. */
const CREST_URL = '/brand/mark.svg'

/**
 * The interactive ceremony forge. Opens with a DISPERSE-IN: the embers drift
 * scattered and assemble into the ANVL crest the moment its silhouette is
 * sampled (no waiting on the product image — that streams into the morph
 * target in the background). Strikes from the DOM pulse the crest; the final
 * strike dissolves it to the scatter cloud, regroups into the piece — sized to
 * MATCH the DOM render (fits are derived from the live viewport, not a fixed
 * world constant) — and dissolves into the crisp image.
 */
export function CeremonyCrestParticles({
  productImageUrl,
  motion,
}: {
  productImageUrl: string | null
  motion: CeremonyMotionState
}) {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { viewport } = useThree()
  const [crest, setCrest] = useState<SilhouetteCloud | null>(null)

  // Fits derived from the live viewport so the ember silhouettes match the
  // DOM: the product render is max-h-[46svh], the crest sits around a fifth.
  const fits = useRef({
    crest: Math.min(viewport.height * 0.24, viewport.width * 0.5),
    product: Math.min(viewport.height * 0.46, viewport.width * 0.72),
  })

  // The crest arrives ALONE — first paint never waits on the product image.
  useEffect(() => {
    let cancelled = false
    void sampleImageSilhouette(CREST_URL, COUNT, fits.current.crest, 0.14).then((cloud) => {
      if (!cancelled) setCrest(cloud)
    })
    return () => {
      cancelled = true
    }
    // One-shot per mount (the ceremony plays once).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const geometry = useMemo(() => {
    if (!crest) return null
    const scatters = new Float32Array(COUNT * 3)
    const seeds = new Float32Array(COUNT)
    const v = new THREE.Vector3()
    for (let i = 0; i < COUNT; i += 1) {
      v.randomDirection().multiplyScalar(2.2 + Math.random() * 2.6)
      scatters.set([v.x * 1.5, v.y * 1.1, v.z * 0.4 - 0.6], i * 3)
      seeds[i] = Math.random()
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(scatters.slice(), 3))
    geo.setAttribute('aFrom', new THREE.BufferAttribute(crest.positions.slice(), 3))
    // Morph target starts as a wide drift; the sampled product replaces it the
    // moment it's ready (usually well before the final strike).
    geo.setAttribute('aTo', new THREE.BufferAttribute(driftCloud(crest).positions, 3))
    geo.setAttribute('aShadeFrom', new THREE.BufferAttribute(crest.shades.slice(), 1))
    geo.setAttribute('aShadeTo', new THREE.BufferAttribute(crest.shades.slice(), 1))
    geo.setAttribute('aScatter', new THREE.BufferAttribute(scatters, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12)
    return geo
  }, [crest])

  useEffect(() => () => geometry?.dispose(), [geometry])

  // Product silhouette streams in on the side and swaps into `aTo` — but only
  // while the morph hasn't started, so nothing ever pops mid-flight.
  useEffect(() => {
    if (!geometry || !productImageUrl) return
    let cancelled = false
    void sampleImageSilhouette(productImageUrl, COUNT, fits.current.product, 0.12)
      .then((cloud) => {
        if (cancelled) return
        const u = materialRef.current?.uniforms
        if (u && u.uMorph.value > 0) return
        const aTo = geometry.getAttribute('aTo') as THREE.BufferAttribute
        const aShadeTo = geometry.getAttribute('aShadeTo') as THREE.BufferAttribute
        ;(aTo.array as Float32Array).set(cloud.positions)
        ;(aShadeTo.array as Float32Array).set(cloud.shades)
        aTo.needsUpdate = true
        aShadeTo.needsUpdate = true
      })
      .catch(() => {
        /* keep the drift fallback */
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geometry])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      // Scattered at mount — the entrance IS a disperse-in.
      uAssemble: { value: 0 },
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

  // Entrance: the scattered embers assemble into the crest (Coming-Soon feel).
  useEffect(() => {
    const u = materialRef.current?.uniforms
    if (!u || !crest) return
    gsap.killTweensOf(u.uAssemble)
    const tween = gsap.to(u.uAssemble, { value: 1, duration: 0.9, ease: 'power2.out' })
    return () => {
      tween.kill()
    }
  }, [crest])

  const seenStrike = useRef(0)
  const begun = useRef(false)
  const forgeTl = useRef<gsap.core.Timeline | null>(null)
  useEffect(
    () => () => {
      forgeTl.current?.kill()
    },
    [],
  )

  useFrame((state) => {
    const u = materialRef.current?.uniforms
    const points = pointsRef.current
    if (!u || !points) return
    u.uTime.value = state.clock.elapsedTime

    // Idle: the crest breathes gently until the forge begins.
    if (!begun.current) {
      u.uZoom.value = 1 + 0.018 * Math.sin(state.clock.elapsedTime * 1.5)
    }

    // A strike from the DOM — pulse the cloud (heat + a slight swell).
    if (motion.strike !== seenStrike.current && !begun.current) {
      seenStrike.current = motion.strike
      gsap.killTweensOf(u.uBurst)
      gsap.fromTo(u.uBurst, { value: 0.5 }, { value: 0, duration: 0.7, ease: 'sine.out' })
      gsap.killTweensOf(u.uZoom)
      gsap.fromTo(
        u.uZoom,
        { value: 1.09 },
        { value: 1, duration: 0.6, ease: 'elastic.out(1, 0.55)' },
      )
    }

    // The final strike — run the forge once, phases strictly in order.
    if (motion.begin && !begun.current && crest) {
      begun.current = true
      gsap.killTweensOf([u.uBurst, u.uZoom, u.uAssemble])
      u.uZoom.value = 1
      const tl = gsap.timeline()
      // Disperse: crest → scatter cloud (sine both ways: no kick, no brake).
      tl.to(u.uAssemble, {
        value: 0,
        duration: CEREMONY_DISPERSE_DURATION,
        ease: 'sine.inOut',
      })
      // While fully dispersed, the target silently becomes the product.
      tl.set(u.uMorph, { value: 1 }, CEREMONY_REGROUP_AT)
      // Regroup: scatter → the piece, landing softly.
      tl.to(
        u.uAssemble,
        { value: 1, duration: CEREMONY_REGROUP_DURATION, ease: 'power2.out' },
        CEREMONY_REGROUP_AT,
      )
      tl.fromTo(
        u.uBurst,
        { value: 0.22 },
        { value: 0, duration: CEREMONY_REGROUP_DURATION, ease: 'sine.out' },
        CEREMONY_REGROUP_AT + 0.15,
      )
      // Reveal: only after the silhouette has fully landed.
      tl.to(
        u.uReveal,
        { value: 1, duration: CEREMONY_REVEAL_DURATION, ease: 'power2.out' },
        CEREMONY_REVEAL_AT,
      )
      forgeTl.current = tl
    }

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

/** Fallback morph target when no product image can be sampled: a soft drift. */
function driftCloud(like: SilhouetteCloud): { positions: Float32Array } {
  const positions = new Float32Array(like.positions.length)
  for (let i = 0; i < like.positions.length / 3; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 6
    positions[i * 3 + 1] = (Math.random() - 0.5) * 4
    positions[i * 3 + 2] = (Math.random() - 0.5) * 1.2
  }
  return { positions }
}
