/**
 * The single camera path for The Oath Modern, expressed as a pure function of the
 * master scroll `progress` (0..1). The journey moves through five coherent
 * phases so the motion reads as one continuous descent into a forged world rather
 * than a sequence of tricks:
 *
 *   0.00–0.18  Threshold — descent from above onto the monument
 *   0.18–0.42  Pressure  — lateral slide across the stone
 *   0.42–0.58  Formation — diagonal rise around the near face
 *   0.58–0.80  The Oath  — orbital arc around the monument (the ceremony)
 *   0.80–1.00  Converge  — pull back and centre for the Armory / commerce
 *
 * Pure + allocation-light (one small record per call) so it is trivially unit
 * tested and safe to call every frame. The scene lerps the live camera toward
 * this pose, so easing here only needs to be smooth, not frame-rate aware.
 */
export interface CameraPose {
  /** Camera position. */
  px: number
  py: number
  pz: number
  /** lookAt target. */
  tx: number
  ty: number
  tz: number
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0
  return x < 0 ? 0 : x > 1 ? 1 : x
}

/** Normalize p within [a,b] then smootherstep for eased segment blending. */
function seg(p: number, a: number, b: number): number {
  const t = clamp01((p - a) / (b - a))
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Monument centre — the camera always looks roughly here. */
const TARGET = { x: 0, y: 0.5, z: 0 } as const

export function cameraForProgress(progress: number): CameraPose {
  const p = clamp01(progress)

  // Phase weights (each 0..1, sequential and overlapping only at the seams).
  const descend = seg(p, 0.0, 0.18)
  const lateral = seg(p, 0.18, 0.42)
  const diagonal = seg(p, 0.42, 0.58)
  const orbit = seg(p, 0.58, 0.8)
  const converge = seg(p, 0.8, 1.0)

  // Base pose: high, slightly back, looking down onto the threshold.
  let px = 0
  let py = lerp(2.4, 0.5, descend)
  let pz = lerp(6.2, 5.0, descend)

  // Pressure — slide laterally across the face.
  px = lerp(px, -2.4, lateral)
  py = lerp(py, 0.25, lateral)
  pz = lerp(pz, 4.7, lateral)

  // Formation — diagonal rise to the opposite shoulder.
  px = lerp(px, 1.9, diagonal)
  py = lerp(py, 1.05, diagonal)
  pz = lerp(pz, 4.2, diagonal)

  // The Oath — orbital arc. Sweep ~150° around the monument at a steady radius.
  if (orbit > 0) {
    const radius = 4.3
    const a0 = Math.atan2(1.9, 4.2) // continue from the formation angle
    const angle = a0 + orbit * (Math.PI * 0.83)
    const ox = Math.sin(angle) * radius
    const oz = Math.cos(angle) * radius
    px = lerp(px, ox, orbit)
    pz = lerp(pz, oz, orbit)
    py = lerp(py, 0.65, orbit)
  }

  // Converge — pull back, re-centre, settle for the product world.
  px = lerp(px, 0, converge)
  py = lerp(py, 0.35, converge)
  pz = lerp(pz, 6.4, converge)

  // Target drifts gently down as we converge into the grid.
  const ty = lerp(TARGET.y, 0.1, converge)

  return { px, py, pz, tx: TARGET.x, ty, tz: TARGET.z }
}
