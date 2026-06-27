import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import type { OathMotionState } from '../motion/oathMotionState'
import type { OathBrandColors } from './oathBrandColors'
import { oathDropLogo } from '../theOathAssets'
import { AnvlOath3D } from './AnvlOath3D'

const LERP = 3.2
/** Warm-bone fallback when no theme emblem color is available. */
const BONE_FALLBACK = '#e8e3d8'
/** Steady turn rate (rad/s) the emblem always rotates at — slow and ceremonial. */
const BASE_SPIN = 0.22

type LogoTone = 'primary' | 'mid' | 'highlight'

/**
 * The Oath Monument — the drop emblem itself, extruded live from the CMS
 * drop-mark SVG into layered 3D (see {@link AnvlOath3D}) and floating in the
 * void above the hero film. At rest it sits **centred behind the hero copy**
 * (vertically centred, set back over the left copy column as a backdrop crest);
 * in the hero it turns slowly and continuously and **only drifts to centre — it
 * stays the same size**
 * through the hero **and the whole middle of the page** (`heroProgress`); the
 * emblem does **not** react to the cursor and does **not** shrink on scroll. A
 * warm-bone key + fill keep it legible. As it recedes through the creed/tenets
 * it **stops rotating, faces the viewer, and darkens** as it sinks to the back;
 * it returns centre, **enlarges**, rises, and its colour **lerps to a
 * primary→accent theme gradient** (still front-facing) for the final oath so it
 * separates from the heading-coloured finale copy — the finale is the only place
 * it grows or changes hue.
 */
export function Monolith({
  motion,
  colors,
}: {
  motion: OathMotionState
  colors: OathBrandColors
}) {
  const { viewport } = useThree()
  const group = useRef<THREE.Group>(null)

  const emblem = useMemo(() => {
    const base = colors.emblem ?? new THREE.Color(BONE_FALLBACK)
    const hex = (c: THREE.Color) => `#${c.getHexString()}`
    return {
      light: base,
      primary: hex(base),
      mid: hex(base.clone().multiplyScalar(0.86)),
      highlight: hex(base.clone().lerp(new THREE.Color('#ffffff'), 0.45)),
      emissive: hex(base),
    }
  }, [colors])
  // Finale gradient targets: the body lerps to `primary`, detail cuts to
  // `accent`, and the secondary band to their midpoint — a primary→accent spread
  // across the emblem's tonal layers, theme-driven via the normalized palette.
  const finaleTone = useMemo(() => {
    const primary = colors.primary ?? new THREE.Color(BONE_FALLBACK)
    const accent = colors.accent ?? new THREE.Color(BONE_FALLBACK)
    return {
      primary: primary.clone(),
      mid: primary.clone().lerp(accent, 0.5),
      highlight: accent.clone(),
    } satisfies Record<LogoTone, THREE.Color>
  }, [colors])

  const startRef = useRef<number | null>(null)
  const yaw = useRef(0)
  const spinVel = useRef(1.4)
  const tmpColor = useRef(new THREE.Color())

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const k = Math.min(1, delta * LERP)
    const t = state.clock.elapsedTime
    if (startRef.current === null) startRef.current = t

    // Entrance: the emblem rises from below and scales in over ~1.5s.
    const age = t - startRef.current
    const introT = Math.min(1, age / 1.5)
    const intro = 1 - Math.pow(1 - introT, 4)
    const introScale = 0.6 + 0.4 * intro
    const introLift = (1 - intro) * -0.9

    // — Scene pose: hero (SMALL, above the eyebrow → only drifts to centre, no
    //   enlarge) → creed (recede) → finale (return centre/front, ENLARGE). —
    const recede = Math.max(motion.manifestoProgress, motion.tenetsActive)
    const rise = motion.finaleProgress
    const heroCenter = motion.heroProgress
    const settle = (1 - recede) * (1 - rise)

    // Hero at-rest pose: the emblem sits centred BEHIND the hero copy column —
    // vertically centred on the text, set back over the left copy block (not off
    // in the scene), at a larger at-rest size so it reads as a backdrop crest
    // behind the headline. As the hero scrolls it drifts to screen centre; later
    // scenes pull it fully centre; the finale is the only place it grows further.
    const restX = -viewport.width * 0.26
    const restY = 0
    const bob = Math.sin(t * 0.6) * 0.09
    const breath = Math.sin(t * 0.4 + 1.2) * 0.18

    const targetX = restX * (1 - heroCenter) * settle
    const targetY =
      restY * (1 - heroCenter) * settle +
      bob +
      introLift +
      heroCenter * 0.12 * settle +
      rise * 0.15
    const targetZ = -recede * 5 + rise * 3.6 + breath
    // Constant scale through the hero AND the whole middle of the page — it never
    // shrinks on scroll. ONLY the finale (`rise`) grows it to its large pose. The
    // intro still scales it in. Larger at-rest size so the crest reads as a
    // backdrop behind the hero copy.
    const SMALL = 0.5
    const FINALE = 1.55
    const baseScale = SMALL + (FINALE - SMALL) * rise
    const targetScale = baseScale * introScale

    g.position.x += (targetX - g.position.x) * k
    g.position.y += (targetY - g.position.y) * k
    g.position.z += (targetZ - g.position.z) * k
    const s = g.scale.x + (targetScale - g.scale.x) * k
    g.scale.setScalar(s)

    // — Darken smoothly as it recedes to the back (full in hero), then lerp to
    //   the finale primary→accent gradient as it returns for the oath. —
    const dim = 1 - recede * 0.6
    g.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const mat = mesh.material as THREE.MeshStandardMaterial
      if (!mat || !mat.color) return
      const ud = mat.userData as {
        baseColor?: THREE.Color
        baseEmissive?: number
        tone?: LogoTone
      }
      if (!ud.baseColor) {
        ud.baseColor = mat.color.clone()
        ud.baseEmissive = mat.emissiveIntensity ?? 0
      }
      // Base tone → finale gradient over `rise`, then the recede dim on top.
      tmpColor.current.copy(ud.baseColor)
      if (rise > 0.001) {
        tmpColor.current.lerp(finaleTone[ud.tone ?? 'primary'], rise)
      }
      mat.color.copy(tmpColor.current).multiplyScalar(dim)
      if (mat.emissive) mat.emissiveIntensity = (ud.baseEmissive ?? 0) * dim
    })

    // — Rotation: free spin in the hero; once it recedes (or rises in the
    //   finale) it stops and settles to face the viewer head-on. No cursor. —
    const atBack = recede > 0.04 || rise > 0.04
    if (atBack) {
      const front = Math.round(yaw.current / (Math.PI * 2)) * (Math.PI * 2)
      yaw.current += (front - yaw.current) * Math.min(1, delta * 2.5)
      spinVel.current = 0
    } else {
      spinVel.current += (BASE_SPIN - spinVel.current) * Math.min(1, delta * 0.8)
      yaw.current += spinVel.current * delta
    }
    g.rotation.y = yaw.current
    const targetRotX = atBack ? 0 : Math.sin(t * 0.27) * 0.08
    g.rotation.x += (targetRotX - g.rotation.x) * k
    g.rotation.z += (0 - g.rotation.z) * k
  })

  return (
    <>
      {/* Steady key + front fill + rim so the emblem is legible at rest. Lights
          are warm bone. Low metalness: the scene has no environment map, so
          high-metalness PBR renders near-black. */}
      <ambientLight intensity={0.6} color={emblem.light} />
      <directionalLight color={emblem.light} intensity={2.0} position={[-2.5, 3, 4]} />
      <directionalLight color={emblem.light} intensity={0.85} position={[0, 0.5, 6]} />
      <directionalLight color={emblem.light} intensity={0.5} position={[3, -1.5, 1]} />
      <pointLight
        color={emblem.light}
        intensity={22}
        distance={18}
        decay={1.6}
        position={[1.6, 1.2, 3]}
      />

      <group ref={group} position={[-1.7, 0.9, 0]} scale={0.2}>
        <AnvlOath3D
          svgUrl={oathDropLogo()}
          size={2.6}
          depth={130}
          bevelThickness={8}
          bevelSize={5}
          metalness={0.5}
          roughness={0.46}
          emissive={emblem.emissive}
          emissiveIntensity={0.06}
          colors={{
            primary: emblem.primary,
            mid: emblem.mid,
            highlight: emblem.highlight,
          }}
        />
      </group>
    </>
  )
}
