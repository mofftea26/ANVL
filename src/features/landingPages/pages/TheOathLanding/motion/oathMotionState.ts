import { createContext, useContext } from 'react'

/**
 * Shared DOM ⇄ WebGL motion state — the single bridge between GSAP and R3F.
 *
 * A plain mutable object: ScrollTrigger callbacks **write** numbers (zero React
 * re-renders, zero subscriptions); the WebGL scene's `useFrame` **reads** and
 * lerps toward these targets each frame, smoothing scrub jitter. Held in a ref
 * at the page root and provided via context so the timeline hook and the lazy
 * canvas share one instance.
 */
export interface OathMotionState {
  /** 0..1 across the hero scroll — drifts the emblem to centre + enlarges it. */
  heroProgress: number
  /** 0..1 across the manifesto pin — recedes/darkens the emblem. */
  manifestoProgress: number
  /** 0..N-1 continuous across the tenets panorama. */
  tenetsProgress: number
  /** 1 while the tenets stage is pinned — holds the emblem receded behind it. */
  tenetsActive: number
  /** Hovered product index, -1 when none — lifts the dust glint. */
  hoveredPiece: number
  /** Requested hero product model index (DOM writes on click; the hero
   *  particle forge morphs toward it). */
  heroProductIndex: number
  /** 1 while the pointer rests on the hero product stage — zoom + glow. */
  heroProductHover: number
  /** Monotonic strike counter — every stage click pulses a re-forge burst,
   *  even when a single product means the index cannot change. */
  heroProductStrike: number
  /** 0..1 — how "resolved" the actual product render is (DOM tweens it around
   *  each reveal; the particles read it and recede to a faint aura at 1). */
  heroProductReveal: number
  /** 0..1 across the finale reveal — returns the emblem centre/front. */
  finaleProgress: number
  /** Pointer position normalized to the viewport center (-1..1). */
  pointerX: number
  pointerY: number
  /** Pointer velocity (normalized units / second, decays on the read side). */
  pointerVX: number
  pointerVY: number
}

export function createOathMotionState(): OathMotionState {
  return {
    heroProgress: 0,
    manifestoProgress: 0,
    tenetsProgress: 0,
    tenetsActive: 0,
    hoveredPiece: -1,
    heroProductIndex: 0,
    heroProductHover: 0,
    heroProductStrike: 0,
    heroProductReveal: 0,
    finaleProgress: 0,
    pointerX: 0,
    pointerY: 0,
    pointerVX: 0,
    pointerVY: 0,
  }
}

export const OathMotionContext = createContext<OathMotionState | null>(null)

export function useOathMotionState(): OathMotionState {
  const state = useContext(OathMotionContext)
  if (!state) {
    throw new Error('useOathMotionState requires OathMotionContext')
  }
  return state
}
