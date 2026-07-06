import { useEffect } from 'react'

const PULSE_CLASS = 'anvl-highlight-pulse'
const PULSE_DURATION_MS = 2000

/**
 * Mounted by an addressable section (About orb, PDP tile). No-op unless the
 * current `location.hash` matches `elementId` — then scrolls it into view and
 * applies a brief pulse. Safe to mount on every instance of a repeated
 * component; only the one matching the hash ever does anything.
 */
export function useHighlightOnArrival(elementId: string): void {
  useEffect(() => {
    if (!elementId) return
    const hash = window.location.hash.replace('#', '')
    if (hash !== elementId) return
    const el = document.getElementById(elementId)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    el.classList.add(PULSE_CLASS)
    const timer = window.setTimeout(() => el.classList.remove(PULSE_CLASS), PULSE_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [elementId])
}
