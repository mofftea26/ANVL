import { Canvas } from '@react-three/fiber'
import { DustField } from '@/shared/webgl/DustField'
import type { DustDrive } from '@/shared/webgl/DustField'
import { useCanvasTeardownMark } from '@/shared/webgl/canvasTeardownGuard'
import { CeremonyCrestParticles } from '../webgl/CeremonyCrestParticles'

/**
 * WebGL layer behind the registration ceremony: the ember field the DOM
 * timeline pulses, plus the crest forge that gathers into the ANVL mark and
 * fuses into the seal. Lazy-loaded (vendor-three) and mounted only on capable
 * devices — the DOM ceremony never depends on it.
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
        <CeremonyCrestParticles />
        <DustField drive={drive} count={520} />
      </Canvas>
    </div>
  )
}
