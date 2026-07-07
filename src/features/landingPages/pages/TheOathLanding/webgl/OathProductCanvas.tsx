import { Suspense, useMemo } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import {
  ContactShadows,
  Environment,
  Lightformer,
  useGLTF,
} from '@react-three/drei'
import { readOathBrandColors } from './oathBrandColors'
import { useCanvasTeardownMark } from '@/shared/webgl/canvasTeardownGuard'

/**
 * Lazy WebGL viewer for a product GLB assigned through the CMS (`modelId`). Held
 * static (no auto-rotation) so the 2D annotation hotspots stay aligned with the
 * model. Lit by in-scene Lightformers (image-based reflections without a network
 * HDR); low-metalness friendly. Mounted only by {@link OathProductViewer}.
 */
function Model({ url }: { url: string }) {
  const gltf = useGLTF(url)
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene])
  const norm = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    const scale = 2.4 / (Math.max(size.x, size.y, size.z) || 1)
    return { scale, center }
  }, [scene])
  return (
    <group scale={norm.scale} position={[0, 0, 0]}>
      <primitive
        object={scene}
        position={[-norm.center.x, -norm.center.y, -norm.center.z]}
      />
    </group>
  )
}

export default function OathProductCanvas({ modelUrl }: { modelUrl: string }) {
  const colors = useMemo(() => readOathBrandColors(), [])
  const warm = `#${colors.ember.getHexString()}`
  const bone = `#${colors.bone.getHexString()}`
  useCanvasTeardownMark()

  return (
    <Canvas
      camera={{ position: [0, 0.2, 5], fov: 38 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
    >
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={2.2} color={warm} position={[3, 3, 2]} scale={[5, 5, 1]} />
        <Lightformer intensity={1} color={bone} position={[-4, 1.5, -1]} scale={[3, 6, 1]} />
        <Lightformer intensity={0.6} color={bone} position={[0, 2, -5]} scale={[8, 3, 1]} />
      </Environment>
      <ambientLight intensity={0.2} color={bone} />
      <directionalLight position={[3, 4, 5]} intensity={0.7} color={warm} />
      <Suspense fallback={null}>
        <Model url={modelUrl} />
      </Suspense>
      <ContactShadows
        position={[0, -1.4, 0]}
        scale={8}
        blur={2.6}
        opacity={0.5}
        far={3}
        color="#000000"
        resolution={512}
      />
    </Canvas>
  )
}
