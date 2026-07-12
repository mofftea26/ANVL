import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { gsap } from '@/shared/lib/gsap'
import {
  sampleImageSilhouette,
  type SilhouetteCloud,
} from '@/shared/webgl/particleShapes'
import type { OathMotionState } from '../motion/oathMotionState'
import {
  FORGE_ASSEMBLE_DURATION,
  FORGE_CONVERGE_AT,
  FORGE_ENTRY_DELAY,
  FORGE_MORPH_DURATION,
} from '../motion/heroForgeTiming'
import type { OathBrandColors } from './oathBrandColors'
import { HERO_FORGE_FRAGMENT, HERO_FORGE_VERTEX } from './heroForgeShaders'

/** Particle pool — shares the persistent canvas with the monolith + dust. */
const COUNT = 14_000
/** World size a formed piece is normalized to (camera z=5, fov 40 ⇒ ~3.64 tall).
 *  Mirrored by the DOM render box in OathHeroProductStage — keep in sync
 *  (box svh = PIECE_FIT × 100 / 3.64 ⇒ 2.6 ⇒ 71.4svh). */
export const PIECE_FIT = 2.6
/** Lineup beat: every piece small, side by side, before converging into one. */
const LINEUP_FIT = PIECE_FIT * 0.52
const LINEUP_SPACING = PIECE_FIT * 0.66

/** GLSL-matching smoothstep for the frame loop. */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/**
 * Scene 01 centerpiece (hero mode `products`) — the CMS product renders formed
 * out of ember particles on the hero's right stage, then resolved into the
 * actual render (the DOM stage fades the real image in over the settled form).
 *
 * Silhouettes are pixel-sampled from the same transparent PNGs the stage
 * reveals, so the ember form and the resolved render are registered 1:1 —
 * the product genuinely appears to reshape. Choreography: a scattered nebula
 * assembles into a **lineup of every piece**, holds a beat, then converges
 * into piece 01; each stage click (DOM writes `motion.heroProductStrike`)
 * dissolves the current piece and re-forms the next; `motion.heroProductReveal`
 * (DOM-tweened) recedes the embers to a faint halo while the render is shown.
 * All motion is vertex-shader work — React only drives uniforms and buffers.
 */
export function HeroProductParticles({
  motion,
  imageUrls,
  colors,
}: {
  motion: OathMotionState
  imageUrls: string[]
  colors: OathBrandColors
}) {
  const pointsRef = useRef<THREE.Points>(null)
  // Runtime mutation goes through the mounted material's uniform slots — R3F
  // does not preserve the `uniforms` prop object's identity (see EmberAnvil).
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  // Async silhouette sampling from the CMS renders (alpha-gated pixels +
  // luminance shades). Null until every image has resolved or degraded.
  const [shapes, setShapes] = useState<{
    fullTargets: SilhouetteCloud[]
    lineup: SilhouetteCloud
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    void Promise.all(
      imageUrls.map((url) => sampleImageSilhouette(url, COUNT, PIECE_FIT, 0.24)),
    ).then((fullTargets) => {
      if (cancelled || fullTargets.length === 0) return
      const n = fullTargets.length
      const ratio = LINEUP_FIT / PIECE_FIT
      const lineup: SilhouetteCloud = {
        positions: new Float32Array(COUNT * 3),
        shades: new Float32Array(COUNT),
      }
      if (n === 1) {
        // Single piece: the lineup beat is the same piece, smaller — a
        // two-beat entry (small form → full-size converge), not a pop-in.
        for (let i = 0; i < COUNT * 3; i += 1) {
          lineup.positions[i] = fullTargets[0].positions[i] * ratio
        }
        lineup.shades.set(fullTargets[0].shades)
      } else {
        // Partition the pool round-robin so each piece owns an equal share,
        // shrunk to lineup size and spread along X.
        for (let i = 0; i < COUNT; i += 1) {
          const owner = i % n
          const src = fullTargets[owner]
          const j = (i / n) | 0
          const offsetX = (owner - (n - 1) / 2) * LINEUP_SPACING
          lineup.positions[i * 3] = src.positions[j * 3] * ratio + offsetX
          lineup.positions[i * 3 + 1] = src.positions[j * 3 + 1] * ratio
          lineup.positions[i * 3 + 2] = src.positions[j * 3 + 2] * ratio
          lineup.shades[i] = src.shades[j]
        }
      }
      setShapes({ fullTargets, lineup })
    })
    return () => {
      cancelled = true
    }
  }, [imageUrls])

  const geometry = useMemo(() => {
    if (!shapes) return null
    const scatters = new Float32Array(COUNT * 3)
    const seeds = new Float32Array(COUNT)
    const v = new THREE.Vector3()
    for (let i = 0; i < COUNT; i += 1) {
      // Scatter nebula kept behind the piece plane — near-camera points would
      // rasterize huge (see the size cap in the vertex shader).
      v.randomDirection().multiplyScalar(3.4 + Math.random() * 3.6)
      scatters.set([v.x * 1.4, v.y * 0.9, v.z * 0.5 - 1.5], i * 3)
      seeds[i] = Math.random()
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(shapes.lineup.positions.slice(), 3))
    geo.setAttribute('aFrom', new THREE.BufferAttribute(shapes.lineup.positions.slice(), 3))
    geo.setAttribute('aTo', new THREE.BufferAttribute(shapes.lineup.positions.slice(), 3))
    geo.setAttribute('aShadeFrom', new THREE.BufferAttribute(shapes.lineup.shades.slice(), 1))
    geo.setAttribute('aShadeTo', new THREE.BufferAttribute(shapes.lineup.shades.slice(), 1))
    geo.setAttribute('aScatter', new THREE.BufferAttribute(scatters, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    // The shader displaces freely — a generous static sphere avoids culling.
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12)
    return geo
  }, [shapes])

  useEffect(() => () => geometry?.dispose(), [geometry])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAssemble: { value: 0 },
      uMorph: { value: 0 },
      uZoom: { value: 1 },
      uScroll: { value: 0 },
      uBurst: { value: 0 },
      uReveal: { value: 0 },
      // On-screen ember size — smaller than Coming Soon: the piece shares the
      // hero with copy and must read as forged product, not a fire show.
      uSize: { value: 0.12 },
      uColdColor: { value: colors.steel.clone().lerp(colors.bone, 0.35) },
      uEmberColor: { value: colors.primary.clone() },
      uHotColor: { value: colors.emberBright.clone() },
    }),
    // Colors are read once per mount (theme changes remount the canvas).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  /** Swap morph buffers to `target` and tween uMorph 0→1 with a burst. */
  const forgeTo = (target: SilhouetteCloud, burst: number) => {
    const u = materialRef.current?.uniforms
    const geo = pointsRef.current?.geometry as THREE.BufferGeometry | undefined
    if (!u || !geo) return
    const aFrom = geo.getAttribute('aFrom') as THREE.BufferAttribute
    const aTo = geo.getAttribute('aTo') as THREE.BufferAttribute
    const aShadeFrom = geo.getAttribute('aShadeFrom') as THREE.BufferAttribute
    const aShadeTo = geo.getAttribute('aShadeTo') as THREE.BufferAttribute
    // The current visual state is wherever the last morph landed — freeze it
    // into aFrom so an interrupt never snaps.
    const settled = u.uMorph.value >= 0.999
    if (settled) {
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
    gsap.to(u.uMorph, { value: 1, duration: FORGE_MORPH_DURATION, ease: 'power2.inOut' })
    gsap.killTweensOf(u.uBurst)
    gsap.fromTo(u.uBurst, { value: burst }, { value: 0, duration: 1.4, ease: 'power2.out' })
  }
  const forgeToRef = useRef(forgeTo)
  forgeToRef.current = forgeTo

  // Entry choreography: nebula → lineup of all pieces → hold → first piece.
  // Absolute positions against the shared forge clock (heroForgeTiming), so
  // the DOM stage's first-render reveal lands exactly as the embers settle.
  const liveRef = useRef(false)
  useEffect(() => {
    const u = materialRef.current?.uniforms
    if (!u || !shapes) return
    liveRef.current = false
    const tl = gsap.timeline({ delay: FORGE_ENTRY_DELAY })
    tl.to(
      u.uAssemble,
      { value: 1, duration: FORGE_ASSEMBLE_DURATION, ease: 'power2.inOut' },
      0,
    )
    tl.fromTo(
      u.uBurst,
      { value: 0.5 },
      { value: 0, duration: 1.2, ease: 'power2.out' },
      FORGE_ASSEMBLE_DURATION - 0.5,
    )
    tl.call(
      () => {
        forgeToRef.current(shapes.fullTargets[0], 0.6)
        liveRef.current = true
      },
      undefined,
      FORGE_CONVERGE_AT - FORGE_ENTRY_DELAY,
    )
    return () => {
      tl.kill()
    }
  }, [shapes])

  // Per-frame: follow the motion bridge (strikes, hover, reveal, scroll).
  const seenRef = useRef({ strike: 0, index: 0 })
  const { viewport } = useThree()
  useFrame((state) => {
    const u = materialRef.current?.uniforms
    const points = pointsRef.current
    if (!u || !points || !shapes) return
    u.uTime.value = state.clock.elapsedTime

    // Strike → dissolve and re-form into the requested piece.
    if (liveRef.current && motion.heroProductStrike !== seenRef.current.strike) {
      seenRef.current.strike = motion.heroProductStrike
      const n = shapes.fullTargets.length
      const next = ((motion.heroProductIndex % n) + n) % n
      seenRef.current.index = next
      forgeToRef.current(shapes.fullTargets[next], 0.85)
    }

    // Hover magnetism — a slow breathe toward the cursor's attention. Matches
    // the DOM render's 1.035 hover scale so the halo never outgrows the piece.
    u.uZoom.value += (1 + motion.heroProductHover * 0.035 - u.uZoom.value) * 0.07

    // Scroll hand-off (lerped to smooth scrub jitter).
    u.uScroll.value += (motion.heroProgress - u.uScroll.value) * 0.12
    points.visible = u.uScroll.value < 0.985

    // Reveal state (DOM-tweened) — cancelled early in the scrub so the actual
    // render dissolves back into embers, and the embers do the creed hand-off.
    const effectiveReveal =
      motion.heroProductReveal * (1 - smoothstep(0.12, 0.5, u.uScroll.value))
    u.uReveal.value += (effectiveReveal - u.uReveal.value) * 0.1

    // Stage placement: right-of-centre panel, drifting toward centre with the
    // scrub — mirroring the DOM film's right→centre composite.
    const anchorX = viewport.width * 0.24
    const drift = 1 - u.uScroll.value * 0.55
    points.position.x += (anchorX * drift - points.position.x) * 0.08
    points.position.y += (0.05 + u.uScroll.value * 0.4 - points.position.y) * 0.08

    // Damped front-facing sway + pointer parallax — kept shallow (the sampled
    // silhouette is a thin slab) and stilled while the flat render is shown.
    const still = 1 - u.uReveal.value * 0.65
    points.rotation.y =
      (Math.sin(state.clock.elapsedTime * 0.24) * 0.14 + motion.pointerX * 0.18) * still
    points.rotation.x = motion.pointerY * -0.05 * still
  })

  if (!geometry) return null

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <primitive object={geometry} attach="geometry" />
      <shaderMaterial
        ref={materialRef}
        vertexShader={HERO_FORGE_VERTEX}
        fragmentShader={HERO_FORGE_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
