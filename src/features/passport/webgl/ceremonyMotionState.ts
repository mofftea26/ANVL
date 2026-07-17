/**
 * Mutable bridge between the ceremony DOM (which owns the strike interaction)
 * and the ceremony particle forge (which reacts per-frame). Same pattern as
 * `passportMotionState` — the two sides never call each other.
 */
export interface CeremonyMotionState {
  /** Monotonic strike counter — each bump pulses the ember cloud. */
  strike: number
  /** Flips true once on the final strike — starts the forge timeline. */
  begin: boolean
}

export function createCeremonyMotionState(): CeremonyMotionState {
  return { strike: 0, begin: false }
}
