import { parseColor, SAFE_FALLBACK_COLOR } from '@/shared/lib/color'
import type { ShareCanvas } from '../types'

/**
 * Small, dependency-free canvas helpers shared by every preset. Nothing here
 * knows what ANVL is — it is geometry, colour and text fitting.
 */

/**
 * A colour at a given alpha.
 *
 * Presets used to build transparency by concatenating a hex suffix
 * (`` `${champagne}88` ``). CMS palette tokens are validated as bare strings and
 * `mix()` emits `rgba(...)` whenever alpha is involved, so that concatenation
 * can produce an INVALID colour — which canvas silently ignores, leaving the
 * PREVIOUS fillStyle in place and painting a whole block the wrong colour with
 * no error anywhere. Parsing first makes that failure impossible.
 */
export function alpha(color: string, a: number): string {
  const c = parseColor(color) ?? SAFE_FALLBACK_COLOR
  const out = Math.min(1, Math.max(0, a * c.a))
  return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${Math.round(out * 1000) / 1000})`
}

/**
 * Width for a decorative rule. A literal `lineWidth = 1` is 0.37px once a
 * 1080px export is displayed at ~400px in a feed, so gold hairlines turn into
 * grey smears after recompression. Nothing in the set strokes below this.
 */
export function hairlineWidth(s: number): number {
  return Math.max(1.5, 2 * s)
}

/**
 * Presets share one canvas and set only the properties they care about, so a
 * stray `textAlign` or `font` from the previous draw would silently change the
 * next one. Every render starts from the same known state.
 */
export function resetShareCanvas(ctx: ShareCanvas): void {
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.font = '400 16px sans-serif'
  ctx.fillStyle = '#000000'
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 1
  ctx.globalAlpha = 1
}

/**
 * Load an image for canvas use.
 *
 * `crossOrigin` is set ONLY for remote http(s) sources. Setting it puts the
 * fetch in CORS mode, and a CORS-mode fetch of a `data:` or `blob:` URL fails
 * outright in several engines — which is precisely how a user's own photo can
 * silently never arrive while the surrounding UI looks fine. Remote catalog
 * images still need it, or they taint the canvas and `toDataURL()` throws.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (/^https?:/i.test(src)) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Image failed to load: ${src.slice(0, 64)}`))
    img.src = src
  })
}

/** Load without throwing — a missing decoration must never fail a render. */
export function loadImageOrNull(src: string | null | undefined): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null)
  return loadImage(src).catch(() => null)
}

export function cssColor(name: string, fallback: string): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

/** Intrinsic size of anything canvas can draw. */
export function sourceSize(image: CanvasImageSource): { w: number; h: number } {
  const candidate = image as { width?: number | { baseVal: number }; height?: number | { baseVal: number } }
  const w = typeof candidate.width === 'number' ? candidate.width : (candidate.width?.baseVal ?? 0)
  const h = typeof candidate.height === 'number' ? candidate.height : (candidate.height?.baseVal ?? 0)
  return { w, h }
}

/** `object-fit: cover` into the whole canvas. */
export function drawCover(ctx: ShareCanvas, image: CanvasImageSource, w: number, h: number): void {
  const { w: iw, h: ih } = sourceSize(image)
  if (!iw || !ih) return
  const scale = Math.max(w / iw, h / ih)
  const dw = iw * scale
  const dh = ih * scale
  ctx.drawImage(image, (w - dw) / 2, (h - dh) / 2, dw, dh)
}

/**
 * The box `object-fit: contain` would produce, centred on (cx, cy).
 *
 * It returns the geometry rather than drawing it because a contained product
 * render usually needs something drawn AROUND it — a plate, a frame, a shadow —
 * and the only way to fit that to the artwork instead of to the box it was
 * offered is to know where the artwork actually landed. Null when the source
 * has no intrinsic size or the box has no room.
 */
export function containBox(
  image: CanvasImageSource,
  cx: number,
  cy: number,
  maxW: number,
  maxH: number,
): { x: number; y: number; w: number; h: number } | null {
  const { w: iw, h: ih } = sourceSize(image)
  if (!iw || !ih || maxW <= 0 || maxH <= 0) return null
  const scale = Math.min(maxW / iw, maxH / ih)
  const w = iw * scale
  const h = ih * scale
  return { x: cx - w / 2, y: cy - h / 2, w, h }
}

/** Path a rounded rectangle (no fill/stroke — the caller decides). */
export function roundRectPath(
  ctx: ShareCanvas,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.arcTo(x + w, y, x + w, y + radius, radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius)
  ctx.lineTo(x + radius, y + h)
  ctx.arcTo(x, y + h, x, y + h - radius, radius)
  ctx.lineTo(x, y + radius)
  ctx.arcTo(x, y, x + radius, y, radius)
  ctx.closePath()
}

/**
 * Outline a rounded box that matches artwork drawn by `drawImageInRoundedBox`.
 * Stroking a SQUARE rect around a rounded clip leaves the frame's corners
 * visibly detached from the image — four gold ticks floating over the photo.
 * The path is inset by half the line width so the stroke sits inside the
 * artwork rather than straddling its edge.
 */
export function strokeRoundRect(
  ctx: ShareCanvas,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const lw = ctx.lineWidth
  roundRectPath(ctx, x + lw / 2, y + lw / 2, w - lw, h - lw, Math.max(0, r - lw / 2))
  ctx.stroke()
}

/**
 * A stroked rectangle snapped so the line lands on whole pixels. An odd line
 * width on an integer coordinate straddles two rows and antialiases into a
 * blur, which is what makes decorative frames look dirty after JPEG.
 */
export function strokeCrispRect(
  ctx: ShareCanvas,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const lw = ctx.lineWidth
  ctx.strokeRect(Math.round(x) + lw / 2, Math.round(y) + lw / 2, Math.round(w) - lw, Math.round(h) - lw)
}

/**
 * Draw an image cropped to `cover` inside a rounded box — how the piece
 * thumbnail sits in every preset.
 */
export function drawImageInRoundedBox(
  ctx: ShareCanvas,
  image: CanvasImageSource,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const { w: iw, h: ih } = sourceSize(image)
  if (!iw || !ih) return
  ctx.save()
  roundRectPath(ctx, x, y, w, h, r)
  ctx.clip()
  const scale = Math.max(w / iw, h / ih)
  const dw = iw * scale
  const dh = ih * scale
  ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
  ctx.restore()
}

/** Single-line ellipsis fit — used for names and feats on tight rails. */
export function fitText(ctx: ShareCanvas, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let out = text
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) {
    out = out.slice(0, -1)
  }
  return `${out.trimEnd()}…`
}

/**
 * Fit `body` against a budget that already accounts for a literal prefix.
 * Callers used to subtract a guessed pixel width for strings like `'> PIECE: '`
 * — some guesses were short, so a name fitted exactly to the budget printed
 * past the margin. Measuring is free and cannot drift.
 * Set `ctx.font` before calling.
 */
export function fitSuffix(
  ctx: ShareCanvas,
  prefix: string,
  body: string,
  maxWidth: number,
): string {
  return `${prefix}${fitText(ctx, body, maxWidth - ctx.measureText(prefix).width)}`
}

/** "MAR 2025" — the member-since stamp. */
export function monthYear(iso: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date
    .toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    .toUpperCase()
}

/**
 * "JUL 2, 2026" — localised, but spelled out. A numeric `7/2/2026` set beside a
 * 49px display headline reads like a receipt; the month name matches the rest
 * of the stamped meta (`monthYear`).
 */
export function featDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}
