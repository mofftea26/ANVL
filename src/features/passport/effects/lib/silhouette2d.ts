/**
 * silhouette2d — the shared canvas-2D product-silhouette sampler behind the
 * passport section effects.
 *
 * One decode + alpha-gated small raster yields every 2D shape read an effect
 * needs: the occupancy mask, the ordered outer outline (Moore-neighbour
 * contour trace → closed moving-average smoothing → even arc-length resample
 * — EffectPiece's tracer), per-row left/right edge intercepts (EffectSpecs'
 * edge profile), the silhouette centroid, and the natural aspect for
 * `object-contain` letterbox math (`containedRect`).
 *
 * WHY THIS MODULE MUST NEVER IMPORT `@/shared/webgl/particleShapes` (or
 * three.js in any form): `particleShapes` imports three.js at module top
 * level, so a canvas-2D/SVG effect importing it would drag `vendor-three`
 * into its own lazy chunk — the chunk-hygiene rule in
 * docs/animation-guidelines.md, "Passport section effects". This module is
 * `sampleImageSilhouette`'s alpha-gate technique re-derived in plain
 * canvas-2D: no three.js, no React, no GSAP — pure functions plus one async
 * loader, so the geometry is unit-testable from synthetic pixels.
 *
 * Degradation contract: `sampleSilhouette2D` resolves null on ANY failure —
 * empty url, decode error, missing 2D context, CORS-tainted raster, a
 * silhouette too sparse to be a garment (by pixels or by rows), an opaque
 * image with no alpha silhouette (>92% coverage), or an untraceable contour.
 * Consumers must always carry their own designed fallback.
 *
 * Browser-only (Image + canvas) — call from effects, never during SSR.
 */

export interface SilhouettePoint {
  /** Normalized [0..1] image-box coordinate. */
  x: number
  y: number
}

/** One raster row's silhouette intercepts, normalized to image width. */
export interface SilhouetteRow {
  left: number
  /** Exclusive right edge — `(lastOpaqueX + 1) / width`. */
  right: number
}

export interface SilhouetteSample2D {
  /** Alpha-gated occupancy raster (1 = opaque enough), row-major. */
  mask: Uint8Array
  maskWidth: number
  maskHeight: number
  /** Natural image aspect (w/h) — feed `containedRect`. */
  aspect: number
  /** Ordered outer contour: smoothed, evenly arc-length resampled, closed. */
  outline: SilhouettePoint[]
  /** Per raster row, top to bottom; null = no opaque pixel on that row. */
  rows: Array<SilhouetteRow | null>
  /** Mean of all opaque pixel centers, normalized. */
  centroid: SilhouettePoint
}

export interface SampleSilhouette2DOptions {
  /** Even arc-length points on the outline loop (default 256). */
  outlinePoints?: number
  /** Max raster dimension — silhouette needs shape, not resolution (default 150). */
  rasterCap?: number
  /** Alpha must exceed this to count as silhouette (default 48). */
  alphaGate?: number
}

const DEFAULT_OUTLINE_POINTS = 256
const DEFAULT_RASTER_CAP = 150
const DEFAULT_ALPHA_GATE = 48
/* Degradation gates — the union of both original effects' ladders: too few
   pixels or a near-full raster (a JPEG with no alpha) is not a garment, and
   neither is a profile with almost no populated rows. */
const MIN_FILLED_PIXELS = 40
const MAX_COVERAGE = 0.92
const minFilledRows = (h: number) => Math.max(8, h * 0.2)
const MIN_RING_ENTRIES = 48 // flat x,y pairs → a 24-point contour minimum

/* Moore neighbourhood, clockwise in screen coords (y down), starting east. */
const DIR_X = [1, 1, 0, -1, -1, -1, 0, 1]
const DIR_Y = [0, 1, 1, 1, 0, -1, -1, -1]

/** Moore-neighbour trace: the outer boundary as an ordered flat pixel loop. */
function traceOuterContour(occ: Uint8Array, w: number, h: number): number[] | null {
  let start = -1
  for (let i = 0; i < w * h && start < 0; i += 1) if (occ[i]) start = i
  if (start < 0) return null
  const sx = start % w
  const sy = (start / w) | 0
  const at = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && occ[y * w + x] === 1
  const ring: number[] = [sx, sy]
  let cx = sx
  let cy = sy
  let back = 4 // the raster scan arrived from the west
  const maxSteps = w * h * 4
  for (let step = 0; step < maxSteps; step += 1) {
    let found = -1
    for (let k = 1; k <= 8 && found < 0; k += 1) {
      const d = (back + k) % 8
      if (at(cx + DIR_X[d], cy + DIR_Y[d])) found = d
    }
    if (found < 0) return null // an isolated pixel is not an outline
    cx += DIR_X[found]
    cy += DIR_Y[found]
    if (cx === sx && cy === sy) return ring.length >= MIN_RING_ENTRIES ? ring : null
    ring.push(cx, cy)
    back = (found + 4) % 8
  }
  return null
}

/** Closed moving-average pass — melts raster staircase into an organic curve. */
function smoothClosed(xy: number[]): number[] {
  const n = xy.length / 2
  const out = new Array<number>(xy.length)
  for (let i = 0; i < n; i += 1) {
    let sx = 0
    let sy = 0
    for (let k = -2; k <= 2; k += 1) {
      const j = (((i + k) % n) + n) % n
      sx += xy[j * 2]
      sy += xy[j * 2 + 1]
    }
    out[i * 2] = sx / 5
    out[i * 2 + 1] = sy / 5
  }
  return out
}

/** Resample a closed polyline to `m` even arc-length points. */
function resampleClosed(xy: number[], m: number): number[] | null {
  const n = xy.length / 2
  const seg = new Float64Array(n)
  let total = 0
  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n
    seg[i] = Math.hypot(xy[j * 2] - xy[i * 2], xy[j * 2 + 1] - xy[i * 2 + 1])
    total += seg[i]
  }
  if (total <= 0) return null
  const out = new Array<number>(m * 2)
  let i = 0
  let acc = 0
  for (let k = 0; k < m; k += 1) {
    const target = (k / m) * total
    while (i < n - 1 && acc + seg[i] < target) {
      acc += seg[i]
      i += 1
    }
    const fr = seg[i] > 0 ? (target - acc) / seg[i] : 0
    const j = (i + 1) % n
    out[k * 2] = xy[i * 2] + (xy[j * 2] - xy[i * 2]) * fr
    out[k * 2 + 1] = xy[i * 2 + 1] + (xy[j * 2 + 1] - xy[i * 2 + 1]) * fr
  }
  return out
}

/**
 * The pure core: alpha-gate a decoded RGBA raster into the full sample.
 * Exported so tests (jsdom decodes no images) can feed synthetic pixels.
 * Null = no usable silhouette — same ladder as `sampleSilhouette2D`.
 */
export function buildSilhouetteSample2D(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  aspect: number,
  opts?: SampleSilhouette2DOptions,
): SilhouetteSample2D | null {
  const gate = opts?.alphaGate ?? DEFAULT_ALPHA_GATE
  const outlinePoints = opts?.outlinePoints ?? DEFAULT_OUTLINE_POINTS
  if (width < 2 || height < 2) return null
  const mask = new Uint8Array(width * height)
  const rows: Array<SilhouetteRow | null> = new Array<SilhouetteRow | null>(height).fill(null)
  let filled = 0
  let filledRows = 0
  let sumX = 0
  let sumY = 0
  for (let y = 0; y < height; y += 1) {
    let lo = -1
    let hi = -1
    for (let x = 0; x < width; x += 1) {
      if (!(data[(y * width + x) * 4 + 3] > gate)) continue
      mask[y * width + x] = 1
      filled += 1
      sumX += x + 0.5
      sumY += y + 0.5
      if (lo < 0) lo = x
      hi = x
    }
    if (lo < 0) continue
    rows[y] = { left: lo / width, right: (hi + 1) / width }
    filledRows += 1
  }
  if (filled < MIN_FILLED_PIXELS || filled > width * height * MAX_COVERAGE) return null
  if (filledRows < minFilledRows(height)) return null
  const ring = traceOuterContour(mask, width, height)
  if (!ring) return null
  const even = resampleClosed(smoothClosed(smoothClosed(ring)), outlinePoints)
  if (!even) return null
  const outline: SilhouettePoint[] = new Array<SilhouettePoint>(outlinePoints)
  for (let i = 0; i < outlinePoints; i += 1) {
    outline[i] = { x: (even[i * 2] + 0.5) / width, y: (even[i * 2 + 1] + 0.5) / height }
  }
  return {
    mask,
    maskWidth: width,
    maskHeight: height,
    aspect,
    outline,
    rows,
    centroid: { x: sumX / filled / width, y: sumY / filled / height },
  }
}

/** Decode with CORS opt-in so `getImageData` stays readable off a CDN. */
function decodeImage(url: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`silhouette image failed: ${url}`))
    image.src = url
  })
}

/**
 * Decode `url`, raster it small, and sample the silhouette. Resolves null on
 * ANY failure (see the module header's degradation contract) — never rejects.
 */
export async function sampleSilhouette2D(
  url: string,
  opts?: SampleSilhouette2DOptions,
): Promise<SilhouetteSample2D | null> {
  if (!url) return null
  try {
    const img = await decodeImage(url)
    const natW = img.naturalWidth || 1
    const natH = img.naturalHeight || 1
    const cap = opts?.rasterCap ?? DEFAULT_RASTER_CAP
    const scale = Math.min(1, cap / Math.max(natW, natH))
    const w = Math.max(2, Math.round(natW * scale))
    const h = Math.max(2, Math.round(natH * scale))
    const raster = document.createElement('canvas')
    raster.width = w
    raster.height = h
    const ctx = raster.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, w, h)
    const { data } = ctx.getImageData(0, 0, w, h) // throws on CORS taint → catch
    return buildSilhouetteSample2D(data, w, h, natW / natH, opts)
  } catch {
    return null
  }
}

/** `object-contain` letterbox rect of an `aspect` (w/h) image inside a box. */
export function containedRect(
  boxW: number,
  boxH: number,
  aspect: number,
): { x: number; y: number; w: number; h: number } {
  const a = Number.isFinite(aspect) && aspect > 0 ? aspect : 1
  const w = Math.min(boxW, boxH * a)
  const h = w / a
  return { x: (boxW - w) / 2, y: (boxH - h) / 2, w, h }
}
