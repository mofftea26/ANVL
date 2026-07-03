import { useEffect, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { createDustDrive, DustField } from './DustField'
import { siteDustState } from './siteDustState'

/**
 * The global dust canvas — one fixed, pointer-transparent layer behind the
 * page content on every storefront route (mounted by `SiteDustGate`). Tracks
 * the pointer itself (one passive listener) and follows the shared
 * {@link siteDustState} modulation targets so any page can still or brighten
 * the field without owning a canvas.
 */
export default function SiteDustLayer() {
  const drive = useMemo(() => createDustDrive({ decayGlint: true }), [])

  useEffect(() => {
    let lastX = 0
    let lastY = 0
    let lastT = 0
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1
      const ny = (e.clientY / window.innerHeight) * 2 - 1
      const now = e.timeStamp
      if (lastT > 0) {
        const dt = Math.max(8, now - lastT) / 1000
        drive.pointerVX = (nx - lastX) / dt
        drive.pointerVY = (ny - lastY) / dt
      }
      drive.pointerX = nx
      drive.pointerY = ny
      lastX = nx
      lastY = ny
      lastT = now
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      drive.pointerVX = 0
      drive.pointerVY = 0
    }
  }, [drive])

  // Follow the global modulation targets (pages write; the drive's own
  // decayGlint handles pulse fall-off inside the field).
  useEffect(() => {
    let raf = 0
    const sync = () => {
      drive.lift = siteDustState.lift
      if (siteDustState.glint > drive.glint) drive.glint = siteDustState.glint
      siteDustState.glint = drive.glint
      raf = requestAnimationFrame(sync)
    }
    raf = requestAnimationFrame(sync)
    return () => cancelAnimationFrame(raf)
  }, [drive])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1]" data-site-dust>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 40 }}
        gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
        dpr={[1, 1.5]}
        style={{ pointerEvents: 'none' }}
      >
        <DustField drive={drive} count={450} />
      </Canvas>
    </div>
  )
}
