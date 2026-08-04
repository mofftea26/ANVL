import type { PassportEffectFacts } from '../effectFacts'
import { markerPlacement, type MarkerPlacement } from './markerGeometry'

/**
 * The Blueprint hologram's spec plates: their strings, their raster, and where
 * they hang.
 *
 * Split out of `effectBlueprintShaders.ts` (already over the hard limit by
 * written reason) when the plates learned to honour authored coordinates —
 * the marker work had to land as extraction, not accretion. Pure apart from
 * `drawTagCanvas`, which needs a canvas; no three.js, so the whole placement
 * contract is unit-testable without a GPU.
 */

/**
 * Plate raster. The sprites stand large in world space (see `TAG_HEIGHT`), so
 * the raster is sized to match or the type reads upscaled-blurry.
 */
const TAG_W = 768
const TAG_H = 264
/** Symmetric text inset — the shrink-to-fit budget is `TAG_W - 2 * this`. */
const TAG_INSET = 54
/** Sprite width ÷ height — the canvas aspect the world-space scale must keep. */
export const TAG_ASPECT = TAG_W / TAG_H

/**
 * World height of one plate. Deliberately oversized: these are LABELS meant
 * to be read at console distance, not decorative furniture, so the error to
 * make is "too big". Width follows from the raster aspect, and the side rail
 * below clamps the pair inside the visible world box at any stage width.
 */
export const TAG_HEIGHT = 0.48
export const TAG_WIDTH = TAG_HEIGHT * TAG_ASPECT
/** Vertical clearance two plates on the same rail need to stay readable. */
const TAG_MIN_GAP = TAG_HEIGHT * 1.08

/**
 * Where the plates hang when nobody placed them, in fill order — the approved
 * composition, frozen. `yFrac` is a fraction of the garment's height above its
 * hem, `side` picks the stage side, `anchorFrac` how far into the piece the
 * leader line points.
 *
 * The order is also the DEGRADATION order, because the plate count tracks how
 * much the passport actually says: one fact reads high-right, two straddle the
 * piece, three fill the approved arrangement. A slot is never padded.
 */
const TAG_SLOTS = [
  { side: 1, yFrac: 0.74, anchorFrac: 0.5 },
  { side: -1, yFrac: 0.16, anchorFrac: 0.5 },
  { side: 1, yFrac: 0.42, anchorFrac: 0.55 },
] as const

/** How many plates the stage composition can carry. */
export const MAX_HOLO_TAGS = TAG_SLOTS.length
/** Midpoint of the slot fractions — the band the plates spread about. */
const TAG_BAND_MID_FRAC = 0.45
/** Tightest gap between adjacent slot fractions (0.42 → 0.16). */
const TAG_MIN_SLOT_GAP_FRAC = 0.26

export interface HoloTagSpec {
  label: string
  value: string
  /**
   * Where the editor pinned this readout on the render, as a percent of the
   * image box — null when the marker carries no placement, which is what puts
   * the plate back on its frozen slot.
   */
  place: MarkerPlacement | null
}

export interface HoloTagColors {
  base: string
  /** Value-text color — pass near-white; readability beats palette purity here. */
  bright: string
  accent: string
}

/**
 * The plates' strings, taken from the passport's REAL authored facts.
 *
 * This function is the whole honesty contract: no facts ⇒ no plates, fewer
 * facts ⇒ fewer plates. A passport's entire promise is that what it shows is
 * true of THIS piece, so a hologram captioned with plausible constants would
 * be the one unacceptable thing — the projection is still beautiful bare.
 *
 * `facts.blueprint` arrives pre-ordered from `effectFacts.ts` (the editor's
 * own order), so taking the front of the list yields the readouts they cared
 * about most. Nothing here can produce a string the passport does not already
 * print on its cards, and nothing in `facts` carries a serial number —
 * serials are internal-only and must never be shown to a customer. Keep it
 * that way.
 */
export function tagsFromFacts(
  facts: PassportEffectFacts | undefined,
  maxSlots: number = MAX_HOLO_TAGS,
): HoloTagSpec[] {
  const specs: HoloTagSpec[] = []
  for (const fact of facts?.blueprint ?? []) {
    if (specs.length >= maxSlots) break
    const label = fact.label.trim()
    const value = fact.value.trim()
    // A blank half is not a fact — a half-empty plate reads as a data error.
    if (label && value) specs.push({ label, value, place: markerPlacement(fact) })
  }
  return specs
}

/**
 * Draw one holographic data tag into an offscreen canvas (→ CanvasTexture).
 * These are labels someone should be able to READ at console distance, not
 * decorative furniture: a genuinely present dark-glass plate (the sprite is
 * NORMAL-blended so this backing can occlude the bright cloud behind the
 * text), a blueprint border, the champagne corner tick, and large high-
 * contrast type — either line shrinks to fit rather than clipping.
 * Browser-only (this module only loads behind the lazy WebGL gate). A null
 * 2D context returns the blank canvas: the sprite simply doesn't read,
 * nothing throws.
 */
export function drawTagCanvas(
  spec: { label: string; value: string },
  colors: HoloTagColors,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = TAG_W
  canvas.height = TAG_H
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  // The plate: dark glass with real presence — contrast is the point.
  ctx.fillStyle = 'rgba(5, 10, 15, 0.78)'
  ctx.fillRect(0, 0, TAG_W, TAG_H)
  ctx.globalAlpha = 0.9
  ctx.strokeStyle = colors.base
  ctx.lineWidth = 4.5
  ctx.strokeRect(2.25, 2.25, TAG_W - 4.5, TAG_H - 4.5)
  // Champagne corner tick — the one warm accent on the plate.
  ctx.strokeStyle = colors.accent
  ctx.lineWidth = 10.5
  ctx.beginPath()
  ctx.moveTo(5.25, 78)
  ctx.lineTo(5.25, 5.25)
  ctx.lineTo(96, 5.25)
  ctx.stroke()
  ctx.globalAlpha = 1
  ctx.textBaseline = 'middle'
  // Shrink-to-fit BOTH lines, not just the value: these strings are authored
  // passport facts of unknown length, not fixed constants, so either line can
  // run long. A smaller line still tells the truth; a clipped one doesn't.
  const fitFont = (text: string, weight: number, from: number, min: number): void => {
    let size = from
    ctx.font = `${weight} ${size}px Sora, sans-serif`
    while (size > min && ctx.measureText(text).width > TAG_W - TAG_INSET * 2) {
      size -= 3
      ctx.font = `${weight} ${size}px Sora, sans-serif`
    }
  }
  const label = spec.label.toUpperCase()
  ctx.fillStyle = colors.accent
  fitFont(label, 700, 45, 30)
  ctx.fillText(label, TAG_INSET, 78)
  // Value line: near-white over the dark glass with a soft blueprint glow.
  fitFont(spec.value, 600, 75, 39)
  ctx.fillStyle = colors.bright
  ctx.shadowColor = colors.base
  ctx.shadowBlur = 27
  ctx.fillText(spec.value, TAG_INSET, 183)
  ctx.shadowBlur = 0
  return canvas
}

/* ---------------------------------------------------------------------------
 * Placement
 * ------------------------------------------------------------------------- */

export interface HoloTagAnchor extends HoloTagSpec {
  /** Plate centre in WORLD units — not the percent carried in `place`. */
  x: number
  y: number
  /** Where the leader line ends, on the piece. */
  anchorX: number
}

/** World size of the sampled image's BOX (transparent padding included). */
export interface HoloImageBox {
  width: number
  height: number
}

/**
 * The image box in world units, for a cloud sampled by
 * `sampleImageSilhouette`: it maps the box (not the tight pixel bounds) with
 * its largest dimension scaled to `fit` and its centre on the origin. That
 * mapping is what makes an authored percent recoverable at all — the tight
 * bounds alone would drift on any render whose garment does not fill it.
 */
export function imageBoxWorldSize(aspect: number, fit: number): HoloImageBox {
  return aspect >= 1
    ? { width: fit, height: fit / aspect }
    : { width: fit * aspect, height: fit }
}

/** The cloud + viewport facts the plates are laid out against. */
export interface HoloTagStage {
  /** Recentred cloud bounds. */
  minY: number
  height: number
  halfW: number
  /** Visible world size at z=0 — the canvas edge is a straight line the
   *  projection must never reveal. */
  vpW: number
  vpH: number
}

/** An authored percent → the recentred cloud's world space. */
export type HoloWorldMap = (place: MarkerPlacement) => { x: number; y: number }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * Hang the plates.
 *
 * A PLACED readout takes its height from where the editor clicked and its
 * rail side from which half of the piece that lands on — click the sleeve and
 * the plate reads level with the sleeve. It keeps riding the side rail rather
 * than floating at the marker's own x, because the plates are the outermost
 * thing on this stage and the rail is the only x at which one is guaranteed
 * to stay inside the visible world box; the leader line is what actually
 * points back at the marker.
 *
 * An UNPLACED readout (or any plate at all when the render never decoded, so
 * there is no image box to map percent into) falls back to the frozen
 * composition, which is exactly what shipped before coordinates existed.
 */
export function layoutHoloTags(
  specs: readonly HoloTagSpec[],
  stage: HoloTagStage,
  toWorld: HoloWorldMap | null,
): HoloTagAnchor[] {
  const sideX = Math.min(stage.halfW * 0.9 + TAG_WIDTH * 0.62, stage.vpW / 2 - TAG_WIDTH / 2 - 0.08)
  const limitY = stage.vpH / 2 - TAG_HEIGHT / 2 - 0.06
  // Keep every leader pointing INWARD: on a cramped stage the clamped plate
  // can end up nearer the axis than its anchor would be, and the line would
  // then be drawn back outward underneath the glass.
  const leaderStartX = Math.max(sideX - (TAG_WIDTH / 2 - 0.02), 0)
  /* `spread` leaves 1 only on an unusually SHALLOW cloud (a wide flat-lay maps
     to one): the slot fractions would then sit closer together than a plate is
     tall, so push them apart about the band midpoint rather than let two
     plates overlap. */
  const spread = Math.max(1, (TAG_HEIGHT * 1.12) / (TAG_MIN_SLOT_GAP_FRAC * stage.height))

  const anchors = specs.slice(0, MAX_HOLO_TAGS).map((spec, i): HoloTagAnchor => {
    const world = toWorld && spec.place ? toWorld(spec.place) : null
    if (world) {
      const side = world.x <= 0 ? -1 : 1
      return {
        ...spec,
        x: side * sideX,
        y: clamp(world.y, -limitY, limitY),
        anchorX: side * Math.min(Math.abs(world.x), leaderStartX),
      }
    }
    const slot = TAG_SLOTS[i]
    const frac = TAG_BAND_MID_FRAC + (slot.yFrac - TAG_BAND_MID_FRAC) * spread
    return {
      ...spec,
      x: slot.side * sideX,
      y: clamp(stage.minY + stage.height * frac, -limitY, limitY),
      anchorX: slot.side * Math.min(stage.halfW * slot.anchorFrac, leaderStartX),
    }
  })
  return separateRails(anchors, limitY)
}

/**
 * Two plates an editor placed a centimetre apart would otherwise overlap, and
 * a plate is large. Push same-rail neighbours down to a readable gap, then
 * walk back up so the push cannot drop the lowest one off the bottom edge.
 */
function separateRails(tags: HoloTagAnchor[], limitY: number): HoloTagAnchor[] {
  for (const side of [-1, 1]) {
    const rail = tags.filter((t) => (t.x < 0 ? -1 : 1) === side).sort((a, b) => b.y - a.y)
    for (let i = 1; i < rail.length; i += 1) {
      if (rail[i - 1].y - rail[i].y < TAG_MIN_GAP) rail[i].y = rail[i - 1].y - TAG_MIN_GAP
    }
    for (let i = rail.length - 1; i >= 0; i -= 1) {
      rail[i].y = Math.max(rail[i].y, -limitY)
      if (i > 0) rail[i - 1].y = Math.min(Math.max(rail[i - 1].y, rail[i].y + TAG_MIN_GAP), limitY)
    }
  }
  return tags
}
