import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/shared/lib/gsap'
import { readThemeCssColor } from '@/shared/lib/themeColor'
import { useCanvasTeardownMark } from '@/shared/webgl/canvasTeardownGuard'
import { sampleImageSilhouette, type SilhouetteCloud } from '@/shared/webgl/particleShapes'
import {
  BLUEPRINT_FALLBACK,
  CAMERA_Z,
  CHAMPAGNE_FALLBACK,
  EMITTER_FRAGMENT,
  EMITTER_SQUASH,
  EMITTER_VERTEX,
  GARMENT_FRAGMENT,
  GARMENT_VERTEX,
  SHAFT_FRAGMENT,
  SHAFT_VERTEX,
  TAG_DRAW_HEIGHT,
  TAG_DRAW_WIDTH,
  buildProjectionData,
} from './effectBlueprintShaders'
import {
  drawTagCanvas,
  imageBoxWorldSize,
  tagsFromFacts,
  type HoloImageBox,
} from '../lib/holoTags'
import { decodeImageAspect } from '../lib/markerGeometry'
import type { PassportEffectFacts } from '../effectFacts'

/**
 * The Blueprint hologram — a full Jarvis-style projection, and the passport
 * console's flagship effect. The photograph leaves the stage when this mounts
 * (the host dissolves it via `data-holo-solo`); this canvas IS the product
 * display: a ground emitter ring fires a soft light shaft, the garment prints
 * itself out of the ring as a 5.6k-point silhouette cloud (particle-forge
 * standard, docs/animation-guidelines.md), then turns like a museum hologram
 * inside orbiting data rings and spec plates carrying the passport's REAL
 * authored facts. Lazy half of `EffectBlueprint`; pulls `vendor-three`.
 *
 * GLSL + the stage maths live in the `effectBlueprintShaders.ts` sibling; the
 * spec plates (strings, raster, placement) in the shared `../lib/holoTags`.
 */

const COUNT = 5_600
/** World height of the garment cloud — it owns the stage now, no photo to match. */
const FIT = 3.2
const CAMERA_FOV = 40
/** Canvas bleeds past the stage box so the projection can breathe outside it. */
const BLEED = '3rem'
/**
 * The veil's feathered edge: fully dark through ~62%, dissolved by 100%.
 * `farthest-side` ends the ellipse at the side midpoints so the corners fade
 * out entirely — the darkening reads as a pool, never a cropped box.
 */
const VEIL_MASK =
  'radial-gradient(ellipse farthest-side at 50% 50%, black 62%, rgba(0,0,0,0.55) 82%, transparent 100%)'

/* Choreography clock — one shared timeline every element schedules against:
   ring lights → shaft blooms → the print streams up → furniture flickers in. */
const EMITTER_AT_S = 0.05
const EMITTER_IN_S = 0.7
const ASSEMBLE_AT_S = 0.45
const ASSEMBLE_S = 1.4
const FURNITURE_AT_S = 1.35
const FURNITURE_S = 1.1
const SCAN_START_S = ASSEMBLE_AT_S + ASSEMBLE_S
const SCAN_PERIOD_S = 4.6
/** Continuous museum turn — full Y revolution. */
const SPIN_PERIOD_S = 24
const GLITCH_GAP_S = 7
const GLITCH_JITTER_S = 2
const RING1_TILT = Math.PI / 2 - 0.38
const RING2_TILT = Math.PI / 2 + 0.3

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** Mutable GSAP⇄useFrame bridge (passportMotionState pattern) — no setState per frame. */
interface ProjectionMotion {
  emitter: number
  assemble: number
  furniture: number
}

interface ProjectionProps {
  cloud: SilhouetteCloud
  /** World box of the sampled render — null when its aspect never decoded,
   *  which puts every spec plate back on its frozen slot. */
  box: HoloImageBox | null
  facts?: PassportEffectFacts
}

function JarvisProjection({ cloud, box, facts }: ProjectionProps) {
  const cloudRef = useRef<THREE.Points>(null)
  const garmentMatRef = useRef<THREE.ShaderMaterial>(null)
  const emitterMatRef = useRef<THREE.ShaderMaterial>(null)
  const shaftMatRef = useRef<THREE.ShaderMaterial>(null)
  const ring1Ref = useRef<THREE.Group>(null)
  const ring2Ref = useRef<THREE.Group>(null)
  const ring1MatRef = useRef<THREE.MeshBasicMaterial>(null)
  const ring2MatRef = useRef<THREE.MeshBasicMaterial>(null)
  const leaderMatRef = useRef<THREE.LineBasicMaterial>(null)
  // Local clamped clock — a backgrounded tab resumes where it left off.
  const clockRef = useRef(0)
  const dropoutRef = useRef(0)
  const glitchFramesRef = useRef(0)
  const nextGlitchRef = useRef(GLITCH_GAP_S + Math.random() * GLITCH_JITTER_S)

  const motion = useMemo<ProjectionMotion>(
    () => ({ emitter: 0, assemble: 0, furniture: 0 }),
    [],
  )
  // Visible world size at z=0 — every element is clamped inside it (the
  // canvas edge is a straight line the projection must never reveal).
  const { width: vpW, height: vpH } = useThree((s) => s.viewport)

  const colors = useMemo(() => {
    // Read once at mount — the canvas remounts per section entry, which is
    // exactly when a theme change could matter.
    const base = new THREE.Color(readThemeCssColor('--pp-blueprint', BLUEPRINT_FALLBACK))
    return {
      base,
      bright: base.clone().lerp(new THREE.Color('#ffffff'), 0.55),
      accent: new THREE.Color(readThemeCssColor('--color-highlight-bright', CHAMPAGNE_FALLBACK)),
    }
  }, [])

  // The plates say only what the passport says. `tagsFromFacts` never invents,
  // so an unauthored piece simply projects fewer plates — or none at all, in
  // which case the leader-line buffer is empty too and no HUD layer draws.
  const tagSpecs = useMemo(() => tagsFromFacts(facts), [facts])

  // All stage maths (recenter + shell bake, emitter-ring births, print order,
  // rim bake, clamped layout) lives in the pure sibling; here we only wrap
  // the buffers into a BufferGeometry.
  const build = useMemo(() => {
    const data = buildProjectionData(cloud, COUNT, vpW, vpH, tagSpecs, box)
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(data.positions, 3))
    geo.setAttribute('aFrom', new THREE.BufferAttribute(data.from, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(data.seeds, 1))
    geo.setAttribute('aRise', new THREE.BufferAttribute(data.rises, 1))
    geo.setAttribute('aShade', new THREE.BufferAttribute(data.shades, 1))
    geo.setAttribute('aEdge', new THREE.BufferAttribute(data.edges, 1))
    geo.setAttribute('aDim', new THREE.BufferAttribute(data.dims, 1))
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10)
    return { geo, layout: data.layout }
  }, [cloud, vpW, vpH, tagSpecs, box])

  // Holographic tags: camera-facing sprites (they do NOT turn with the piece,
  // so their clamped anchors bound them for the whole revolution) + one
  // leader-line geometry. Zero tags ⇒ zero segments ⇒ nothing to draw.
  const furniture = useMemo(() => {
    const tagColors = {
      base: `#${colors.base.getHexString()}`,
      // Near-white for the value line — readability beats palette purity on a
      // label (the plate itself carries the blueprint hue).
      bright: `#${colors.base.clone().lerp(new THREE.Color('#ffffff'), 0.88).getHexString()}`,
      accent: `#${colors.accent.getHexString()}`,
    }
    const tags = build.layout.tags.map((anchor) => {
      const texture = new THREE.CanvasTexture(drawTagCanvas(anchor, tagColors))
      texture.minFilter = THREE.LinearFilter
      texture.generateMipmaps = false
      // NORMAL blending (unlike everything else on this stage): the dark
      // plate must OCCLUDE the bright cloud so the text stays legible —
      // additive sprites washed out over the particles. depthTest off + a
      // late renderOrder guarantee the plate draws over the cloud no matter
      // how the transparent pass sorts.
      const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0, depthWrite: false, depthTest: false })
      const sprite = new THREE.Sprite(material)
      sprite.position.set(anchor.x, anchor.y, 0.4)
      // Drawn at the TRIMMED size; the layout budget stays the larger one.
      sprite.scale.set(TAG_DRAW_WIDTH, TAG_DRAW_HEIGHT, 1)
      sprite.renderOrder = 10
      return { label: anchor.label, sprite, material, texture, baseY: anchor.y }
    })
    const seg: number[] = []
    for (const anchor of build.layout.tags) {
      const inner = anchor.x - Math.sign(anchor.x) * (TAG_DRAW_WIDTH / 2 - 0.02)
      seg.push(inner, anchor.y, 0, anchor.anchorX, anchor.y, 0)
    }
    const leaderGeo = new THREE.BufferGeometry()
    leaderGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(seg), 3))
    return { tags, leaderGeo }
  }, [build, colors])

  // The point-cloud geometry comes in via <primitive> (no R3F auto-dispose);
  // sprite materials/textures and the leader geometry are hand-built too.
  useEffect(() => () => build.geo.dispose(), [build])
  useEffect(() => () => {
    furniture.leaderGeo.dispose()
    for (const tag of furniture.tags) [tag.material, tag.texture].forEach((r) => r.dispose())
  }, [furniture])

  const garmentUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAssemble: { value: 0 },
      uScanY: { value: -100 },
      uFlicker: { value: 1 },
      uSize: { value: 0.08 },
      uGlitchY: { value: 0 },
      uGlitchAmp: { value: 0 },
      uHoloColor: { value: colors.base },
      uHoloBright: { value: colors.bright },
    }),
    [colors],
  )
  const emitterUniforms = useMemo(
    () => ({
      uSpin: { value: 0 },
      uEmitter: { value: 0 },
      uFlicker: { value: 1 },
      uColor: { value: colors.base },
      uAccent: { value: colors.accent },
    }),
    [colors],
  )
  const shaftUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uEmitter: { value: 0 },
      uFlicker: { value: 1 },
      uH: { value: build.layout.shaftH },
      uColor: { value: colors.base },
    }),
    [colors, build.layout.shaftH],
  )

  useGSAP(() => {
    const tl = gsap.timeline()
    tl.to(motion, { emitter: 1, duration: EMITTER_IN_S, ease: 'power2.out' }, EMITTER_AT_S)
    tl.to(motion, { assemble: 1, duration: ASSEMBLE_S, ease: 'power2.inOut' }, ASSEMBLE_AT_S)
    tl.to(motion, { furniture: 1, duration: FURNITURE_S, ease: 'power2.out' }, FURNITURE_AT_S)
    return () => void tl.kill()
  })

  useFrame((_state, delta) => {
    // Hidden tab: hold the last frame — no uniform churn, no fast-forward.
    if (document.hidden) return
    const u = garmentMatRef.current?.uniforms
    const points = cloudRef.current
    if (!u || !points) return
    const t = (clockRef.current += Math.min(delta, 1 / 20))
    const { layout } = build

    // Flicker: ~3Hz ±6% amplitude-modulated jitter plus a rare one-frame
    // dropout — an instrument reading, never glitch art. Shared by every
    // element so the whole projection is one instrument.
    let flicker = 1 + 0.06 * Math.sin(t * Math.PI * 2 * 3.1) * Math.sin(t * Math.PI * 2 * 0.73 + 1.7)
    if (dropoutRef.current > 0) {
      dropoutRef.current -= 1
      flicker *= 0.45
    } else if (Math.random() < 0.005) {
      dropoutRef.current = 1
    }

    u.uTime.value = t
    u.uAssemble.value = motion.assemble
    u.uFlicker.value = flicker

    // The museum turn — a full, continuous Y revolution.
    points.rotation.y = (t * Math.PI * 2) / SPIN_PERIOD_S

    // Scan ring: bottom→top sweep, parked below the hem until the print lands.
    const scanT = t - SCAN_START_S
    u.uScanY.value =
      scanT < 0
        ? layout.minY - 100
        : layout.minY - 0.25 + (layout.height + 0.55) * ((scanT % SCAN_PERIOD_S) / SCAN_PERIOD_S)

    // Glitch tick: every ~7–9s, one thin slice displaces sideways for two
    // frames (a single frame at high refresh reads as nothing at all).
    if (glitchFramesRef.current > 0) {
      glitchFramesRef.current -= 1
      if (glitchFramesRef.current === 0) u.uGlitchAmp.value = 0
    } else if (t >= nextGlitchRef.current) {
      u.uGlitchAmp.value = (Math.random() < 0.5 ? -1 : 1) * (0.05 + Math.random() * 0.06)
      u.uGlitchY.value = layout.minY + Math.random() * layout.height
      glitchFramesRef.current = 2
      nextGlitchRef.current = t + GLITCH_GAP_S + Math.random() * GLITCH_JITTER_S
    }

    const eu = emitterMatRef.current?.uniforms
    if (eu) {
      eu.uSpin.value = t * 0.45
      eu.uEmitter.value = motion.emitter
      eu.uFlicker.value = flicker
    }
    const su = shaftMatRef.current?.uniforms
    if (su) {
      su.uTime.value = t
      // The beam surges while the print streams up it, then settles to a hum.
      const printing = motion.assemble * (1 - motion.assemble) * 4
      su.uEmitter.value = motion.emitter * (0.7 + 0.5 * printing)
      su.uFlicker.value = flicker
    }

    // Data rings: inclined orbits precessing in opposite directions.
    if (ring1Ref.current) ring1Ref.current.rotation.y = t * 0.24
    if (ring2Ref.current) ring2Ref.current.rotation.y = -t * 0.17
    const furn = motion.furniture
    if (ring1MatRef.current) ring1MatRef.current.opacity = 0.3 * clamp01(furn / 0.6) * flicker
    if (ring2MatRef.current) ring2MatRef.current.opacity = 0.2 * clamp01((furn - 0.2) / 0.6) * flicker

    // Tags strobe in (staggered), then hold with a slow bob.
    furniture.tags.forEach((tag, i) => {
      const reveal = clamp01((furn - i * 0.22) / 0.5)
      const strobe = reveal >= 1 ? 1 : 0.5 + 0.5 * Math.sin(t * 47 + i * 9.7)
      tag.material.opacity = 0.95 * reveal * strobe * flicker
      tag.sprite.position.y = tag.baseY + Math.sin(t * 0.55 + i * 2.1) * 0.018
    })
    if (leaderMatRef.current) leaderMatRef.current.opacity = 0.65 * clamp01((furn - 0.15) / 0.6) * flicker
  })

  const { layout } = build
  return (
    <group>
      {/* Ground emitter — flat patterned disc, z-squashed to the projector
          ellipse. The pattern rotates in-shader; the mesh never moves. */}
      <mesh
        position={[0, layout.emitterY, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[1, EMITTER_SQUASH, 1]}
        frustumCulled={false}
      >
        <planeGeometry args={[layout.emitterSize, layout.emitterSize]} />
        <shaderMaterial
          ref={emitterMatRef}
          vertexShader={EMITTER_VERTEX}
          fragmentShader={EMITTER_FRAGMENT}
          uniforms={emitterUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* The light shaft — an open cone rising from the ring to the collar. */}
      <mesh
        position={[0, layout.emitterY + layout.shaftH / 2, 0]}
        scale={[1, 1, EMITTER_SQUASH]}
        frustumCulled={false}
      >
        <cylinderGeometry
          args={[layout.shaftTopR, layout.shaftBottomR, layout.shaftH, 48, 1, true]}
        />
        <shaderMaterial
          ref={shaftMatRef}
          vertexShader={SHAFT_VERTEX}
          fragmentShader={SHAFT_FRAGMENT}
          uniforms={shaftUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* The piece — the printed, revolving garment cloud. */}
      <points ref={cloudRef} frustumCulled={false}>
        <primitive object={build.geo} attach="geometry" />
        <shaderMaterial
          ref={garmentMatRef}
          vertexShader={GARMENT_VERTEX}
          fragmentShader={GARMENT_FRAGMENT}
          uniforms={garmentUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Inclined data rings orbiting the cloud (precession = the visible
          motion; a torus spinning on its own axis shows nothing). */}
      <group ref={ring1Ref} position={[0, layout.ring1Y, 0]}>
        <mesh rotation={[RING1_TILT, 0, 0]} frustumCulled={false}>
          <torusGeometry args={[layout.ringR1, 0.008, 6, 160]} />
          <meshBasicMaterial
            ref={ring1MatRef}
            color={colors.base}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
      <group ref={ring2Ref} position={[0, layout.ring2Y, 0]}>
        <mesh rotation={[RING2_TILT, 0, 0]} frustumCulled={false}>
          <torusGeometry args={[layout.ringR2, 0.006, 6, 160]} />
          <meshBasicMaterial
            ref={ring2MatRef}
            color={colors.accent}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* Leader lines + spec tags — the HUD layer, screen-true while the
          piece revolves inside it. */}
      <lineSegments frustumCulled={false} renderOrder={9}>
        <primitive object={furniture.leaderGeo} attach="geometry" />
        <lineBasicMaterial
          ref={leaderMatRef}
          color={colors.bright}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
      {furniture.tags.map((tag, i) => (
        <primitive key={`${i}-${tag.label}`} object={tag.sprite} />
      ))}
    </group>
  )
}

function ProjectionStage({ cloud, box, facts }: ProjectionProps) {
  useCanvasTeardownMark()
  // The dark pool fades in under the canvas so the projection owns a stage,
  // not a rectangle. A CSS transition (not GSAP) — one property, once.
  const [veilOn, setVeilOn] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setVeilOn(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    // Bleed past the stage box (console tier never clips) so the emitter
    // ellipse, data rings and tags can breathe outside the product's bounds.
    <div aria-hidden="true" style={{ position: 'absolute', inset: `-${BLEED}` }}>
      <div
        style={{
          position: 'absolute',
          // Reaches 1.5rem past the stage so the feather completes beyond the
          // stage box, not across it (wrapper is inset -BLEED = -3rem).
          inset: '1.5rem',
          borderRadius: '1.5rem',
          background: 'color-mix(in oklab, var(--color-bg) 82%, transparent)',
          // The pool of darkness: the veil dissolves into the page across its
          // outer band — no perceivable rectangle. farthest-side ends the
          // ellipse at the side midpoints, so corners fade out entirely; the
          // border-radius above is the fallback for browsers without mask.
          WebkitMaskImage: VEIL_MASK,
          maskImage: VEIL_MASK,
          opacity: veilOn ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
      />
      <Canvas
        camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV }}
        gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <JarvisProjection cloud={cloud} box={box} facts={facts} />
      </Canvas>
    </div>
  )
}

/**
 * Samples the product image BEFORE mounting any WebGL: no cloud, no context.
 * `sampleImageSilhouette` degrades internally (disc fallback) so the catch is
 * belt-and-braces — on a genuine failure we render null and the host's CSS
 * `.pp-holo` path keeps the stage alive. The sampler's z is a placeholder;
 * the shell bake in the build step owns depth.
 *
 * The aspect read alongside it is what lets an authored marker reach world
 * space (the sampler maps the image BOX, not the tight bounds). It is a cache
 * hit on the URL the sampler just loaded, resolves null rather than throwing,
 * and a null simply returns the spec plates to their frozen composition.
 */
export default function EffectBlueprintCanvas(props: { imageUrl: string; facts?: PassportEffectFacts }) {
  const { imageUrl, facts } = props
  const [sampled, setSampled] = useState<{ cloud: SilhouetteCloud; box: HoloImageBox | null } | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([sampleImageSilhouette(imageUrl, COUNT, FIT, 0.05), decodeImageAspect(imageUrl)])
      .then(([cloud, aspect]) =>
        void (cancelled || setSampled({ cloud, box: aspect ? imageBoxWorldSize(aspect, FIT) : null })))
      .catch(() => void (cancelled || setFailed(true)))
    return () => void (cancelled = true)
  }, [imageUrl])

  if (failed || sampled === null) return null
  return <ProjectionStage cloud={sampled.cloud} box={sampled.box} facts={facts} />
}
