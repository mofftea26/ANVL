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

// 6k reads identically at card-trace densities but cuts vertex + overdraw cost
// by a third (additive blending makes overdraw the real GPU bill).
const COUNT = 6_000
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

  /**
   * A point on a card's ROUNDED-rectangle outline at arc-length `t`, walked
   * clockwise from the top edge through true quarter-circle corners — so the
   * ember trace curves at the corners exactly like `rounded-2xl`, instead of
   * squaring off.
   */
  const pointOnRoundedRect = (r: PassportCardRect, rad: number, t: number) => {
    const sw = Math.max(0, r.w - 2 * rad)
    const sh = Math.max(0, r.h - 2 * rad)
    const arc = (Math.PI / 2) * rad
    // 1 — top edge (left→right)
    if (t < sw) return { x: r.x + rad + t, y: r.y }
    t -= sw
    // 2 — top-right corner (−90°→0°)
    if (t < arc) {
      const a = -Math.PI / 2 + (t / arc) * (Math.PI / 2)
      return { x: r.x + r.w - rad + rad * Math.cos(a), y: r.y + rad + rad * Math.sin(a) }
    }
    t -= arc
    // 3 — right edge (top→bottom)
    if (t < sh) return { x: r.x + r.w, y: r.y + rad + t }
    t -= sh
    // 4 — bottom-right corner (0°→90°)
    if (t < arc) {
      const a = (t / arc) * (Math.PI / 2)
      return { x: r.x + r.w - rad + rad * Math.cos(a), y: r.y + r.h - rad + rad * Math.sin(a) }
    }
    t -= arc
    // 5 — bottom edge (right→left)
    if (t < sw) return { x: r.x + r.w - rad - t, y: r.y + r.h }
    t -= sw
    // 6 — bottom-left corner (90°→180°)
    if (t < arc) {
      const a = Math.PI / 2 + (t / arc) * (Math.PI / 2)
      return { x: r.x + rad + rad * Math.cos(a), y: r.y + r.h - rad + rad * Math.sin(a) }
    }
    t -= arc
    // 7 — left edge (bottom→top)
    if (t < sh) return { x: r.x, y: r.y + r.h - rad - t }
    t -= sh
    // 8 — top-left corner (180°→270°)
    const a = Math.PI + (t / arc) * (Math.PI / 2)
    return { x: r.x + rad + rad * Math.cos(a), y: r.y + rad + rad * Math.sin(a) }
  }

  const radiusOf = (r: PassportCardRect) => Math.min(CORNER_PX, r.w / 2, r.h / 2)

  /** Build the ember tracing of the measured card rects (px → world). */
  const buildRectCloud = (rects: PassportCardRect[]): SilhouetteCloud | null => {
    if (!rects.length || size.width <= 0 || size.height <= 0) return null
    const worldPerPx = viewport.width / size.width
    const toWorldX = (px: number) => (px - size.width / 2) * worldPerPx
    const toWorldY = (py: number) => (size.height / 2 - py) * worldPerPx

    // True rounded-rect perimeter (weights big cards; matches the walk).
    const perimeters = rects.map((r) => {
      const rad = radiusOf(r)
      return 2 * Math.max(0, r.w - 2 * rad) + 2 * Math.max(0, r.h - 2 * rad) + 2 * Math.PI * rad
    })
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
        const p = pointOnRoundedRect(r, radiusOf(r), Math.random() * perimeters[ri])
        // Tight breathing room so the outline stays crisp (was ±3px).
        px = p.x + (Math.random() - 0.5) * 1.4
        py = p.y + (Math.random() - 0.5) * 1.4
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
   * The transition veil — an ELLIPTICAL cloud centred on the cards' region
   * (never the whole page, never a hard box). Radius is sampled with sqrt so
   * density falls toward the rim and the rim itself is feathered, so the
   * disperse reads as a soft round bloom rather than a square of static.
   */
  const buildLocalVeil = (rects: PassportCardRect[]): SilhouetteCloud => {
    if (!rects.length || size.width <= 0 || size.height <= 0) return shatterCloud
    const worldPerPx = viewport.width / size.width
    const toWorldX = (px: number) => (px - size.width / 2) * worldPerPx
    const toWorldY = (py: number) => (size.height / 2 - py) * worldPerPx
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const r of rects) {
      minX = Math.min(minX, r.x)
      minY = Math.min(minY, r.y)
      maxX = Math.max(maxX, r.x + r.w)
      maxY = Math.max(maxY, r.y + r.h)
    }
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    // Semi-axes cover the region with a little breathing room.
    const rx = ((maxX - minX) / 2) * 1.18
    const ry = ((maxY - minY) / 2) * 1.18
    const positions = new Float32Array(COUNT * 3)
    const shades = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i += 1) {
      const theta = Math.random() * Math.PI * 2
      // sqrt → uniform disc; the ^1.25 pushes a touch of density inward and
      // the feather lets a few embers drift softly past the rim.
      const rho = Math.sqrt(Math.random()) ** 1.25
      const feather = 1 + Math.random() * Math.random() * 0.22
      positions[i * 3] = toWorldX(cx + Math.cos(theta) * rx * rho * feather)
      positions[i * 3 + 1] = toWorldY(cy + Math.sin(theta) * ry * rho * feather)
      positions[i * 3 + 2] = (Math.random() * 2 - 1) * 0.35
      // Dimmer at the rim so the cloud's edge dissolves instead of cutting.
      shades[i] = (0.3 + Math.random() * 0.26) * (1.05 - rho * 0.45)
    }
    return { positions, shades }
  }
  const buildLocalVeilRef = useRef(buildLocalVeil)
  buildLocalVeilRef.current = buildLocalVeil

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
    gsap.fromTo(u.uBurst, { value: burst }, { value: 0, duration: 0.9, ease: 'sine.out' })
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

    // Dissolve into a veil bounded to the cards' region (not the whole page).
    if (motion.shatter !== seenShatter.current) {
      seenShatter.current = motion.shatter
      forgeToRef.current(
        buildLocalVeilRef.current(motion.cardRects),
        0.28,
        PASSPORT_SHATTER_OUT,
        'sine.inOut',
      )
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
