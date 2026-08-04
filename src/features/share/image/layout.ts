import type { ShareFormatKey } from '../types'

/**
 * The frame every share preset composes inside.
 *
 * The old model handed presets a single number, `u = H / 1920`, and used it for
 * BOTH vertical positions and every size. Because the canvas is 1080px wide in
 * all three formats, that shrank every font, stroke, margin and thumbnail by
 * 30% on a post and 44% on a square while the image itself stayed the same
 * width — so the feed formats read as squashed stories rather than as their own
 * compositions.
 *
 * `ShareLayout` separates the three things that were conflated:
 *   - `s`      TYPE SCALE and every other SIZE, derived from WIDTH (constant).
 *   - `left/right/cw`  HORIZONTAL rhythm, derived from width.
 *   - `top/bottom/free`  VERTICAL rhythm, the only quantity that may differ
 *     between formats — a shorter canvas simply has less slack between blocks.
 */

/**
 * Instagram draws its own furniture over a 1080x1920 story: the profile row and
 * close button cover roughly the first 250px, and the reply bar, sticker tray
 * and home indicator cover roughly the last 320px. Feed and DM formats are
 * clean, so they only get a normal optical margin.
 *
 * These match Meta's story-ads safe-area guidance; they are guidance, not an
 * API, which is exactly why they live in one place — a device check can retune
 * the whole preset set from these two numbers.
 */
const STORY_CHROME_TOP = 250
const STORY_CHROME_BOTTOM = 320
/** Feed/DM formats have no overlay, so they get a plain optical margin. */
const FEED_MARGIN = 72
/** Air between the safe edge and the first/last baseline. */
const HEADROOM = 48
/** Side margin. One value for the whole set — there used to be five. */
const SIDE_MARGIN = 64

export interface ShareLayout {
  format: ShareFormatKey
  W: number
  H: number
  /**
   * DESIGN scale: font sizes, stroke widths, corner radii, margins, artwork
   * boxes. Derived from WIDTH — which is 1080 everywhere — so a headline is the
   * same physical size in a DM as it is on a story. Never use it for a vertical
   * position.
   */
  s: number
  /** Side margin, in pixels. */
  pad: number
  /** Left content edge. */
  left: number
  /** Right content edge. */
  right: number
  /** Content column width. */
  cw: number
  /** First pixel row app chrome cannot cover. Decorative frames sit here. */
  safeTop: number
  /** First safe BASELINE. Nothing informative is drawn above it. */
  top: number
  /** Last safe baseline. The closing mark sits exactly here. */
  bottom: number
  /** Vertical room between `top` and `bottom`. */
  free: number
}

export function buildShareLayout(format: ShareFormatKey, W: number, H: number): ShareLayout {
  const s = W / 1080
  const pad = SIDE_MARGIN * s
  const safeTop = (format === 'story' ? STORY_CHROME_TOP : FEED_MARGIN) * s
  const safeBottom = (format === 'story' ? STORY_CHROME_BOTTOM : FEED_MARGIN) * s
  const top = safeTop + HEADROOM * s
  const bottom = H - safeBottom
  return {
    format,
    W,
    H,
    s,
    pad,
    left: pad,
    right: W - pad,
    cw: W - pad * 2,
    safeTop,
    top,
    bottom,
    free: bottom - top,
  }
}

/**
 * One 1.25 modular type scale for the whole set, anchored at 20px (at s = 1).
 * There used to be 26 unrelated font sizes across nine files, which is the
 * mechanical reason the images read as assembled rather than designed.
 *
 * Roles: `hero` is the PAYLOAD (the feat), `title` the piece, `lead` the
 * athlete, `meta`/`micro` everything that supports them.
 */
export const TYPE = {
  micro: 16,
  meta: 20,
  body: 25,
  lead: 31,
  title: 39,
  hero: 49,
  mast: 61,
} as const

/**
 * Decorative frames sit ON the safe box at the top and hang 40px below the last
 * baseline, so a frame rule never crowds the closing mark. Presets that draw
 * one must move their footer up by `FRAMED_FOOTER_LIFT`.
 */
export function frameBox(L: ShareLayout, inset: number): {
  x: number
  y: number
  w: number
  h: number
} {
  const x = L.pad - inset * L.s
  const y = L.safeTop
  return { x, y, w: L.W - x * 2, h: L.bottom + 40 * L.s - y }
}

/** How far a framed preset lifts its closing mark off `layout.bottom`. */
export const FRAMED_FOOTER_LIFT = 44
