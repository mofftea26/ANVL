import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { gsap } from '@/shared/lib/gsap'
import { readThemeCssColor } from '@/shared/lib/themeColor'
import type { SilhouetteCloud } from '@/shared/webgl/particleShapes'
import type { PassportCardRect, PassportMotionState } from './passportMotionState'
import {
  PASSPORT_ASSEMBLE_DURATION,
  PASSPORT_ENTRY_DELAY,
  PASSPORT_SHATTER_IN,
  PASSPORT_SHATTER_OUT,
} from './passportForgeTiming'
import { PASSPORT_FORGE_FRAGMENT, PASSPORT_FORGE_VERTEX } from './passportForgeShaders'

const COUNT = 9_000
/** Rounded-corner radius the ember tracing assumes (matches rounded-2xl). */
const CORNER_PX = 16
/** Share of points tracing card borders vs. sparse interior fill. */
const BORDER_SHARE = 0.72

/**
 * The passport console's ember layer (particle-forge standard): the BENTO
 * CARDS themselves are traced out of champagne embers — borders burn bright,
 * interiors carry a sparse drift — measured 1:1 from the DOM via
 * `motion.cardRects`. Section/tab transitions dissolve the layout into a soft
 * veil; the next measured layout re-forges. After the DOM cards resolve,
 * `motion.reveal` settles the embers into a faint living trace (never fully
 * gone).
 */
export function PassportForgeParticles({ motion }: { motion: PassportMotionState }) {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { viewport, size } = useThree()

  // Screen-filling veil — the transition target between layouts.
  const shatterCloud = useMemo<SilhouetteCloud>(() => {
    const positions = new Float32Array(COUNT * 3)
    const shades = new Float32Array(COUNT)
    const w = Math.max(viewport.width, 6)
    const h = Math.max(viewport.height, 4)
    for (let i = 0; i < COUNT; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * w * 1.3
      positions[i * 3 + 1] = (Math.random() - 0.5) * h * 1.25
      positions[i * 3 + 2] = (Math.random() - 0.7) * 1.4
      shades[i] = 0.3 + Math.random() * 0.3
    }
    return { positions, shades }
  }, [viewport.width, viewport.height])

  const geometry = useMemo(() => {
    const scatters = new Float32Array(COUNT * 3)
    const seeds = new Float32Array(COUNT)
    const zeros = new Float32Array(COUNT * 3)
    const dimShades = new Float32Array(COUNT).fill(0.3)
    const v = new THREE.Vector3()
    for (let i = 0; i < COUNT; i += 1) {
      v.randomDirection().multiplyScalar(3.2 + Math.random() * 3.4)
      scatters.set([v.x * 1.5, v.y * 0.9, v.z * 0.5 - 1.4], i * 3)
      seeds[i] = Math.random()
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(zeros.slice(), 3))
    geo.setAttribute('aFrom', new THREE.BufferAttribute(zeros.slice(), 3))
    geo.setAttribute('aTo', new THREE.BufferAttribute(zeros.slice(), 3))
    geo.setAttribute('aShadeFrom', new THREE.BufferAttribute(dimShades.slice(), 1))
    geo.setAttribute('aShadeTo', new THREE.BufferAttribute(dimShades.slice(), 1))
    geo.setAttribute('aScatter', new THREE.BufferAttribute(scatters, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 16)
    return geo
  }, [])

  useEffect(() => () => geometry.dispose(), [geometry])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAssemble: { value: 0 },
      uMorph: { value: 0 },
      uZoom: { value: 1 },
      uBurst: { value: 0 },
      uReveal: { value: 0 },
      uSize: { value: 0.1 },
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

  /** Build the ember tracing of the measured card rects (px → world). */
  const buildRectCloud = (rects: PassportCardRect[]): SilhouetteCloud | null => {
    if (!rects.length || size.width <= 0 || size.height <= 0) return null
    const worldPerPx = viewport.width / size.width
    const toWorldX = (px: number) => (px - size.width / 2) * worldPerPx
    const toWorldY = (py: number) => (size.height / 2 - py) * worldPerPx

    const perimeters = rects.map((r) => 2 * (r.w + r.h))
    const totalPerimeter = perimeters.reduce((a, b) => a + b, 0) || 1

    const positions = new Float32Array(COUNT * 3)
    const shades = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i += 1) {
      // Weight rect choice by perimeter so big cards get more embers.
      let pick = Math.random() * totalPerimeter
      let ri = 0
      while (ri < rects.length - 1 && pick > perimeters[ri]) {
        pick -= perimeters[ri]
        ri += 1
      }
      const r = rects[ri]
      const border = Math.random() < BORDER_SHARE
      let px: number
      let py: number
      if (border) {
        // Walk the perimeter; soften corners toward the rounded radius.
        const t = Math.random() * perimeters[ri]
        if (t < r.w) {
          px = r.x + t
          py = r.y
        } else if (t < r.w + r.h) {
          px = r.x + r.w
          py = r.y + (t - r.w)
        } else if (t < 2 * r.w + r.h) {
          px = r.x + (t - r.w - r.h)
          py = r.y + r.h
        } else {
          px = r.x
          py = r.y + (t - 2 * r.w - r.h)
        }
        // Nudge extreme corners inward so the trace reads rounded.
        const cx = Math.min(Math.max(px, r.x + CORNER_PX), r.x + r.w - CORNER_PX)
        const cy = Math.min(Math.max(py, r.y + CORNER_PX), r.y + r.h - CORNER_PX)
        px = px * 0.85 + cx * 0.15
        py = py * 0.85 + cy * 0.15
        // Slight breathing room off the exact edge.
        px += (Math.random() - 0.5) * 3
        py += (Math.random() - 0.5) * 3
      } else {
        px = r.x + Math.random() * r.w
        py = r.y + Math.random() * r.h
      }
      positions[i * 3] = toWorldX(px)
      positions[i * 3 + 1] = toWorldY(py)
      positions[i * 3 + 2] = (Math.random() * 2 - 1) * 0.1
      shades[i] = border ? 0.7 + Math.random() * 0.3 : 0.2 + Math.random() * 0.15
    }
    return { positions, shades }
  }
  const buildRectCloudRef = useRef(buildRectCloud)
  buildRectCloudRef.current = buildRectCloud

  /**
   * Freeze the cloud's CURRENT visual position into `aFrom` — a CPU mirror of
   * the vertex shader's per-seed staggered morph. Called before every new
   * morph so interrupting one mid-flight continues from where the embers
   * actually are instead of snapping back to the previous shape.
   */
  const freezeCurrent = (geo: THREE.BufferGeometry, morph: number) => {
    const aFrom = geo.getAttribute('aFrom') as THREE.BufferAttribute
    const aTo = geo.getAttribute('aTo') as THREE.BufferAttribute
    const aShadeFrom = geo.getAttribute('aShadeFrom') as THREE.BufferAttribute
    const aShadeTo = geo.getAttribute('aShadeTo') as THREE.BufferAttribute
    const aSeed = geo.getAttribute('aSeed') as THREE.BufferAttribute
    const from = aFrom.array as Float32Array
    const to = aTo.array as Float32Array
    const shadeFrom = aShadeFrom.array as Float32Array
    const shadeTo = aShadeTo.array as Float32Array
    const seeds = aSeed.array as Float32Array
    for (let i = 0; i < seeds.length; i += 1) {
      const seed = seeds[i]
      // Must match PASSPORT_FORGE_VERTEX's morph stagger exactly.
      let m = Math.min(1, Math.max(0, morph * (1.25 + seed * 0.5) - seed * 0.35))
      m = m * m * (3 - 2 * m)
      const i3 = i * 3
      from[i3] += (to[i3] - from[i3]) * m
      from[i3 + 1] += (to[i3 + 1] - from[i3 + 1]) * m
      from[i3 + 2] += (to[i3 + 2] - from[i3 + 2]) * m
      shadeFrom[i] += (shadeTo[i] - shadeFrom[i]) * m
    }
    aFrom.needsUpdate = true
    aShadeFrom.needsUpdate = true
  }

  /** Swap morph buffers to `target` and tween uMorph 0→1 with a soft burst. */
  const forgeTo = (target: SilhouetteCloud, burst: number, duration: number, ease: string) => {
    const u = materialRef.current?.uniforms
    const geo = pointsRef.current?.geometry as THREE.BufferGeometry | undefined
    if (!u || !geo) return
    const aTo = geo.getAttribute('aTo') as THREE.BufferAttribute
    const aShadeTo = geo.getAttribute('aShadeTo') as THREE.BufferAttribute
    freezeCurrent(geo, u.uMorph.value)
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

  // Frame loop: react to layout measurements + shatters, follow reveal.
  const seenShatter = useRef(0)
  const seenRects = useRef(0)
  const entered = useRef(false)
  const entryTl = useRef<gsap.core.Timeline | null>(null)
  useEffect(
    () => () => {
      entryTl.current?.kill()
    },
    [],
  )

  useFrame((state) => {
    const u = materialRef.current?.uniforms
    const points = pointsRef.current
    if (!u || !points) return
    u.uTime.value = state.clock.elapsedTime

    // Dissolve into the veil when the console starts a transition.
    if (motion.shatter !== seenShatter.current) {
      seenShatter.current = motion.shatter
      forgeToRef.current(shatterCloud, 0.3, PASSPORT_SHATTER_OUT, 'sine.inOut')
    }

    // New measured layout → forge the embers into the card shapes.
    if (motion.cardRectsVersion !== seenRects.current) {
      const cloud = buildRectCloudRef.current(motion.cardRects)
      if (cloud) {
        seenRects.current = motion.cardRectsVersion
        if (!entered.current) {
          // First layout: seed the buffers, then run the entry assembly.
          entered.current = true
          const geo = points.geometry as THREE.BufferGeometry
          for (const name of ['position', 'aFrom', 'aTo'] as const) {
            const attr = geo.getAttribute(name) as THREE.BufferAttribute
            ;(attr.array as Float32Array).set(cloud.positions)
            attr.needsUpdate = true
          }
          for (const name of ['aShadeFrom', 'aShadeTo'] as const) {
            const attr = geo.getAttribute(name) as THREE.BufferAttribute
            ;(attr.array as Float32Array).set(cloud.shades)
            attr.needsUpdate = true
          }
          u.uMorph.value = 1
          const tl = gsap.timeline({ delay: PASSPORT_ENTRY_DELAY })
          tl.to(u.uAssemble, {
            value: 1,
            duration: PASSPORT_ASSEMBLE_DURATION,
            ease: 'power2.inOut',
          })
          tl.fromTo(
            u.uBurst,
            { value: 0.4 },
            { value: 0, duration: 1.2, ease: 'sine.out' },
            PASSPORT_ASSEMBLE_DURATION - 0.5,
          )
          entryTl.current = tl
        } else {
          forgeToRef.current(cloud, 0.28, PASSPORT_SHATTER_IN, 'power2.inOut')
        }
      }
    }

    // Cards resolved → the embers fade out entirely and stop rendering: they
    // exist only while something is in motion. Any new shatter/layout drops
    // motion.reveal, which brings them straight back.
    u.uReveal.value += (motion.reveal - u.uReveal.value) * 0.08
    // Land the asymptote so the field actually reaches zero and switches off
    // (the last 3% of alpha is invisible anyway).
    if (motion.reveal >= 1 && u.uReveal.value > 0.97) u.uReveal.value = 1
    points.visible = u.uReveal.value < 0.999
  })

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
