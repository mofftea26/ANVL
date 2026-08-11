/**
 * THE FORGE ALTAR'S CHOREOGRAPHY CLOCK.
 *
 * Rule 5 of the particle-forge standard (`docs/animation-guidelines.md`): the
 * WebGL tree and the DOM tree never call each other — both schedule their own
 * GSAP against these exported constants. The strike timeline (hammer, DOM
 * impact frames) and the in-canvas disintegration (`AltarStrikeEmbers`) are
 * the consumers.
 *
 * {@link ALTAR_STRIKE} and {@link ALTAR_FORGE} are seconds on the **strike
 * timeline** — `t = 0` is the click that chooses an orb.
 *
 * THE SEQUENCE, end to end — ONE overlapping gesture, no stations: the
 * hammer is already winding while the anvil is still rising, there is no
 * held pause anywhere (the windup's decelerating ease and the drop's slow
 * expo start ARE the breath), and the shroud barely hangs before the
 * scroll answers:
 *
 * ```
 * 0.00  click — THE SUMMON: the anvil rises from beneath the frame and the
 *       hammer materializes ALREADY COILING (windup starts at 0.30, mid-
 *       rise), while the chosen orb glides toward the seat and the ring dims
 * 0.50  the anvil seats
 * 0.60  the drop begins (expo.in — the head hangs, then whips)
 * 0.80  IMPACT — flash, shake, impact frames; the stone disintegrates and
 *       releases its embers into a hovering shroud (3D, AltarStrikeEmbers)
 * 1.25  the shroud is fully out
 * 1.35  HAND-OFF — the page answers the strike: the scroll pulls back up to
 *       the struck orb's chapter while the 3D shroud dissolves under the move
 * 1.70  the 3D shroud is gone; the release sinks the forge away (OUTRO)
 * ```
 */

/**
 * THE SUMMON / OUTRO — the forge's presence (`state.forgeT`). The stage
 * idles as a bare orb ring; choosing an orb summons the forge and the
 * release sinks it back into the dark.
 */
export const ALTAR_SUMMON = {
  /** The anvil's rise from beneath the frame (heavy, decelerating arrival).
   *  The windup overlaps the rise — the hammer coils while the anvil is
   *  still climbing — but the anvil MUST be seated before the DROP begins:
   *  that is the beat where steel actually needs something under it. */
  riseDuration: 0.5,
  /** The forge-waking flash pulse that rides the rise. */
  wakeFlash: 0.35,
  /** The outro — the forge sinks away as the stage releases. */
  sinkDuration: 0.55,
} as const

const WINDUP_AT = 0.3
const WINDUP_DURATION = 0.3
const WINDUP_PAUSE = 0
const DROP_AT = WINDUP_AT + WINDUP_DURATION + WINDUP_PAUSE
const DROP_DURATION = 0.2
const IMPACT_AT = DROP_AT + DROP_DURATION
const HIT_STOP = 0.06

/**
 * The rebound after the hit-stop: a violent overshoot past the cocked rest,
 * ringing down through four diminishing swings (pendulum-eased) before melting
 * into the idle figure-8 — the hammer's sway weight fades back in as |hammerT|
 * shrinks. A table rather than five hand-placed tweens in `AboutAltar`, whose
 * start times were hand-computed running totals (`+0.34`, `+0.62`, `+0.86`,
 * `+1.08`) that had to be re-added by hand whenever a swing was retuned — the
 * exact class of drift this module exists to remove. The loop that plays it
 * accumulates the offsets instead.
 */
const RING_OUT = [
  { to: -0.26, duration: 0.34, ease: 'power3.out' },
  { to: 0.14, duration: 0.28, ease: 'power2.inOut' },
  { to: -0.1, duration: 0.24, ease: 'power2.inOut' },
  { to: 0.05, duration: 0.22, ease: 'power2.inOut' },
  { to: 0, duration: 0.34, ease: 'sine.out' },
] as const

/** The hammer's strike beats — seconds on the strike timeline. */
export const ALTAR_STRIKE = {
  /** Backswing start. Decelerates into the top (`power3.out`), gathering weight. */
  windupAt: WINDUP_AT,
  windupDuration: WINDUP_DURATION,
  /** Held breath at the top of the backswing — the anticipation pause. */
  windupPause: WINDUP_PAUSE,
  dropAt: DROP_AT,
  /** The violent `expo.in` drop — nearly all the arc lands in the final frames. */
  dropDuration: DROP_DURATION,
  /**
   * The single beat every impact-locked effect keys off: flash, shake, DOM
   * impact frames, the disintegration, and (via {@link ALTAR_FORGE}) the
   * hand-off. The hammer reaching `hammerT = 1` and the orb coming apart are
   * the SAME instant.
   */
  impactAt: IMPACT_AT,
  /** The hammer stays frozen, buried in the impact, before the ring-out (anime hold). */
  hitStop: HIT_STOP,
  /** The rebound swing chain, played in order from `impact + hitStop`. */
  ringOut: RING_OUT,
  /** Reduced motion: one quick, gentle arc — the impact beat for the soft strike. */
  reducedMotionImpactAt: 0.5,
} as const

const SCATTER_DURATION = 0.45
const SHROUD_HOLD = 0.1

/** The ember phases — seconds relative to {@link ALTAR_STRIKE.impactAt}. */
export const ALTAR_FORGE = {
  /** The stone dissolving into its embers (`state.explodeT`). */
  explodeDuration: 0.28,
  /**
   * The per-seed staggered release off the stone's surface into a hovering
   * shroud (`state.scatterT`). At `1` every ember is out.
   */
  scatterDuration: SCATTER_DURATION,
  /** How long the freed shroud hangs, fully out, before the hand-off. */
  shroudHold: SHROUD_HOLD,
  /**
   * Impact → hand-off: the beat the page answers the strike (the scroll to
   * the struck orb's chapter begins). The shroud has fully released and been
   * seen hovering by this beat.
   */
  handoffAfterImpact: SCATTER_DURATION + SHROUD_HOLD,
  /**
   * The 3D shroud's dissolve (`state.emberFade`), starting AT the hand-off —
   * near-linear so the embers decay while the scroll-away move is already in
   * flight, never a hard cut before it.
   */
  emberFadeDuration: 0.35,
} as const
