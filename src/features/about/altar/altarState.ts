/**
 * Mutable GSAP ⇄ R3F bridge for the altar stage — the same zero-re-render
 * pattern as the landing pages' motion state: GSAP timelines (orb focus,
 * hammer strike, disintegration → ember hand-off) tween these numbers; the
 * scene's `useFrame` reads
 * them every frame — and writes {@link AltarState.seatNdc} back for the DOM
 * side. Held in a ref at the stage root and rebuilt if the orb count changes.
 * Every beat these are tweened on is a constant in `altarForgeTiming.ts`.
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
  /** 0..1 — the active orb's disintegration (stone dissolves into embers). */
  explodeT: number
  /** 0..1 — the freed embers' loosen/hover progress off the stone's surface;
   *  the in-canvas ember pool lives while this is > 0 (no explosion — the
   *  embers just let go into a hovering shroud, which then hands over to the
   *  DOM swarm at the hand-off beat). */
  scatterT: number
  /** 0..1 — the 3D shroud's crossfade out at the hand-off beat, while the DOM
   *  ember swarm (the shared canvas-2D forge every modal/toast uses) streams in
   *  from the same screen point to form the panel. 1 = the pool is retired. */
  emberFade: number
  /** The orb seat projected to NDC (-1..1, y up) by the scene camera — written
   *  in-canvas every frame, read by the DOM side at the hand-off to place the
   *  ember swarm's origin in viewport pixels. The exact inverse of the modal
   *  rect → NDC conversion the in-canvas formation used to do. */
  seatNdc: { x: number; y: number }
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
    scatterT: 0,
    emberFade: 0,
    seatNdc: { x: 0, y: 0 },
    flash: 0,
    shake: 0,
    pointerX: 0,
    pointerY: 0,
    pointerVX: 0,
    pointerVY: 0,
    orbitSpeed: 1,
  }
}
