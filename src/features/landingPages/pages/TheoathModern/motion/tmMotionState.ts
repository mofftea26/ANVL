import { createContext, useContext } from 'react'

/**
 * Shared DOM ⇄ WebGL motion state for Theoath Modern — the single bridge between
 * GSAP and R3F (same pattern as The Oath). ScrollTrigger + pointer handlers
 * **write** plain numbers (zero React re-renders); the `TechForgeScene`
 * `useFrame` **reads** and lerps toward them each frame. Held in a ref at the
 * page root and shared with the lazy canvas via context.
 */
export interface TmMotionState {
  /** 0..1 across the hero — resolves the product/platform from fog + depth. */
  heroProgress: number
  /** 0..1 platform reveal/rotation as the hero settles. */
  platformProgress: number
  /** 0..1 across the materials section — drives the macro light sweep. */
  materialsProgress: number
  /** Hovered collection card index, -1 when none. */
  hoveredCard: number
  /** Pointer position normalized to viewport centre (-1..1). */
  pointerX: number
  pointerY: number
  /** Pointer velocity (normalized units / second, decays on the read side). */
  pointerVX: number
  pointerVY: number
}

export function createTmMotionState(): TmMotionState {
  return {
    heroProgress: 0,
    platformProgress: 0,
    materialsProgress: 0,
    hoveredCard: -1,
    pointerX: 0,
    pointerY: 0,
    pointerVX: 0,
    pointerVY: 0,
  }
}

export const TmMotionContext = createContext<TmMotionState | null>(null)

export function useTmMotionState(): TmMotionState {
  const state = useContext(TmMotionContext)
  if (!state) throw new Error('useTmMotionState requires TmMotionContext')
  return state
}
