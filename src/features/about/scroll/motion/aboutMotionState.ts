import { createContext, useContext } from 'react'

/**
 * Shared DOM ⇄ WebGL motion state for the About scroll film — the single
 * bridge between GSAP and R3F (the `oathMotionState` pattern).
 *
 * A plain mutable object: ScrollTrigger callbacks **write** numbers (zero
 * React re-renders, zero subscriptions); the depth canvas's `useFrame`
 * **reads** and lerps toward these targets each frame, smoothing scrub
 * jitter. Held in a ref at the experience root and provided via context so
 * the timeline hook and the lazy canvas share one instance. The altar's own
 * `AltarState` stays a separate object — this state carries the *journey*,
 * that one carries the *stage*.
 */
export interface AboutScrollMotion {
  /** 0..1 across the entire film (hero top → altar pin end). */
  scrollDepth: number
  /** Index of the chapter currently owning the frame (-1 in the hero). */
  chapterIndex: number
  /** 0..1 within the active chapter's pin. */
  chapterProgress: number
  /** How many orb chapters this mount has (static per mount). */
  chapterCount: number
  /** 0..1 across the hero pin. */
  heroProgress: number
  /** Marquee scrub velocity (viewport-normalized, decays on the read side). */
  marqueeVelocity: number
  /** Monotonic counter — every chapter boundary crossing bumps it; the ember
   *  boundary field fires a burst when it changes. */
  boundaryBurst: number
  /** The boundary's outgoing chapter index (-1 = the hero). */
  boundaryFrom: number
  /** The boundary's incoming chapter index (chapterCount = the altar). */
  boundaryTo: number
  /** 0..1 ramp across the last chapters into the finale — mounts the altar
   *  stage early (GLB prefetch) and blends camera authority toward it. */
  altarApproach: number
  /** 1 while the altar section is pinned. */
  altarPinned: number
  /** Pointer position normalized to the viewport center (-1..1). */
  pointerX: number
  pointerY: number
  /** Pointer velocity (normalized units / second, decays on the read side). */
  pointerVX: number
  pointerVY: number
}

export function createAboutScrollMotion(chapterCount: number): AboutScrollMotion {
  return {
    scrollDepth: 0,
    chapterIndex: -1,
    chapterProgress: 0,
    chapterCount,
    heroProgress: 0,
    marqueeVelocity: 0,
    boundaryBurst: 0,
    boundaryFrom: -1,
    boundaryTo: -1,
    altarApproach: 0,
    altarPinned: 0,
    pointerX: 0,
    pointerY: 0,
    pointerVX: 0,
    pointerVY: 0,
  }
}

export const AboutScrollMotionContext = createContext<AboutScrollMotion | null>(null)

export function useAboutScrollMotion(): AboutScrollMotion {
  const state = useContext(AboutScrollMotionContext)
  if (!state) {
    throw new Error('useAboutScrollMotion requires AboutScrollMotionContext')
  }
  return state
}
