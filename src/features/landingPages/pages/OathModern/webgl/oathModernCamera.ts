/**
 * The single camera path for The Oath Modern, expressed as a pure function of the
 * master scroll `progress` (0..1). The journey is one slow, elegant move through a
 * forged chamber — NOT a sequence of zooms.
 *
 * It is built in spherical terms around the monument so the camera always frames
 * the object from the front at a comfortable distance and NEVER passes through it:
 *
 *   azimuth   gentle left → right swing (±~20°), returning to centre
 *   radius    eases from far (entrance) → closest mid-journey → gently back
 *   height    descends from above, settles near the object's centre
 *
 *   0.00–0.20  Threshold — descend from above
 *   0.20–0.45  Pressure  — drift left, ease closer
 *   0.45–0.70  Formation/Oath — swing right (the orbit), closest pass
 *   0.70–1.00  Converge  — return to centre, pull gently back for the Armory
 *
 * Pure + allocation-light so it is trivially unit tested and safe per frame. The
 * scene lerps the live camera toward this pose, so easing only needs to be smooth.
 */
export interface CameraPose {
  px: number
  py: number
  pz: number
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
const TARGET = { x: 0, y: 0.55, z: 0 } as const

export function cameraForProgress(progress: number): CameraPose {
  const p = clamp01(progress)

  // Azimuth (radians): centre → gentle left → gentle right → centre. Bounded so
  // cos(azimuth) stays well above 0 — the camera never swings behind the object.
  let azimuth = 0
  azimuth = lerp(azimuth, -0.32, seg(p, 0.2, 0.45)) // drift left (Pressure)
  azimuth = lerp(azimuth, 0.38, seg(p, 0.45, 0.7)) // swing right (Formation/Oath)
  azimuth = lerp(azimuth, 0, seg(p, 0.78, 1)) // return to centre (Converge)

  // Radius: far at the threshold, closest through the orbit, gently back to frame
  // the product world. Never close enough to feel like a zoom punch.
  let radius = lerp(6.8, 6.0, seg(p, 0, 0.2)) // descend
  radius = lerp(radius, 5.2, seg(p, 0.3, 0.62)) // ease closer
  radius = lerp(radius, 6.3, seg(p, 0.8, 1)) // pull gently back

  // Height above the target: descend from high, settle just above centre.
  const height = lerp(2.0, 0.4, seg(p, 0, 0.32))

  const px = Math.sin(azimuth) * radius
  const pz = Math.cos(azimuth) * radius
  const py = TARGET.y + height

  // Target drifts a touch lower as we converge into the grid.
  const ty = lerp(TARGET.y, 0.35, seg(p, 0.8, 1))

  return { px, py, pz, tx: TARGET.x, ty, tz: TARGET.z }
}
