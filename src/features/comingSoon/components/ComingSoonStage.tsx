import { Suspense, lazy, useEffect, useState } from 'react'
import { isWebglAvailable } from '@/shared/webgl/isWebglAvailable'

const ComingSoonScene = lazy(() => import('../scene/ComingSoonScene'))

/** High quality needs a real GPU pipeline + a cursor; touch gets the lite tier. */
const HIGH_QUALITY_MQ = '(min-width: 768px) and (pointer: fine)'
const MOTION_OK_MQ = '(prefers-reduced-motion: no-preference)'

/**
 * Mount gate for the WebGL forge: client + WebGL-capable + motion consent.
 * Reduced-motion users and no-WebGL browsers never download `vendor-three`;
 * they keep the cinematic still environment instead. Touch devices get a
 * lighter particle budget and capped DPR.
 */
export function ComingSoonStage({ accent }: { accent: string }) {
  const [mode, setMode] = useState<'off' | 'lite' | 'high'>('off')

  useEffect(() => {
    const motion = window.matchMedia(MOTION_OK_MQ)
    const high = window.matchMedia(HIGH_QUALITY_MQ)
    const update = () => {
      if (!motion.matches || !isWebglAvailable()) {
        setMode('off')
        return
      }
      setMode(high.matches ? 'high' : 'lite')
    }
    update()
    motion.addEventListener('change', update)
    high.addEventListener('change', update)
    return () => {
      motion.removeEventListener('change', update)
      high.removeEventListener('change', update)
    }
  }, [])

  if (mode === 'off') return null

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Suspense fallback={null}>
        <ComingSoonScene accent={accent} quality={mode} />
      </Suspense>
    </div>
  )
}
