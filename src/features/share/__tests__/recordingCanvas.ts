import type { ShareCanvas } from '../types'

/**
 * A canvas that remembers GEOMETRY instead of rasterising.
 *
 * jsdom has no 2D context, so preset output cannot be inspected pixel-wise.
 * The previous version threw away every coordinate `fillText` was given and
 * faked `measureText` as `text.length * 10` — font-independent — which is
 * precisely why collisions, overflows and safe-area violations could ship
 * without a single red test. It could only ever prove that words existed.
 *
 * This version records where things landed and approximates text width from the
 * parsed font, so `fitText` / `fitSuffix` behave roughly as they do in a browser
 * and the layout can be asserted.
 */

/** Per-family advance width, in ems. Rough, but ORDERED correctly — a condensed
 *  display face really is much narrower than a serif at the same size, and that
 *  ordering is what the fitting helpers depend on. */
const FAMILY_EM: ReadonlyArray<readonly [RegExp, number]> = [
  [/Anton|Oswald/, 0.44],
  [/Cinzel/, 0.62],
  [/Consolas|SF Mono|monospace/, 0.55],
]
const DEFAULT_EM = 0.58

/** Generous enough that a "no collision" assertion means real optical air. */
const ASCENT_RATIO = 0.74
const DESCENT_RATIO = 0.2

export interface RecordedText {
  text: string
  /** The anchor passed to `fillText`, before alignment is applied. */
  x: number
  /** Alphabetic baseline. */
  y: number
  font: string
  align: CanvasTextAlign
  size: number
  width: number
  /** Resolved bounding box, alignment applied. */
  left: number
  right: number
  top: number
  bottom: number
}

export interface RecordedRect {
  x: number
  y: number
  w: number
  h: number
  kind: 'fill' | 'stroke'
}

/** A straight stroked segment — a rule, divider, rail or bracket arm. Curved
 *  and rounded paths are excluded, so a thumbnail's frame is never mistaken for
 *  a rule drawn across the composition. */
export interface RecordedLine {
  x0: number
  y0: number
  x1: number
  y1: number
}

/** A circular arc. Only one thing in the set draws them — the jarvis reticle —
 *  and where its radii land relative to the subject is the whole point of it. */
export interface RecordedArc {
  x: number
  y: number
  r: number
}

export interface CanvasRecording {
  texts: string[]
  draws: RecordedText[]
  images: Array<{ dx: number; dy: number; dw: number; dh: number }>
  rects: RecordedRect[]
  lines: RecordedLine[]
  arcs: RecordedArc[]
  /** Every text drawn, joined — convenient for substring assertions. */
  allText: string
}

function fontSize(font: string): number {
  return Number(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] ?? 16)
}

function fontEm(font: string): number {
  for (const [pattern, em] of FAMILY_EM) {
    if (pattern.test(font)) return em
  }
  return DEFAULT_EM
}

export function createRecordingCanvas(): { ctx: ShareCanvas; recording: CanvasRecording } {
  const texts: string[] = []
  const draws: RecordedText[] = []
  const images: CanvasRecording['images'] = []
  const rects: RecordedRect[] = []
  const lines: RecordedLine[] = []
  const arcs: RecordedArc[] = []

  /** Subpaths built only from moveTo/lineTo. A subpath that saw an arc is
   *  marked curved and never reported as a rule. */
  let subpaths: Array<{ points: Array<[number, number]>; curved: boolean }> = []

  const currentSubpath = () => subpaths[subpaths.length - 1]

  const gradient: CanvasGradient = {
    addColorStop: () => undefined,
  } as CanvasGradient

  const ctx: ShareCanvas = {
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    globalAlpha: 1,
    save: () => undefined,
    restore: () => undefined,
    beginPath: () => {
      subpaths = []
    },
    closePath: () => undefined,
    moveTo: (x, y) => {
      subpaths.push({ points: [[x, y]], curved: false })
    },
    lineTo: (x, y) => {
      const sub = currentSubpath()
      if (sub) sub.points.push([x, y])
      else subpaths.push({ points: [[x, y]], curved: false })
    },
    arc: (x, y, r) => {
      arcs.push({ x, y, r })
      const sub = currentSubpath()
      if (sub) sub.curved = true
    },
    arcTo: () => {
      const sub = currentSubpath()
      if (sub) sub.curved = true
    },
    rect: () => undefined,
    fill: () => undefined,
    stroke: () => {
      for (const sub of subpaths) {
        if (sub.curved) continue
        for (let i = 1; i < sub.points.length; i += 1) {
          const [x0, y0] = sub.points[i - 1] ?? [0, 0]
          const [x1, y1] = sub.points[i] ?? [0, 0]
          lines.push({ x0, y0, x1, y1 })
        }
      }
    },
    clip: () => undefined,
    fillRect: (x, y, w, h) => {
      rects.push({ x, y, w, h, kind: 'fill' })
    },
    strokeRect: (x, y, w, h) => {
      rects.push({ x, y, w, h, kind: 'stroke' })
      // A stroked rect is four rules; presets use it for frames and plates, and
      // a frame rule crossing a baseline is exactly the defect worth catching.
      lines.push({ x0: x, y0: y, x1: x + w, y1: y })
      lines.push({ x0: x, y0: y + h, x1: x + w, y1: y + h })
      lines.push({ x0: x, y0: y, x1: x, y1: y + h })
      lines.push({ x0: x + w, y0: y, x1: x + w, y1: y + h })
    },
    fillText: (text, x, y) => {
      texts.push(text)
      const size = fontSize(ctx.font)
      const width = text.length * size * fontEm(ctx.font)
      const align = ctx.textAlign
      const left = align === 'right' ? x - width : align === 'center' ? x - width / 2 : x
      draws.push({
        text,
        x,
        y,
        font: ctx.font,
        align,
        size,
        width,
        left,
        right: left + width,
        top: y - size * ASCENT_RATIO,
        bottom: y + size * DESCENT_RATIO,
      })
    },
    measureText: (text: string) => ({
      width: text.length * fontSize(ctx.font) * fontEm(ctx.font),
    }),
    drawImage: (_image, dx, dy, dw, dh) => {
      images.push({ dx, dy, dw, dh })
    },
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    translate: () => undefined,
    rotate: () => undefined,
  }

  return {
    ctx,
    get recording() {
      return { texts, draws, images, rects, lines, arcs, allText: texts.join(' | ') }
    },
  }
}

/** A stand-in for a decoded image — only its intrinsic size is ever read. */
export function fakeImage(width = 800, height = 1000): CanvasImageSource {
  // Structurally all `drawImage` and the fit helpers need. Casting once here
  // keeps every preset test free of the same cast.
  return { width, height } as unknown as CanvasImageSource
}
