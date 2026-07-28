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
/** Duration of the `transform` creep/completion transition. */
const CREEP_DURATION_MS = 600
/** Indeterminate "still loading" width, as a `scaleX` fraction. */
const CREEP_TARGET_SCALE = 0.72
/** Full width, used while completing + fading out. */
const COMPLETE_SCALE = 1
/**
 * Starting width for the creep-in. Small rather than 0 so the very first
 * frame already reads as "a bar," not an invisible sliver.
 */
const CREEP_START_SCALE = 0.08
/**
 * Gap between mounting the bar at `CREEP_START_SCALE` and bumping it to
 * `CREEP_TARGET_SCALE`. `transition: transform` has nothing to animate from
 * if both values land in the same paint — this timeout lets the browser
 * paint the start value first, so the following update is a real transition
 * instead of the bar popping straight to 72% width.
 */
const CREEP_START_FRAME_MS = 16

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
  const [scale, setScale] = useState(CREEP_START_SCALE)
  // Mirrors `visible` for the effect below to read synchronously. `visible`
  // itself cannot be an effect dependency: this effect is what calls
  // `setVisible`, so depending on it would re-run the effect on its own
  // update mid-sequence — canceling the just-scheduled creep timer before it
  // ever fires. The effect only needs to react to the router's loading state
  // and the reduced-motion preference, never to its own visibility output.
  const visibleRef = useRef(false)
  // Mirrors `leaving` for the same reason `visibleRef` mirrors `visible`: a
  // new navigation that interrupts an in-progress fade-out needs to know,
  // synchronously inside this same effect run, that it is interrupting one —
  // otherwise `scale` is left stranded at COMPLETE_SCALE (the fade-out's
  // cleanup only cancels `leaveTimer`; it never runs the reset that timer
  // was going to do) and the bar freezes at full width through the new
  // navigation's entire entry delay before visibly snapping back down.
  const leavingRef = useRef(false)
  const entryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const creepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isLoading) {
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current)
        leaveTimerRef.current = null
      }
      if (leavingRef.current) {
        // Interrupting an in-progress fade-out — go back to the same hidden
        // baseline a first-ever navigation starts from, so this navigation's
        // entry delay behaves identically (no leftover scaleX(1) to freeze
        // on, no leftover `leaving` opacity/transform override).
        setVisible(false)
        visibleRef.current = false
        setScale(CREEP_START_SCALE)
        leavingRef.current = false
      }
      setLeaving(false)

      if (reducedMotion) {
        // No animated entry — just show it immediately once loading starts.
        setScale(CREEP_TARGET_SCALE)
        setVisible(true)
        visibleRef.current = true
        return undefined
      }

      entryTimerRef.current = setTimeout(() => {
        // Mount at the small start value first, then bump to the creep
        // target one frame later (see CREEP_START_FRAME_MS) so the
        // transform transition has an actual start value to animate from.
        setScale(CREEP_START_SCALE)
        setVisible(true)
        visibleRef.current = true
        creepTimerRef.current = setTimeout(() => {
          setScale(CREEP_TARGET_SCALE)
        }, CREEP_START_FRAME_MS)
      }, ENTRY_DELAY_MS)

      return () => {
        if (entryTimerRef.current) {
          clearTimeout(entryTimerRef.current)
          entryTimerRef.current = null
        }
        if (creepTimerRef.current) {
          clearTimeout(creepTimerRef.current)
          creepTimerRef.current = null
        }
      }
    }

    // Loading finished. If the entry delay never elapsed, there is nothing
    // to hide/fade — the bar never appeared.
    if (entryTimerRef.current) {
      clearTimeout(entryTimerRef.current)
      entryTimerRef.current = null
    }
    if (creepTimerRef.current) {
      clearTimeout(creepTimerRef.current)
      creepTimerRef.current = null
    }
    if (!visibleRef.current) return undefined

    if (reducedMotion) {
      setVisible(false)
      visibleRef.current = false
      leavingRef.current = false
      return undefined
    }
    setScale(COMPLETE_SCALE)
    setLeaving(true)
    leavingRef.current = true
    leaveTimerRef.current = setTimeout(() => {
      setVisible(false)
      visibleRef.current = false
      setLeaving(false)
      leavingRef.current = false
      setScale(CREEP_START_SCALE)
    }, FADE_OUT_MS)
    return () => {
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current)
        leaveTimerRef.current = null
      }
    }
  }, [isLoading, reducedMotion])

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
          transform: `scaleX(${leaving ? COMPLETE_SCALE : scale})`,
          opacity: leaving ? 0 : 1,
          transition: reducedMotion
            ? 'none'
            : `transform ${CREEP_DURATION_MS}ms ease-out, opacity ${FADE_OUT_MS}ms ease-out`,
        }}
      />
    </div>
  )
}
