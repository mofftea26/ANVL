import { useEffect, useRef, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { useExperience } from '../ExperienceProvider'

/**
 * Experience-driven page-transition overlay. For experiences whose
 * `pageTransition` is `forgeWipe` (Theoath Modern), a champagne-edged steel
 * panel sweeps away to reveal each new route. Other experiences render nothing
 * (classic fade). Reduced motion collapses the wipe to an instant via CSS.
 *
 * Must be rendered inside the storefront `ExperienceProvider`.
 */
export function ExperiencePageTransition() {
  const { pageTransition } = useExperience()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [playKey, setPlayKey] = useState<string | null>(null)
  const firstRef = useRef(true)

  useEffect(() => {
    // Skip the initial mount (no wipe on first paint).
    if (firstRef.current) {
      firstRef.current = false
      return
    }
    if (pageTransition !== 'forgeWipe') return
    setPlayKey(pathname)
  }, [pathname, pageTransition])

  if (pageTransition !== 'forgeWipe' || playKey === null) return null

  return (
    <div
      key={playKey}
      className="tm-page-transition"
      data-state="reveal"
      aria-hidden="true"
      onAnimationEnd={() => setPlayKey(null)}
    />
  )
}
