import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { DUST_FRAGMENT, DUST_VERTEX } from './dustShaders'

const LERP = 3.4
/** Glint decay applied when the drive requests decay (one-shot pulses). */
const GLINT_DECAY = 1.4

/**
 * Per-frame targets the field lerps toward. A plain mutable object owned by
 * the mounting context (global layer, a page's scene canvas) — write targets,
 * never React state.
 */
export interface DustDrive {
  /** 1 = full drift; 0..1 stills the field. */
  lift: number
  /** 0..1 breath brightness. When `decayGlint` is set, the field decays this
   *  back toward 0 itself (one-shot pulse semantics). */
  glint: number
  /** Pointer normalized to the viewport centre (-1..1). */
  pointerX: number
  pointerY: number
  /** Pointer velocity (normalized units / second). */
  pointerVX: number
  pointerVY: number
  /** One-shot pulse mode: the field decays `glint` back to 0 each frame. */
  decayGlint?: boolean
}

export function createDustDrive(overrides: Partial<DustDrive> = {}): DustDrive {
  return {
    lift: 1,
    glint: 0,
    pointerX: 0,
    pointerY: 0,
    pointerVX: 0,
    pointerVY: 0,
    ...overrides,
  }
}

const PARTICLE_FALLBACK = '#E7E4DF'

function cssColor(varName: string): THREE.Color {
  if (typeof window === 'undefined') return new THREE.Color(PARTICLE_FALLBACK)
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  try {
    return new THREE.Color(raw || PARTICLE_FALLBACK)
  } catch {
    return new THREE.Color(PARTICLE_FALLBACK)
  }
}

function buildDustGeometry(count: number): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  const phase = new Float32Array(count)
  const speed = new Float32Array(count)
  const size = new Float32Array(count)
  const depth = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 12
    positions[i * 3 + 1] = (Math.random() - 0.5) * 7
    positions[i * 3 + 2] = -3 + Math.random() * 4
    phase[i] = Math.random()
    speed[i] = 0.4 + Math.random() * 1.0
    size[i] = 1.5 + Math.random() * 3.5
    depth[i] = Math.random()
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
  geo.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1))
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
  geo.setAttribute('aDepth', new THREE.BufferAttribute(depth, 1))
  return geo
}

/**
 * The site's one dust implementation — bone-grey motes drifting through the
 * dark, parted by the cursor. Mount inside any R3F `<Canvas>` and feed it a
 * {@link DustDrive}; the field lerps its uniforms toward the drive's targets
 * every frame (scrub/pointer jitter smoothing) and pauses when the tab hides.
 * Colors come from the theme's `--particle-*` CSS variables at mount, so the
 * CMS palette controls the field everywhere it appears.
 */
export function DustField({ drive, count }: { drive: DustDrive; count: number }) {
  const material = useRef<THREE.ShaderMaterial | null>(null)
  const geometry = useMemo(() => buildDustGeometry(count), [count])
  useEffect(() => () => geometry.dispose(), [geometry])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uLift: { value: 1 },
      uGlint: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uPointerForce: { value: 0 },
      uPixelRatio: {
        value: typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio, 2),
      },
      uColorPrimary: { value: cssColor('--particle-primary') },
      uColorSecondary: { value: cssColor('--particle-secondary') },
      uColorHighlight: { value: cssColor('--particle-highlight') },
    }),
    // Built once per mount — theme edits re-read on the next canvas mount.
    [],
  )

  const visibleRef = useRef(true)
  useEffect(() => {
    const onVisibility = () => {
      visibleRef.current = document.visibilityState === 'visible'
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useFrame((state, delta) => {
    const mat = material.current
    if (!mat || !visibleRef.current) return
    const k = Math.min(1, delta * LERP)
    const u = mat.uniforms

    u.uTime.value += delta
    if (drive.decayGlint) {
      drive.glint = Math.max(0, drive.glint - delta * GLINT_DECAY)
    }
    u.uLift.value += (drive.lift - u.uLift.value) * k
    u.uGlint.value += (Math.min(1, drive.glint) - u.uGlint.value) * k

    const p = u.uPointer.value as THREE.Vector2
    const targetX = (drive.pointerX * state.viewport.width) / 2
    const targetY = (-drive.pointerY * state.viewport.height) / 2
    p.x += (targetX - p.x) * k
    p.y += (targetY - p.y) * k
    const speed = Math.min(1, Math.hypot(drive.pointerVX, drive.pointerVY) * 0.35)
    u.uPointerForce.value += (0.4 + speed * 0.6 - u.uPointerForce.value) * k
  })

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        vertexShader={DUST_VERTEX}
        fragmentShader={DUST_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
