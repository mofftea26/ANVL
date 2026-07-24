import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useCursor } from '@react-three/drei'
import { readThemeCssColor } from '@/shared/lib/themeColor'
import type { AboutResolvedOrb } from '../content/aboutContent.defaults'
import type { AltarOrbitParams } from './altarOrbs'
import type { AltarState } from './altarState'
import { ANVIL_FACE_Y } from './AltarAnvil'
import { PALANTIR_FRAGMENT, PALANTIR_VERTEX } from './shaders/palantir'

export const ORB_RADIUS = 0.17
/**
 * OCCLUSION CONTRACT with the hammer (see AltarHammer's HAMMER_RENDER_ORDER):
 * the orbit's near point (z = +ORBIT_RZ = 1.15) passes CLOSER to the camera
 * than the hammer's swing plane (seat z 0.28 + 0.5 forward = 0.78), so with
 * default depth writes an orbiting stone would legitimately depth-occlude the
 * hammer no matter who draws last. Two rules keep the hammer the undisputed
 * foreground actor:
 *  1. Every orb mesh takes this explicit LOW render order — strictly below
 *     the hammer's — so orbs always paint first in the transparent pass
 *     (both stone and halo share it; three.js falls back to back-to-front z
 *     sorting between orbs, which keeps orb-over-orb blending correct).
 *  2. The stone's material sets `depthWrite: false` (it previously used the
 *     three.js default `true`): the stone still depth-TESTS against the
 *     opaque anvil (hidden on the orbit's far side, as before) but no longer
 *     stamps the depth buffer, so the hammer — drawn after — can never be
 *     depth-rejected by a nearer stone.
 */
export const ORB_RENDER_ORDER = 1
/** Orbit ellipse around the anvil (x wide, z shallow for perspective depth). */
const ORBIT_RX = 2.75
const ORBIT_RZ = 1.15
const ORBIT_Y = 0.62
/** Slow, ceremonial ring — a full lap takes ~80s. */
const ORBIT_RATE = 0.08
/** Seated orbs shrink to rest on the anvil face like a workpiece. */
export const ORB_SEAT_SCALE = 0.62
/** Where a focused orb seats for the strike — resting ON the anvil face
 *  (shrunken radius + a hair of squish), shared with the hammer/burst. */
export const ORB_SEAT = new THREE.Vector3(
  0,
  ANVIL_FACE_Y + ORB_RADIUS * ORB_SEAT_SCALE + 0.02,
  0.28,
)

/**
 * THE CHIP FIX — the orb's name chip is now an IN-CANVAS sprite, not DOM.
 *
 * It used to be a drei `<Html>` element: real DOM floating in an overlay div
 * ABOVE the entire WebGL canvas. No renderOrder / depthWrite / depthTest
 * change inside the canvas can ever draw a 3D object over composited DOM —
 * which is exactly why the hammer kept rendering "behind the chips" no matter
 * what the scene did. Rasterizing the label into a CanvasTexture on a
 * `<sprite>` puts the chip INSIDE the scene graph, where the hammer's higher
 * render order (and the DOM-free compositing) guarantees it passes in front.
 *
 * Typography is matched to the old DOM chip (`anvl-display text-[10px]
 * tracking-[0.28em] text-[var(--color-heading)]/90`): the document's
 * `--font-display` family, weight 600, uppercase, manual per-glyph tracking
 * (2D-canvas `letterSpacing` support is uneven), heading color via theme
 * token. Drawn at 64px and scaled down in world units for crisp glyphs; the
 * draw re-runs once `document.fonts` settles so the brand font (not the
 * fallback serif) is what ships to the GPU.
 */
const LABEL_FONT_PX = 64
const LABEL_TRACKING_EM = 0.28
const LABEL_PAD_PX = 24
/** Sprite world height ≈ the old 10px DOM chip at the altar camera distance. */
const LABEL_WORLD_H = 0.11

function createLabelTexture(
  label: string,
): { texture: THREE.CanvasTexture; aspect: number } | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const family =
    getComputedStyle(document.documentElement).getPropertyValue('--font-display').trim() ||
    'Cinzel'
  const font = `600 ${LABEL_FONT_PX}px ${family}, serif`
  const text = label.toUpperCase()
  const tracking = LABEL_FONT_PX * LABEL_TRACKING_EM
  ctx.font = font
  let width = 0
  for (const ch of text) width += ctx.measureText(ch).width + tracking
  width = Math.max(1, width - tracking)
  canvas.width = Math.ceil(width) + LABEL_PAD_PX * 2
  canvas.height = LABEL_FONT_PX * 2
  // Resizing a canvas resets its 2D context state — set text state again.
  ctx.font = font
  ctx.textBaseline = 'middle'
  ctx.fillStyle = readThemeCssColor('--color-heading', '#E7E4DF')
  let x = LABEL_PAD_PX
  for (const ch of text) {
    ctx.fillText(ch, x, canvas.height / 2)
    x += ctx.measureText(ch).width + tracking
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return { texture, aspect: canvas.width / canvas.height }
}

function useLabelSprite(
  label: string,
): { texture: THREE.CanvasTexture; aspect: number } | null {
  const [sprite, setSprite] = useState<{ texture: THREE.CanvasTexture; aspect: number } | null>(
    null,
  )
  useEffect(() => {
    if (typeof document === 'undefined') return
    let disposed = false
    const textures: THREE.CanvasTexture[] = []
    const build = () => {
      const built = createLabelTexture(label)
      if (!built) return
      if (disposed) {
        built.texture.dispose()
        return
      }
      textures.push(built.texture)
      setSprite(built)
    }
    build()
    // Redraw once the webfonts settle — the first draw may have used the
    // serif fallback if Cinzel wasn't loaded yet.
    document.fonts?.ready.then(() => {
      if (!disposed) build()
    })
    return () => {
      disposed = true
      for (const t of textures) t.dispose()
    }
  }, [label])
  return sprite
}

const FRESNEL_VERTEX = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`

const FRESNEL_FRAGMENT = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform float uStrength;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.4);
  gl_FragColor = vec4(uColor, fresnel * uStrength);
}
`

/**
 * One orbiting **palantír** — a near-black polished seeing-stone with a storm
 * of smoke and fire swirling in its depths, tinted by the orb's own CMS
 * color, wrapped in a faint fresnel aura, with a DOM label. Hovering wakes
 * the stone (the storm quickens and brightens); when focused it glides onto
 * the anvil seat, shrinking like a workpiece; at impact it **disintegrates**
 * (`explodeT` — its matter hands over 1:1 to the modal-forge embers, which
 * then stream out to FORM the modal), then re-materializes in orbit on
 * release. Clicks raycast on the stone. The name chip is an in-canvas sprite,
 * never DOM (see createLabelTexture).
 */
export function AltarOrb({
  orb,
  index,
  orbit,
  state,
  onSelect,
}: {
  orb: AboutResolvedOrb
  index: number
  orbit: AltarOrbitParams
  state: AltarState
  onSelect: (index: number) => void
}) {
  const group = useRef<THREE.Group>(null)
  const stone = useRef<THREE.ShaderMaterial | null>(null)
  const halo = useRef<THREE.ShaderMaterial | null>(null)
  const labelMat = useRef<THREE.SpriteMaterial | null>(null)
  const labelSprite = useLabelSprite(orb.label)
  const angle = useRef(orbit.phase)
  const hoverLift = useRef(0)
  const swirlClock = useRef(Math.random() * 20)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)

  const color = useMemo(() => new THREE.Color(orb.color), [orb.color])

  const stoneUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSeed: { value: index * 1.618 + 0.37 },
      uColor: { value: color.clone() },
      uIntensity: { value: 0.85 },
      uDissolve: { value: 1 },
    }),
    // Rebuilt only when the orb's color changes (CMS edit → remount).
    [color, index],
  )
  const haloUniforms = useMemo(
    () => ({ uColor: { value: color.clone() }, uStrength: { value: 0.5 } }),
    [color],
  )

  useFrame((frame, delta) => {
    const g = group.current
    if (!g) return
    const t = frame.clock.elapsedTime
    const k = Math.min(1, delta * 5)

    angle.current += delta * ORBIT_RATE * orbit.speed * state.orbitSpeed

    const focus = state.focusT[index] ?? 0
    const isActive = state.activeIndex === index
    const explode = isActive ? state.explodeT : 0

    hoverLift.current += ((hovered && state.activeIndex === -1 ? 1 : 0) - hoverLift.current) * k

    const ox = Math.cos(angle.current) * ORBIT_RX
    const oz = Math.sin(angle.current) * ORBIT_RZ
    const oy = ORBIT_Y + Math.sin(t * 0.8 + orbit.bobPhase) * 0.16 + hoverLift.current * 0.08

    g.position.set(
      ox + (ORB_SEAT.x - ox) * focus,
      oy + (ORB_SEAT.y - oy) * focus,
      oz + (ORB_SEAT.z - oz) * focus,
    )

    // Seated orbs shrink onto the face like a workpiece; at impact the stone
    // DISINTEGRATES in place — a bare swell as it lets go (no explosion
    // bloom), its matter handing over 1:1 to the modal-forge embers.
    const squash = isActive ? state.flash * 0.3 : 0
    const grow =
      (1 + hoverLift.current * 0.12) *
      (1 - focus * (1 - ORB_SEAT_SCALE)) *
      (1 + explode * 0.12)
    g.scale.set(grow * (1 + squash * 0.5), grow * (1 - squash), grow * (1 + squash * 0.5))
    g.visible = explode < 0.985

    const dissolve = Math.pow(1 - explode, 1.5)
    const dim = state.activeIndex >= 0 && !isActive ? 1 - state.ringDim * 0.78 : 1

    // The stone wakes under the hand: the storm quickens and brightens.
    swirlClock.current += delta * (1 + hoverLift.current * 1.6 + (isActive ? 1.2 : 0))
    if (stone.current) {
      const u = stone.current.uniforms
      u.uTime.value = swirlClock.current
      u.uIntensity.value =
        dim * (0.85 + hoverLift.current * 0.5 + (isActive ? state.flash * 2.6 + explode * 0.9 : 0))
      u.uDissolve.value = dissolve
    }
    if (halo.current) {
      halo.current.uniforms.uStrength.value =
        (0.5 + hoverLift.current * 0.4 + explode * 0.6) * dim * dissolve
    }
    if (labelMat.current) {
      labelMat.current.opacity = 0.9 * dim * (1 - focus)
    }
  })

  return (
    <group ref={group}>
      <mesh
        renderOrder={ORB_RENDER_ORDER}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(index)
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[ORB_RADIUS, 48, 48]} />
        {/* depthWrite=false: see ORB_RENDER_ORDER — a near-orbit stone must
            never stamp depth over the hammer's swing plane. */}
        <shaderMaterial
          ref={stone}
          vertexShader={PALANTIR_VERTEX}
          fragmentShader={PALANTIR_FRAGMENT}
          uniforms={stoneUniforms}
          transparent
          depthWrite={false}
        />
      </mesh>
      {/* Faint mystical aura around the stone. Shares the stone's render order
          so same-orb draw order (stone → halo, by object id) and inter-orb
          z-sorting both stay intact. */}
      <mesh scale={1.45} renderOrder={ORB_RENDER_ORDER}>
        <sphereGeometry args={[ORB_RADIUS, 24, 24]} />
        <shaderMaterial
          ref={halo}
          vertexShader={FRESNEL_VERTEX}
          fragmentShader={FRESNEL_FRAGMENT}
          uniforms={haloUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* The name chip — an IN-CANVAS sprite (see the chip-fix comment at
          createLabelTexture): it lives in the scene graph at the orbs' render
          order, so the hammer (higher order) genuinely passes in front of it,
          which DOM (drei Html) made impossible. */}
      {labelSprite ? (
        <sprite
          position={[0, -0.42, 0]}
          scale={[LABEL_WORLD_H * labelSprite.aspect, LABEL_WORLD_H, 1]}
          renderOrder={ORB_RENDER_ORDER}
        >
          <spriteMaterial
            ref={labelMat}
            map={labelSprite.texture}
            transparent
            depthWrite={false}
            opacity={0.9}
          />
        </sprite>
      ) : null}
    </group>
  )
}
