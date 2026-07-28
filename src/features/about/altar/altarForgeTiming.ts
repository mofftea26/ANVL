import { FORGE_DURATION_MS } from '@/shared/lib/forge/emberForge'

/**
 * THE FORGE ALTAR'S CHOREOGRAPHY CLOCK.
 *
 * Rule 5 of the particle-forge standard (`docs/animation-guidelines.md`): the
 * WebGL tree and the DOM tree never call each other — both schedule their own
 * GSAP against these exported constants. `AboutAltar` (the strike timeline,
 * the 3D disintegration, the DOM ember hand-off) and `AboutOrbModal` (backdrop,
 * panel, ignition, content stagger, stat counters) are the two consumers.
 * Before this module existed, `AboutOrbModal` hardcoded `1.6 / 1.68 / 1.7 /
 * 1.92 / 2.1` that had to be kept in sync by hand with `AboutAltar`'s tween
 * chain — change one number and the two trees silently drifted apart.
 *
 * TWO FRAMES OF REFERENCE, because the two trees start their timelines at
 * different moments:
 *
 * - {@link ALTAR_STRIKE} and {@link ALTAR_FORGE} are seconds on the **strike
 *   timeline** — `t = 0` is the click that chooses an orb.
 * - {@link ALTAR_MODAL} is seconds from the **hand-off beat**
 *   (`impact + ALTAR_FORGE.handoffAfterImpact`), which is the same instant the
 *   modal mounts and the DOM ember swarm launches. The modal's `useGSAP` runs
 *   on mount, so its delays are already expressed in this frame — no offset
 *   arithmetic at the call site.
 *
 * THE SEQUENCE, end to end:
 *
 * ```
 * 0.00  click — the orb glides to the anvil, the ring dims
 * 0.90  windup (decelerating backswing) → 0.15s held breath at the top
 * 1.50  the drop (expo.in — the head hangs, then whips)
 * 1.78  IMPACT — flash, shake, impact frames; the stone disintegrates and
 *       releases its embers into a hovering shroud (3D, AltarModalForge)
 * 2.38  the shroud is fully out; it hangs for a beat so it reads
 * 2.73  HAND-OFF — the modal mounts (invisible) and the DOM ember swarm
 *       launches from the orb's seat; the 3D shroud crossfades out UNDER the
 *       arriving DOM swarm (one continuous swarm crossing canvas → DOM)
 * 3.18  the 3D shroud is gone; the backdrop may now blur (it would otherwise
 *       smear the live 3D embers — see AboutOrbModal's blur note)
 * 3.23  the panel materializes as the swarm's hot cores land and dissolve
 * 3.68  the DOM swarm's pass ends
 * ```
 */

const WINDUP_AT = 0.9
const WINDUP_DURATION = 0.45
const WINDUP_PAUSE = 0.15
const DROP_AT = WINDUP_AT + WINDUP_DURATION + WINDUP_PAUSE
const DROP_DURATION = 0.28
const IMPACT_AT = DROP_AT + DROP_DURATION

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
  hitStop: 0.08,
  /** Reduced motion: one quick, gentle arc — the impact beat for the soft strike. */
  reducedMotionImpactAt: 0.85,
} as const

const SCATTER_DURATION = 0.6
const SHROUD_HOLD = 0.35

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
   * Impact → hand-off: the modal mounts and the DOM ember swarm launches.
   * The shroud has fully released and been seen hovering by this beat.
   */
  handoffAfterImpact: SCATTER_DURATION + SHROUD_HOLD,
  /**
   * The 3D shroud's crossfade (`state.emberFade`), starting AT the hand-off —
   * deliberately shorter than {@link swarmDuration} and overlapping it, so the
   * canvas embers are still alive while the DOM swarm streams in from the same
   * screen point. Anything that reads as two effects in sequence is a bug.
   */
  emberFadeDuration: 0.45,
  /**
   * The DOM swarm's pass — the shared engine's canonical modal duration, so
   * the altar's modal forges out of embers on exactly the same clock as every
   * other dialog and toast in the app.
   */
  swarmDuration: FORGE_DURATION_MS / 1000,
} as const

const PANEL_DELAY = 0.5

/**
 * The modal's own reveal — seconds from the hand-off beat (= its mount), so
 * these drop straight into `AboutOrbModal`'s GSAP `delay` fields.
 */
export const ALTAR_MODAL = {
  /**
   * Held until the 3D shroud has fully crossfaded out: `backdrop-filter` keeps
   * blurring the WebGL canvas beneath it, which would smear the live embers.
   * (The DOM swarm's canvas composites ABOVE the modal, so it is unaffected.)
   */
  backdropDelay: ALTAR_FORGE.emberFadeDuration,
  backdropDuration: 0.6,
  /** The panel tilts up out of the ember plate as the swarm's cores land. */
  panelDelay: PANEL_DELAY,
  panelDuration: 0.6,
  /** The edge ignition flashes a hair before the panel — the embers fusing in. */
  igniteDelay: PANEL_DELAY - 0.02,
  igniteDuration: 0.16,
  igniteFadeDuration: 0.7,
  contentDelay: PANEL_DELAY + 0.22,
  contentDuration: 0.5,
  contentStagger: 0.06,
  statsDelay: PANEL_DELAY + 0.4,
  statsDuration: 1.1,
} as const
