import { useEffect, useRef, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'

/**
 * Mirrors `defaultPendingMs` in `router.tsx` — a navigation has to run past
 * this threshold before the bar appears at all, so ordinary fast route
 * changes never flash it.
 */
const ENTRY_DELAY_MS = 120
/** How long the bar takes to fade out once the router finishes loading. */
const FADE_OUT_MS = 200

/**
 * Thin top-of-viewport progress indicator driven directly by the router's
 * own loading state (`router.state.isLoading`) — no per-route wiring
 * required. Mounted once in the root layout so it covers every route,
 * admin included: this is what replaces the ~1s frozen screen `/admin`
 * navigations used to show before `defaultPendingMs`/`defaultPendingMinMs`
 * (see `router.tsx`) and the admin session cache (`adminAuthCache.ts`) were
 * in place.
 */
export function RouteProgressBar() {
  const isLoading = useRouterState({ select: (state) => state.isLoading })
  const reducedMotion = useReducedMotion()
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const entryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isLoading) {
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current)
        leaveTimerRef.current = null
      }
      setLeaving(false)

      if (reducedMotion) {
        // No animated entry — just show it immediately once loading starts.
        setVisible(true)
        return undefined
      }
      entryTimerRef.current = setTimeout(() => setVisible(true), ENTRY_DELAY_MS)
      return () => {
        if (entryTimerRef.current) {
          clearTimeout(entryTimerRef.current)
          entryTimerRef.current = null
        }
      }
    }

    // Loading finished. If the entry delay never elapsed, there is nothing
    // to hide/fade — the bar never appeared.
    if (entryTimerRef.current) {
      clearTimeout(entryTimerRef.current)
      entryTimerRef.current = null
    }
    if (!visible) return undefined

    if (reducedMotion) {
      setVisible(false)
      return undefined
    }
    setLeaving(true)
    leaveTimerRef.current = setTimeout(() => {
      setVisible(false)
      setLeaving(false)
    }, FADE_OUT_MS)
    return () => {
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current)
        leaveTimerRef.current = null
      }
    }
  }, [isLoading, reducedMotion, visible])

  if (!visible) return null

  return (
    <div
      aria-hidden="true"
      data-testid="route-progress-bar"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2px] overflow-hidden"
    >
      <div
        data-testid="route-progress-bar-fill"
        className="h-full origin-left bg-[var(--color-highlight-bright)]"
        style={{
          transform: `scaleX(${leaving ? 1 : 0.72})`,
          opacity: leaving ? 0 : 1,
          transition: reducedMotion
            ? 'none'
            : `transform 600ms ease-out, opacity ${FADE_OUT_MS}ms ease-out`,
        }}
      />
    </div>
  )
}
