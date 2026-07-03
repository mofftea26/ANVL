/**
 * Mutable GSAP ⇄ R3F bridge for the altar stage — the same zero-re-render
 * pattern as the landing pages' motion state: GSAP timelines (orb focus,
 * hammer strike, explosion) tween these numbers; the scene's `useFrame` reads
 * them every frame. Held in a ref at the stage root and rebuilt if the orb
 * count changes.
 */
export interface AltarState {
  /** 0..1 per orb: 0 = in orbit, 1 = seated on the anvil face. */
  focusT: number[]
  /** Index of the orb currently focused/striking, -1 when the ring is idle. */
  activeIndex: number
  /** 0..1 — dims and slows the non-active orbs while one is focused. */
  ringDim: number
  /** Hammer swing progress: 0 = holstered/raised, 1 = impact. The strike
   *  timeline pushes it slightly negative for the windup. */
  hammerT: number
  /** 0..1 — the active orb's burst-apart progress (explosion). */
  explodeT: number
  /** 0..1 — the shared burst-particle/shockwave playhead. */
  burstT: number
  /** Impact flash intensity (point light + orb emissive spike), decays fast. */
  flash: number
  /** Camera shake amplitude, decays after impact. */
  shake: number
  /** Pointer normalized to viewport centre (-1..1) — camera parallax. */
  pointerX: number
  pointerY: number
  pointerVX: number
  pointerVY: number
  /** Global orbit clock — eases toward 0 while a strike sequence runs. */
  orbitSpeed: number
}

export function createAltarState(orbCount: number): AltarState {
  return {
    focusT: Array.from({ length: orbCount }, () => 0),
    activeIndex: -1,
    ringDim: 0,
    hammerT: 0,
    explodeT: 0,
    burstT: 0,
    flash: 0,
    shake: 0,
    pointerX: 0,
    pointerY: 0,
    pointerVX: 0,
    pointerVY: 0,
    orbitSpeed: 1,
  }
}
