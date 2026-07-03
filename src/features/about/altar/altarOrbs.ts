/**
 * Orbit choreography parameters for a dynamic orb list. Orbs are CMS content
 * (`AboutResolvedContent['orbs']`) — the count is not fixed, so phases are
 * distributed evenly at runtime and speed/bob variety is derived
 * deterministically from the index (stable across renders, no randomness).
 */
export interface AltarOrbitParams {
  /** Orbit phase offset (radians) — evenly distributed around the ring. */
  phase: number
  /** Angular speed multiplier (subtle variety between orbs). */
  speed: number
  /** Vertical bob phase so orbs never bounce in sync. */
  bobPhase: number
}

export function altarOrbitParams(index: number, count: number): AltarOrbitParams {
  const n = Math.max(1, count)
  return {
    phase: (index * Math.PI * 2) / n,
    speed: 0.9 + 0.045 * (index % 4),
    bobPhase: index * 1.35,
  }
}
