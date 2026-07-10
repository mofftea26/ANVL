import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { gsap } from '@/shared/lib/gsap'
import { useCanvasTeardownMark } from '@/shared/webgl/canvasTeardownGuard'
import { EmberAnvil, type EmberAnvilHandle } from './EmberAnvil'
import {
  EMBER_DRIFT_FRAGMENT,
  EMBER_DRIFT_VERTEX,
} from './emberForgeShaders'

/** DOM event the scene fires on every hammer strike (countdown kicks on it). */
export const COMING_SOON_STRIKE_EVENT = 'anvl:coming-soon:strike'

const INTERACTION_PLANE = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)

/** Ambient embers rising through the room around the anvil. */
function EmberDrift({ count, accent }: { count: number; accent: string }) {
  // Mutate through the mounted material — R3F does not preserve the identity
  // of the `uniforms` prop object (same pattern as DustField/EmberAnvil).
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 16
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1
      seeds[i] = Math.random()
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 20)
    return geo
  }, [count])

  const uniforms = useMemo(() => {
    const hot = new THREE.Color(accent)
    return {
      uTime: { value: 0 },
      uSize: { value: 0.07 },
      uEmberColor: { value: hot.clone().multiplyScalar(0.55) },
      uHotColor: { value: hot },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((state) => {
    const u = materialRef.current?.uniforms
    if (u) u.uTime.value = state.clock.elapsedTime
  })

  return (
    <points frustumCulled={false}>
      <primitive object={geometry} attach="geometry" />
      <shaderMaterial
        ref={materialRef}
        vertexShader={EMBER_DRIFT_VERTEX}
        fragmentShader={EMBER_DRIFT_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/** Soft radial forge-glow pooled under the anvil (canvas-generated sprite). */
function ForgeGlow({ accent }: { accent: string }) {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  const texture = useMemo(() => {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const gradient = ctx.createRadialGradient(
        size / 2, size / 2, 0,
        size / 2, size / 2, size / 2,
      )
      gradient.addColorStop(0, accent)
      gradient.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, size, size)
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [accent])

  useEffect(() => () => texture.dispose(), [texture])

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.opacity =
        0.1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.03
    }
  })

  return (
    <mesh position={[0, -2.1, -0.5]} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[11, 11]} />
      <meshBasicMaterial
        ref={materialRef}
        map={texture}
        transparent
        opacity={0.12}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

/**
 * Pointer + camera rig: raycasts the pointer onto the anvil's plane every
 * frame (feeding the forge-poke), tracks pointer velocity as "activity", and
 * drifts the camera toward the cursor for depth. Strikes ray through the
 * click point, kick the camera, and notify the DOM.
 */
function InteractionRig({
  anvilRef,
}: {
  anvilRef: React.MutableRefObject<EmberAnvilHandle | null>
}) {
  const { camera, raycaster, pointer, gl } = useThree()
  const stateRef = useRef({
    world: new THREE.Vector3(),
    lastPointer: new THREE.Vector2(),
    activity: 0,
  })

  useEffect(() => {
    const onPointerDown = () => {
      const s = stateRef.current
      raycaster.setFromCamera(pointer, camera)
      if (raycaster.ray.intersectPlane(INTERACTION_PLANE, s.world)) {
        anvilRef.current?.strike(s.world)
        // Camera recoil sells the impact.
        gsap.fromTo(
          camera.position,
          { z: camera.position.z - 0.45 },
          { z: 8.4, duration: 1.2, ease: 'elastic.out(1, 0.45)' },
        )
        window.dispatchEvent(new CustomEvent(COMING_SOON_STRIKE_EVENT))
      }
    }
    const el = gl.domElement
    el.addEventListener('pointerdown', onPointerDown)
    return () => el.removeEventListener('pointerdown', onPointerDown)
  }, [anvilRef, camera, gl, pointer, raycaster])

  useFrame(() => {
    const s = stateRef.current
    // Pointer speed → ignition energy (decays inside the anvil handle).
    const speed = Math.hypot(pointer.x - s.lastPointer.x, pointer.y - s.lastPointer.y)
    s.lastPointer.set(pointer.x, pointer.y)
    s.activity = Math.min(1, s.activity * 0.92 + speed * 9)

    raycaster.setFromCamera(pointer, camera)
    if (raycaster.ray.intersectPlane(INTERACTION_PLANE, s.world)) {
      anvilRef.current?.setPointer(s.world, s.activity)
    }

    // Cinematic drift: the camera leans with the cursor.
    camera.position.x += (pointer.x * 1.1 - camera.position.x) * 0.04
    camera.position.y += (0.35 + pointer.y * 0.6 - camera.position.y) * 0.04
    camera.lookAt(0, 0, 0)
  })

  return null
}

function SceneContents({ accent, quality }: { accent: string; quality: 'high' | 'lite' }) {
  const anvilRef = useRef<EmberAnvilHandle | null>(null)
  const anvilCount = quality === 'high' ? 24_000 : 9_000
  const driftCount = quality === 'high' ? 900 : 350

  return (
    <>
      <Suspense fallback={null}>
        <EmberAnvil count={anvilCount} accent={accent} handleRef={anvilRef} />
      </Suspense>
      <EmberDrift count={driftCount} accent={accent} />
      <ForgeGlow accent={accent} />
      <InteractionRig anvilRef={anvilRef} />
    </>
  )
}

function TeardownMark() {
  useCanvasTeardownMark()
  return null
}

/**
 * The Coming Soon WebGL stage — an anvil forged from live ember particles.
 * Fills its parent; pointer-events stay ON (the strike interaction needs
 * them), so it mounts *behind* the content column which re-enables its own
 * pointer events selectively.
 */
export default function ComingSoonScene({
  accent,
  quality,
}: {
  accent: string
  quality: 'high' | 'lite'
}) {
  return (
    <Canvas
      camera={{ fov: 42, position: [0, 0.35, 8.4], near: 0.1, far: 60 }}
      dpr={quality === 'high' ? [1, 1.75] : [1, 1.25]}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <TeardownMark />
      <SceneContents accent={accent} quality={quality} />
    </Canvas>
  )
}
