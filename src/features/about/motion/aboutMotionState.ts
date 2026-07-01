import { createContext, useContext } from 'react'

/**
 * Shared DOM ⇄ WebGL motion state — the single bridge between GSAP and R3F.
 *
 * A plain mutable object: ScrollTrigger callbacks **write** numbers (zero React
 * re-renders, zero subscriptions); the WebGL scene's `useFrame` **reads** and
 * lerps toward these targets each frame, smoothing scrub jitter. Held in a ref
 * at the page root and provided via context so the timeline hook and the lazy
 * canvas share one instance. Mirrors `oathMotionState.ts`.
 */
export interface AboutMotionState {
  /** 0..1 across the hero scroll — drifts the monolith to centre. */
  heroProgress: number
  /** 0..1 across the philosophy pin — recedes/darkens the monolith. */
  philosophyProgress: number
  /** 0..1 across each process scene — keeps the monolith receded. */
  materialsProgress: number
  constructionProgress: number
  testingProgress: number
  /** 0..1 across the finale reveal — returns the monolith centre/front. */
  finaleProgress: number
}

export function createAboutMotionState(): AboutMotionState {
  return {
    heroProgress: 0,
    philosophyProgress: 0,
    materialsProgress: 0,
    constructionProgress: 0,
    testingProgress: 0,
    finaleProgress: 0,
  }
}

export const AboutMotionContext = createContext<AboutMotionState | null>(null)

export function useAboutMotionState(): AboutMotionState {
  const state = useContext(AboutMotionContext)
  if (!state) {
    throw new Error('useAboutMotionState requires AboutMotionContext')
  }
  return state
}
