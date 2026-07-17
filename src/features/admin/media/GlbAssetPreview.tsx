import { Suspense, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Box } from '@/shared/icons'
import { ErrorBoundary } from '@/app/components/ErrorBoundary'
import { ICON_SIZE } from '@/shared/lib/iconSize'

/** Normalizes an arbitrary CMS GLB upload (unknown units/pivot) and spins it
 *  slowly so the card reads as a live 3D preview, not a static screenshot. */
function SpinningModel({ url }: { url: string }) {
  const gltf = useGLTF(url)
  const group = useRef<THREE.Group>(null)
  const norm = useMemo(() => {
    const scene = gltf.scene.clone(true)
    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    const scale = 1.6 / (Math.max(size.x, size.y, size.z) || 1)
    return { scene, scale, center }
  }, [gltf.scene])

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.5
  })

  return (
    <group ref={group} scale={norm.scale}>
      <primitive
        object={norm.scene}
        position={[-norm.center.x, -norm.center.y, -norm.center.z]}
      />
    </group>
  )
}

function GlbPreviewFallback() {
  return (
    <span className="flex flex-col items-center gap-1 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
      <Box size={ICON_SIZE.md} aria-hidden="true" />
      GLB
    </span>
  )
}

/** Lazy-mounted per card (pulls `vendor-three`) — only rendered for
 *  `model/gltf*` assets, never on the default image/video card path. */
export function GlbAssetPreview({ url }: { url: string }) {
  return (
    <ErrorBoundary fallback={GlbPreviewFallback}>
      <Canvas
        camera={{ position: [0, 0.4, 3.2], fov: 40 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
        className="max-h-full max-w-full"
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 4, 5]} intensity={1.1} />
        <directionalLight position={[-3, -2, -4]} intensity={0.4} />
        <Suspense fallback={null}>
          <SpinningModel url={url} />
        </Suspense>
      </Canvas>
    </ErrorBoundary>
  )
}
