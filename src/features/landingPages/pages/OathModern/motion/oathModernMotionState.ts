import { createContext, useContext } from 'react'

/**
 * Shared DOM ⇄ WebGL motion state for The Oath Modern — the single bridge between
 * GSAP and R3F (same pattern as The Oath / Theoath Modern). The master
 * ScrollTrigger + pointer handlers **write** plain numbers (zero React
 * re-renders); the persistent scene's `useFrame` **reads** and lerps toward them
 * each frame. Held in a ref at the page root and shared with the lazy canvas via
 * context.
 *
 * There is ONE source of scroll truth: `progress` (0..1 across the whole
 * journey). The scene maps it to the camera path
 * (descent → lateral → diagonal → orbital → converge); no layer keeps its own
 * scroll timeline for the same property.
 */
export interface OathModernMotionState {
  /** 0..1 across the entire pinned journey — the single scroll source of truth. */
  progress: number
  /** Pointer position normalized to viewport centre (-1..1). */
  pointerX: number
  pointerY: number
  /** Pointer velocity (normalized units / second, decays on the read side). */
  pointerVX: number
  pointerVY: number
  /** Hovered Armory product index, -1 when none. */
  hoveredProduct: number
}

export function createOathModernMotionState(): OathModernMotionState {
  return {
    progress: 0,
    pointerX: 0,
    pointerY: 0,
    pointerVX: 0,
    pointerVY: 0,
    hoveredProduct: -1,
  }
}

export const OathModernMotionContext =
  createContext<OathModernMotionState | null>(null)

export function useOathModernMotionState(): OathModernMotionState {
  const state = useContext(OathModernMotionContext)
  if (!state) {
    throw new Error('useOathModernMotionState requires OathModernMotionContext')
  }
  return state
}
