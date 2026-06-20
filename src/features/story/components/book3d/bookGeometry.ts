import * as THREE from 'three'

/* --- Shared dimensions for the one book (shelf + reader render the same object). --- */
export const COVER_W = 1.45
export const COVER_H = 2.05
export const BOOK_T = 0.42
export const COVER_T = 0.05
export const SPINE_X = -COVER_W / 2
export const PAGE_W = COVER_W * 0.95
export const PAGE_H = COVER_H * 0.96
export const BLOCK_T = BOOK_T - COVER_T * 2
/** Top of the right page block. */
export const TOP_Z = BOOK_T / 2 - COVER_T
/* When open, the book recenters so the page surfaces sit on the z=0 plane —
   the CSS page layer only matches WebGL exactly there (see the Html note). */
export const PAGE_PLANE_Z = (TOP_Z + 0.002 + BOOK_T / 2 + 0.012) / 2
/* drei <Html> screen-space content: world = px * factor / 400 (factor below). */
export const HTML_DISTANCE = 1.24
export const PAGE_PX_W = 430
export const PAGE_PX_H = 610
export const OPEN_DURATION = 1.05
export const TURN_SPEED = 1.2
/** Released paper falls/settles with this exponential rate (per second). */
export const SETTLE_RATE = 9
/** Flick this fast (rad/s) and the page commits regardless of position. */
export const FLICK_VELOCITY = 1.6
export const FLUTTER_COUNT = 3

/** Pages extend past their nominal width so the two sheets MEET at the spine. */
export const GUTTER_EXT = 0.036
/** Full sheet width (nominal page + the gutter extension). */
export const PAGE_FULL_W = PAGE_W + GUTTER_EXT
/* The two page planes rest at different heights (right on the block, left on
   air above the opened cover). Their dips are tuned so both inner edges land
   at the SAME z (seam ≈ 0.132) — two sheets diving into one shared valley:
   right: 0.162 − 0.030 = 0.132;  left: 0.222 − 0.090 = 0.132. The dips are
   localized near the spine (tight sigma) so the right sheet clears the
   narrowed gilded block while still carving a real crease. */
export const GUTTER_DIP_RIGHT = 0.03
export const GUTTER_DIP_LEFT = 0.09
/** How far the leaf's hinge edge droops into the binding while turning. */
export const LEAF_DROOP = 0.045
/** Max world-z lift of the hovered page corner (the grab invitation). */
export const CORNER_PEEL = 0.05

export function easeInOutCubic(p: number): number {
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
}

export const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v))

/** Gutter shading — a deep, narrow shadow hugs each sheet's inner edge so the
    seam reads as two pages diving into the binding, not one flat surface. */
export function applyGutterShade(geo: THREE.PlaneGeometry, innerEdge: number): void {
  const pos = geo.attributes.position as THREE.BufferAttribute
  const colors = new Float32Array(pos.count * 3)
  for (let i = 0; i < pos.count; i++) {
    const d = Math.abs(pos.getX(i) - innerEdge)
    // Sharp core crease + a wider soft falloff for the rolled-paper gradient.
    const crease = 0.46 * Math.exp(-(d * d) / (2 * 0.05 * 0.05))
    const roll = 0.14 * Math.exp(-(d * d) / (2 * 0.22 * 0.22))
    const shade = 1 - crease - roll
    colors[i * 3] = shade
    colors[i * 3 + 1] = shade
    colors[i * 3 + 2] = shade
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
}

/**
 * An open-book page surface that curves down toward the spine — paper joining
 * the binding in a soft gutter instead of lying dead flat against a ridge.
 * The right page's crease is shallow/narrow (its slope faces the key light and
 * would otherwise read as a bright band); the left page carries the deep roll
 * (its slope falls in shadow, like a real gutter). Vertical segments exist so
 * the outer corner can peel up under the cursor (see Book's hover deform).
 */
export function makeGutterPageGeometry(side: 'left' | 'right'): THREE.PlaneGeometry {
  const w = PAGE_FULL_W
  const geo = new THREE.PlaneGeometry(w, PAGE_H, 28, 8)
  const sign = side === 'right' ? -1 : 1
  geo.translate((sign * GUTTER_EXT) / 2, 0, 0)
  const innerEdge = (sign * (w + GUTTER_EXT)) / 2
  const amp = side === 'right' ? GUTTER_DIP_RIGHT : GUTTER_DIP_LEFT
  const sigma = side === 'right' ? 0.08 : 0.13
  const pos = geo.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const d = Math.abs(pos.getX(i) - innerEdge)
    pos.setZ(i, -amp * Math.exp(-(d * d) / (2 * sigma * sigma)))
  }
  applyGutterShade(geo, innerEdge)
  geo.computeVertexNormals()
  return geo
}

/** The turning leaf — reaches the spine pivot exactly (no slot at the hinge)
    and carries the same gutter shading as the resting pages. */
export function makeLeafGeometry(): THREE.PlaneGeometry {
  const w = PAGE_FULL_W
  const geo = new THREE.PlaneGeometry(w, PAGE_H, 36, 1)
  applyGutterShade(geo, -w / 2)
  return geo
}

/**
 * Lift a page's outer-bottom corner (the grab invitation while hovering).
 * `base` is the undeformed position array captured at geometry build time —
 * the gutter dip lives in there, so peeling never fights the binding curve.
 */
export function applyCornerPeel(
  geo: THREE.PlaneGeometry,
  base: Float32Array,
  amount: number,
  side: 'left' | 'right',
): void {
  const pos = geo.attributes.position as THREE.BufferAttribute
  const cx = (side === 'right' ? 1 : -1) * (PAGE_W / 2)
  const cy = -PAGE_H / 2
  const s2 = 2 * 0.26 * 0.26
  for (let i = 0; i < pos.count; i++) {
    const dx = base[i * 3] - cx
    const dy = base[i * 3 + 1] - cy
    const lift = amount * CORNER_PEEL * Math.exp(-(dx * dx + dy * dy) / s2)
    pos.setZ(i, base[i * 3 + 2] + lift)
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()
}

/** Soft radial blob used as the turning leaf's traveling ground shadow. */
export function makeRadialShadowTexture(): THREE.CanvasTexture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0, 'rgba(0,0,0,0.85)')
    g.addColorStop(0.55, 'rgba(0,0,0,0.4)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
