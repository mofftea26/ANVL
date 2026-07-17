import { useEffect, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { createDustDrive, DustField } from '@/shared/webgl/DustField'
import { useCanvasTeardownMark } from '@/shared/webgl/canvasTeardownGuard'
import type { PassportMotionState } from './passportMotionState'
import { PassportForgeParticles } from './PassportForgeParticles'

/**
 * The passport console's fixed full-viewport canvas: the bento-card ember
 * tracing plus a quiet dust field. Lazy-loaded (vendor-three) behind
 * PassportForgeGate. Pointer-transparent — all interaction stays in the DOM.
 */
export default function PassportForgeCanvas({ motion }: { motion: PassportMotionState }) {
  useCanvasTeardownMark()
  const dust = useMemo(() => createDustDrive({ decayGlint: true, lift: 0.5 }), [])

  // One passive pointer listener feeds the dust parallax.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1
      const ny = (e.clientY / window.innerHeight) * 2 - 1
      motion.pointerX = nx
      motion.pointerY = ny
      dust.pointerX = nx
      dust.pointerY = ny
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [motion, dust])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" data-passport-forge>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 40 }}
        gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
        // 1.5 max: additive point sprites gain nothing visible above it, and
        // dropping from 1.75 cuts fragment work ~27% on high-dpi screens.
        dpr={[1, 1.5]}
        style={{ pointerEvents: 'none' }}
      >
        <PassportForgeParticles motion={motion} />
        <DustField drive={dust} count={280} />
      </Canvas>
    </div>
  )
}
