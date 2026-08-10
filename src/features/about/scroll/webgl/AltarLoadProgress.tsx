import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useProgress } from '@react-three/drei'

/** Below this, a load is "instant" — the bar never appears (no flash). */
const ENTRY_DELAY_MS = 250
/** The bar's completion + fade once the stage reports loaded. */
const COMPLETE_HOLD_MS = 650
/** The very first frame already reads as "a bar", never an invisible sliver. */
const MIN_SCALE = 0.06

/**
 * The finale's forging bar — DOM, but owned by the lazy WebGL chunk (drei's
 * `useProgress` must never be imported by the eager film code or it drags
 * `vendor-three` in for visitors whose canvas gate never opens). Portals into
 * the altar section's slot (`#about-altar-load-slot`) and tracks the GLB
 * stream from the moment the stage mounts (`approached`) until the
 * post-Suspense tree reports in (`ready`) — then completes, marks the section
 * `data-altar-ready="on"` (the CSS cue that raises the chips), and burns out.
 *
 * `RouteProgressBar` is the behavioral template: an entry delay so cached
 * loads never flash it, transform-only motion, and a latch so `useProgress`'s
 * idle flickers can't resurrect a finished bar.
 */
export function AltarLoadProgress({
  approached,
  ready,
}: {
  approached: boolean
  ready: boolean
}) {
  const { progress } = useProgress()
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)
  const [gone, setGone] = useState(false)
  const entryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setSlot(document.getElementById('about-altar-load-slot'))
  }, [])

  // Entry delay — mount the bar only if the load outlives it.
  useEffect(() => {
    if (!approached || ready || gone) return
    entryTimer.current = setTimeout(() => setVisible(true), ENTRY_DELAY_MS)
    return () => {
      if (entryTimer.current) clearTimeout(entryTimer.current)
    }
  }, [approached, ready, gone])

  // The stage reported in: flag the section for the CSS reveal, complete the
  // bar (if it ever appeared), then retire it for good.
  useEffect(() => {
    if (!ready || !slot) return
    slot.closest('section')?.setAttribute('data-altar-ready', 'on')
    const timer = setTimeout(() => setGone(true), COMPLETE_HOLD_MS)
    return () => clearTimeout(timer)
  }, [ready, slot])

  if (!slot || gone || !visible) return null

  const scale = ready ? 1 : Math.max(MIN_SCALE, Math.min(1, progress / 100))

  return createPortal(
    <div
      aria-hidden="true"
      data-altar-load-bar
      className="flex w-64 flex-col items-center gap-3"
      style={{
        opacity: ready ? 0 : 1,
        transition: `opacity ${COMPLETE_HOLD_MS * 0.6}ms ease-out ${COMPLETE_HOLD_MS * 0.3}ms`,
      }}
    >
      <p className="anvl-display text-[10px] tracking-[0.34em] text-[var(--color-heading)]/75">
        Forging the altar
      </p>
      <div className="h-[2px] w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-line)_60%,transparent)]">
        <div
          className="h-full origin-left bg-[var(--color-highlight-bright)]"
          style={{
            transform: `scaleX(${scale})`,
            transition: 'transform 400ms cubic-bezier(0.22, 1, 0.36, 1)',
            boxShadow: '0 0 12px var(--color-highlight)',
          }}
        />
      </div>
    </div>,
    slot,
  )
}
