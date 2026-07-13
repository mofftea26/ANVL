import { Canvas } from '@react-three/fiber'
import { DustField } from '@/shared/webgl/DustField'
import type { DustDrive } from '@/shared/webgl/DustField'
import { useCanvasTeardownMark } from '@/shared/webgl/canvasTeardownGuard'

/**
 * WebGL ember field behind the claim ceremony. Lazy-loaded (vendor-three)
 * and mounted only on capable devices — the DOM ceremony never depends on it.
 * The ceremony timeline drives `drive.glint` pulses at the strike beat.
 */
export default function CeremonyEmberLayer({ drive }: { drive: DustDrive }) {
  useCanvasTeardownMark()
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 40 }}
        gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
        dpr={[1, 1.5]}
        style={{ pointerEvents: 'none' }}
      >
        <DustField drive={drive} count={520} />
      </Canvas>
    </div>
  )
}
