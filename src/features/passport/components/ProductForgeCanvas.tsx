import { Canvas } from '@react-three/fiber'
import { useCanvasTeardownMark } from '@/shared/webgl/canvasTeardownGuard'
import { ProductForgeParticles } from '../webgl/ProductForgeParticles'

/**
 * Lazy WebGL wrapper (vendor-three) for the one-shot product-render forge.
 * Split out so `ProductForgeImage` can code-split three.js away from the DOM
 * path — the image itself never depends on this loading.
 */
export default function ProductForgeCanvas({
  src,
  onReveal,
  onComplete,
}: {
  src: string
  onReveal: () => void
  onComplete: () => void
}) {
  useCanvasTeardownMark()
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 40 }}
      gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
      dpr={[1, 1.5]}
      style={{ pointerEvents: 'none' }}
    >
      <ProductForgeParticles src={src} onReveal={onReveal} onComplete={onComplete} />
    </Canvas>
  )
}
