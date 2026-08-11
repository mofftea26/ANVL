/**
 * The depth rig's world geometry — the one place the film's camera journey is
 * defined, so the DOM builders, the rig, and (Phase 4) the altar stage all
 * agree on where "forward" ends.
 *
 * The camera dollies from `CAMERA_START_Z` to `CAMERA_END_Z` as
 * `scrollDepth` runs 0→1, always looking `LOOK_AHEAD` units down the path.
 * The altar stage parks at the end of the journey, exactly `LOOK_AHEAD` past
 * the final camera knot — which reproduces the classic altar framing (camera
 * `[0, 0.6, 6.4]` looking at `[0, 0.35, 0]`, fov 38) in the stage's own
 * local space.
 */
export const ABOUT_DEPTH = {
  /** Where the journey begins — pulled back, the void wide open. */
  cameraStartZ: 8.5,
  /** Where the journey ends — arrived at the forge. */
  cameraEndZ: 0,
  /** The camera's resting height (the altar rig's classic 0.6). */
  cameraHeight: 0.6,
  /** How far down the path the camera looks (the classic 6.4 framing). */
  lookAhead: 6.4,
  /** The look target's height (the classic 0.35 altar-seat line). */
  lookHeight: 0.35,
  /** Pointer parallax reach — the altar rig's classic 0.45 / -0.28. */
  parallaxX: 0.45,
  parallaxY: -0.28,
  /** Per-frame lerp rate toward targets — deliberately soft: the camera
   *  settles a beat AFTER the DOM scrub (which itself trails the wheel via
   *  `scrubSmoothing`), layering the glide instead of moving as one sheet. */
  lerp: 2.6,
} as const

/** Where the altar stage group parks: the end of the camera's journey. */
export const ABOUT_ALTAR_STAGE_Z = ABOUT_DEPTH.cameraEndZ - ABOUT_DEPTH.lookAhead
