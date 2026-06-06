import { useEffect, useState } from 'react'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'

export type MotionTier = 'desktop' | 'tablet' | 'mobile'

export interface ResponsiveMotionConfig {
  tier: MotionTier
  reduced: boolean
  /** True only when full pinned/scrubbed cinema should run. */
  cinematic: boolean
}

function readTier(): MotionTier {
  if (typeof window === 'undefined') return 'desktop'
  if (window.matchMedia('(min-width: 1024px)').matches) return 'desktop'
  if (window.matchMedia('(min-width: 768px)').matches) return 'tablet'
  return 'mobile'
}

/**
 * Component-level view of the active motion tier (the master scroll hook does
 * its own `gsap.matchMedia` gating; this is for cheap per-component decisions).
 * SSR-stable: defaults to desktop on the server, resolves on mount.
 */
export function useResponsiveMotionConfig(): ResponsiveMotionConfig {
  const reduced = useReducedMotion()
  const [tier, setTier] = useState<MotionTier>('desktop')

  useEffect(() => {
    const update = () => setTier(readTier())
    update()
    const queries = [
      window.matchMedia('(min-width: 1024px)'),
      window.matchMedia('(min-width: 768px)'),
    ]
    queries.forEach((q) => q.addEventListener('change', update))
    return () => queries.forEach((q) => q.removeEventListener('change', update))
  }, [])

  return { tier, reduced, cinematic: !reduced && tier !== 'mobile' }
}
