import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { gsap } from '@/shared/lib/gsap'
import { readThemeCssColor } from '@/shared/lib/themeColor'
import {
  sampleImageSilhouette,
  type SilhouetteCloud,
} from '@/shared/webgl/particleShapes'
import type { PassportMotionState } from './passportMotionState'
import {
  PASSPORT_ASSEMBLE_DURATION,
  PASSPORT_ENTRY_DELAY,
  PASSPORT_SHATTER_HOLD,
  PASSPORT_SHATTER_IN,
  PASSPORT_SHATTER_OUT,
} from './passportForgeTiming'
import { PASSPORT_FORGE_FRAGMENT, PASSPORT_FORGE_VERTEX } from './passportForgeShaders'

const COUNT = 11_000
/** World height the formed piece is normalized to (camera z=5, fov 40 ⇒ ~3.64 tall). */
export const PASSPORT_PIECE_FIT = 2.5
/** Silhouette fallback when no transparent render exists — the ANVL mark. */
const FALLBACK_SILHOUETTE_URL = '/brand/mark.svg'

/**
 * The passport console centerpiece (particle-forge standard). The claimed
 * piece's silhouette assembles out of an ember nebula on the left stage and
 * fuses into the DOM render; every section transition shatters the form
 * across the whole screen and re-forges it while the DOM swaps content.
 */
export function PassportForgeParticles({
  motion,
  imageUrl,
}: {
  motion: PassportMotionState
  imageUrl: string | null
}) {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { viewport, size } = useThree()

  const [silhouette, setSilhouette] = useState<SilhouetteCloud | null>(null)
  useEffect(() => {
    let cancelled = false
    void sampleImageSilhouette(
      imageUrl ?? FALLBACK_SILHOUETTE_URL,
      COUNT,
      PASSPORT_PIECE_FIT,
      0.22,
    ).then((cloud) => {
      if (!cancelled) setSilhouette(cloud)
    })
    return () => {
      cancelled = true
    }
  }, [imageUrl])

  // Screen-filling shatter cloud — the transition target: a soft veil drifting
  // across the whole page (positions are in the points' local space, so the
  // spread is generous enough to cover the viewport at any stage scale).
  const shatterCloud = useMemo<SilhouetteCloud>(() => {
    const positions = new Float32Array(COUNT * 3)
    const shades = new Float32Array(COUNT)
    const w = Math.max(viewport.width, 6)
    const h = Math.max(viewport.height, 4)
    for (let i = 0; i < COUNT; i += 1) {
      positions[i * 3] = (Math.random() - 0.3) * w * 1.5
      positions[i * 3 + 1] = (Math.random() - 0.5) * h * 1.25
      positions[i * 3 + 2] = (Math.random() - 0.7) * 1.4
      shades[i] = 0.3 + Math.random() * 0.3
    }
    return { positions, shades }
  }, [viewport.width, viewport.height])

  const geometry = useMemo(() => {
    if (!silhouette) return null
    const scatters = new Float32Array(COUNT * 3)
    const seeds = new Float32Array(COUNT)
    const v = new THREE.Vector3()
    for (let i = 0; i < COUNT; i += 1) {
      v.randomDirection().multiplyScalar(3.2 + Math.random() * 3.4)
      scatters.set([v.x * 1.5, v.y * 0.9, v.z * 0.5 - 1.4], i * 3)
      seeds[i] = Math.random()
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(silhouette.positions.slice(), 3))
    geo.setAttribute('aFrom', new THREE.BufferAttribute(silhouette.positions.slice(), 3))
    geo.setAttribute('aTo', new THREE.BufferAttribute(silhouette.positions.slice(), 3))
    geo.setAttribute('aShadeFrom', new THREE.BufferAttribute(silhouette.shades.slice(), 1))
    geo.setAttribute('aShadeTo', new THREE.BufferAttribute(silhouette.shades.slice(), 1))
    geo.setAttribute('aScatter', new THREE.BufferAttribute(scatters, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 16)
    return geo
  }, [silhouette])

  useEffect(() => () => geometry?.dispose(), [geometry])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAssemble: { value: 0 },
      uMorph: { value: 0 },
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
    // Colors read once per mount (theme changes remount the canvas).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  /** Swap morph buffers to `target` and tween uMorph 0→1 with a burst. */
  const forgeTo = (
    target: SilhouetteCloud,
    burst: number,
    duration: number,
    ease: string = 'power2.inOut',
  ) => {
    const u = materialRef.current?.uniforms
    const geo = pointsRef.current?.geometry as THREE.BufferGeometry | undefined
    if (!u || !geo) return
    const aFrom = geo.getAttribute('aFrom') as THREE.BufferAttribute
    const aTo = geo.getAttribute('aTo') as THREE.BufferAttribute
    const aShadeFrom = geo.getAttribute('aShadeFrom') as THREE.BufferAttribute
    const aShadeTo = geo.getAttribute('aShadeTo') as THREE.BufferAttribute
    if (u.uMorph.value >= 0.999) {
      ;(aFrom.array as Float32Array).set(aTo.array as Float32Array)
      aFrom.needsUpdate = true
      ;(aShadeFrom.array as Float32Array).set(aShadeTo.array as Float32Array)
      aShadeFrom.needsUpdate = true
    }
    ;(aTo.array as Float32Array).set(target.positions)
    aTo.needsUpdate = true
    ;(aShadeTo.array as Float32Array).set(target.shades)
    aShadeTo.needsUpdate = true
    gsap.killTweensOf(u.uMorph)
    u.uMorph.value = 0
    gsap.to(u.uMorph, { value: 1, duration, ease })
    gsap.killTweensOf(u.uBurst)
    gsap.fromTo(u.uBurst, { value: burst }, { value: 0, duration: 1.6, ease: 'sine.out' })
  }
  const forgeToRef = useRef(forgeTo)
  forgeToRef.current = forgeTo

  // Entry: nebula → silhouette, on the shared clock.
  useEffect(() => {
    const u = materialRef.current?.uniforms
    if (!u || !silhouette) return
    const tl = gsap.timeline({ delay: PASSPORT_ENTRY_DELAY })
    tl.to(u.uAssemble, {
      value: 1,
      duration: PASSPORT_ASSEMBLE_DURATION,
      ease: 'power2.inOut',
    })
    tl.fromTo(
      u.uBurst,
      { value: 0.5 },
      { value: 0, duration: 1.2, ease: 'power2.out' },
      PASSPORT_ASSEMBLE_DURATION - 0.5,
    )
    return () => {
      tl.kill()
    }
  }, [silhouette])

  // Section transitions: shatter across the screen, hold, re-forge.
  const seenShatter = useRef(0)
  const shatterTl = useRef<gsap.core.Timeline | null>(null)
  useEffect(
    () => () => {
      shatterTl.current?.kill()
    },
    [],
  )

  useFrame((state) => {
    const u = materialRef.current?.uniforms
    const points = pointsRef.current
    if (!u || !points || !silhouette) return
    u.uTime.value = state.clock.elapsedTime

    if (motion.shatter !== seenShatter.current) {
      seenShatter.current = motion.shatter
      shatterTl.current?.kill()
      // Soft veil: drift out with a whisper of heat, breathe back in.
      const tl = gsap.timeline()
      tl.call(
        () => forgeToRef.current(shatterCloud, 0.35, PASSPORT_SHATTER_OUT, 'sine.inOut'),
        undefined,
        0,
      )
      tl.call(
        () => forgeToRef.current(silhouette, 0.3, PASSPORT_SHATTER_IN, 'power2.inOut'),
        undefined,
        PASSPORT_SHATTER_OUT + PASSPORT_SHATTER_HOLD,
      )
      shatterTl.current = tl
    }

    // Hover magnetism + DOM reveal (both DOM-written, lerped here).
    u.uZoom.value += (1 + motion.hover * 0.035 - u.uZoom.value) * 0.07
    u.uReveal.value += (motion.reveal - u.uReveal.value) * 0.1

    // Register the form to the MEASURED DOM render rect (position AND scale),
    // so the embers always match the image 1:1. Falls back to the left-panel
    // anchor until the console reports a measurement.
    let targetX = -viewport.width * 0.24
    let targetY = 0
    let targetScale = 1
    const stage = motion.stage
    if (stage && size.width > 0 && size.height > 0) {
      const worldPerPx = viewport.width / size.width
      targetX = (stage.cx - size.width / 2) * worldPerPx
      targetY = (size.height / 2 - stage.cy) * worldPerPx
      targetScale = Math.min(
        1.6,
        Math.max(0.35, (stage.dim * worldPerPx) / PASSPORT_PIECE_FIT),
      )
    }
    points.position.x += (targetX - points.position.x) * 0.08
    points.position.y += (targetY - points.position.y) * 0.08
    const s = points.scale.x + (targetScale - points.scale.x) * 0.08
    points.scale.set(s, s, s)

    // Damped sway + pointer parallax, stilled while the render is fused.
    const still = 1 - u.uReveal.value * 0.65
    points.rotation.y =
      (Math.sin(state.clock.elapsedTime * 0.22) * 0.11 + motion.pointerX * 0.14) * still
    points.rotation.x = motion.pointerY * -0.04 * still
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
