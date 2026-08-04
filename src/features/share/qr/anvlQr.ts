import QRCode from 'qrcode'
import { ANVL_CREST_PATHS, ANVL_CREST_VIEWBOX } from '@/shared/assets/brand/anvlCrestPath'

/**
 * The ANVL QR — a brand object, not a utility barcode.
 *
 * Modules are drawn as rounded strokes that fuse where they touch, the three
 * finder eyes become rounded rings, and the crest sits knocked out of the
 * middle. All of that costs readable area, which is why the payload is encoded
 * at error-correction level H (30% recoverable) and the knockout is held to a
 * fraction of that budget — see {@link knockoutBounds}.
 *
 * Two surfaces consume this: the share sheet (one code, on screen, needs a Blob
 * for `navigator.share`) and the admin passport print sheet (up to 500 codes,
 * on paper, needs progress and no Blob). They share the renderer and the
 * geometry; they do NOT share colours — see {@link PRINT_QR_COLORS}.
 */

/** Quiet zone, in modules, on every side. */
export const QR_QUIET_MODULES = 2
/** Finder patterns are 7×7 modules at three corners. */
export const QR_FINDER_SIZE = 7
/** Crest knockout, as a fraction of the code's width. */
export const QR_KNOCKOUT_RATIO = 0.24
/**
 * How much of the crest plate the crest may fill. The remainder is deliberate
 * air: the mark is taller than wide, so it is fitted by HEIGHT and the leftover
 * width reads as side margin. Raising this is the only knob for a larger mark.
 */
export const QR_CREST_BOX_RATIO = 0.52
/** Default output edge, in px. */
const DEFAULT_QR_PX = 1024

export interface QrMatrix {
  size: number
  /** Row-major, 1 = dark. */
  get(row: number, col: number): boolean
}

/** Where each module lands on the canvas. */
export interface QrGeometry {
  /** Side of one module in px. */
  cell: number
  /** Offset of module (0,0) in px, i.e. the quiet zone. */
  origin: number
}

export function qrGeometry(pixelSize: number, moduleCount: number): QrGeometry {
  const total = moduleCount + QR_QUIET_MODULES * 2
  const cell = pixelSize / total
  return { cell, origin: cell * QR_QUIET_MODULES }
}

/** True for any module inside one of the three finder patterns. */
export function isFinderModule(row: number, col: number, moduleCount: number): boolean {
  const near = moduleCount - QR_FINDER_SIZE
  const inTopLeft = row < QR_FINDER_SIZE && col < QR_FINDER_SIZE
  const inTopRight = row < QR_FINDER_SIZE && col >= near
  const inBottomLeft = row >= near && col < QR_FINDER_SIZE
  return inTopLeft || inTopRight || inBottomLeft
}

/**
 * The square of modules hidden behind the crest, as inclusive `[from, to]`
 * indices. Kept centred and odd-sized so the crest never sits half a module
 * off-axis.
 */
export function knockoutBounds(
  moduleCount: number,
  ratio: number = QR_KNOCKOUT_RATIO,
): { from: number; to: number; count: number } {
  let span = Math.round(moduleCount * ratio)
  if ((moduleCount - span) % 2 !== 0) span += 1
  const from = Math.floor((moduleCount - span) / 2)
  const to = from + span - 1
  return { from, to, count: span }
}

/** Fraction of all modules the knockout covers — must stay under the EC budget. */
export function knockoutAreaRatio(moduleCount: number, ratio: number = QR_KNOCKOUT_RATIO): number {
  const { count } = knockoutBounds(moduleCount, ratio)
  return (count * count) / (moduleCount * moduleCount)
}

export function isKnockoutModule(row: number, col: number, moduleCount: number): boolean {
  const { from, to } = knockoutBounds(moduleCount)
  return row >= from && row <= to && col >= from && col <= to
}

/* -------------------------------------------------------- crest placement */

/** An axis-aligned rectangle in canvas px. */
export interface QrRect {
  x: number
  y: number
  width: number
  height: number
}

/** The light plate the crest is knocked out of, in canvas px. Always square. */
export function crestPlateRect(pixelSize: number, moduleCount: number): QrRect {
  const { cell, origin } = qrGeometry(pixelSize, moduleCount)
  const { from, count } = knockoutBounds(moduleCount)
  const edge = origin + from * cell
  const side = count * cell
  return { x: edge, y: edge, width: side, height: side }
}

/**
 * Fit the crest inside a max box and centre it on a point.
 *
 * Takes a CENTRE and a MAX BOX, never a corner and a side. The viewBox is
 * 1208×1540 — taller than wide — so `Math.min` always scales by HEIGHT and the
 * drawn mark is only 78.4% of a square box's width. Positioning from a corner
 * therefore needs two DIFFERENT offsets on the two axes, one of which is always
 * zero; the moment one is edited the mark drifts. It did: the y offset was 0.2
 * where the geometry demanded 0.24, which put the crest 8% of its own height
 * too high inside the plate.
 */
export function fitCrestBox(cx: number, cy: number, maxW: number, maxH: number): QrRect {
  const [, , vbW, vbH] = ANVL_CREST_VIEWBOX
  const scale = Math.min(maxW / vbW, maxH / vbH)
  const width = vbW * scale
  const height = vbH * scale
  return { x: cx - width / 2, y: cy - height / 2, width, height }
}

/**
 * Where the crest is drawn inside a finished code — the exact rect the renderer
 * uses. Exported because jsdom has no 2D context: pinning this arithmetically
 * is the only way to prove the mark is centred, and a 10 px offset shipped
 * precisely because nothing pinned it.
 */
export function crestBox(pixelSize: number, moduleCount: number): QrRect {
  const plate = crestPlateRect(pixelSize, moduleCount)
  const max = plate.width * QR_CREST_BOX_RATIO
  return fitCrestBox(plate.x + plate.width / 2, plate.y + plate.height / 2, max, max)
}

/* ------------------------------------------------------------------ draw */

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radii: { tl: number; tr: number; br: number; bl: number },
): void {
  ctx.beginPath()
  ctx.moveTo(x + radii.tl, y)
  ctx.lineTo(x + w - radii.tr, y)
  ctx.arcTo(x + w, y, x + w, y + radii.tr, radii.tr)
  ctx.lineTo(x + w, y + h - radii.br)
  ctx.arcTo(x + w, y + h, x + w - radii.br, y + h, radii.br)
  ctx.lineTo(x + radii.bl, y + h)
  ctx.arcTo(x, y + h, x, y + h - radii.bl, radii.bl)
  ctx.lineTo(x, y + radii.tl)
  ctx.arcTo(x, y, x + radii.tl, y, radii.tl)
  ctx.closePath()
}

/** Same radius on all four corners. */
const corners = (v: number) => ({ tl: v, tr: v, br: v, bl: v })

/**
 * Corner radii for one module, given its neighbours. A corner stays round only
 * where BOTH of its adjacent neighbours are light — so an isolated module is a
 * dot, and a run of modules reads as one continuous curved stroke.
 */
export function moduleRadii(
  matrix: QrMatrix,
  row: number,
  col: number,
  radius: number,
): { tl: number; tr: number; br: number; bl: number } {
  const dark = (r: number, c: number) =>
    r >= 0 && c >= 0 && r < matrix.size && c < matrix.size && matrix.get(r, c)
  const up = dark(row - 1, col)
  const down = dark(row + 1, col)
  const left = dark(row, col - 1)
  const right = dark(row, col + 1)
  return {
    tl: up || left ? 0 : radius,
    tr: up || right ? 0 : radius,
    br: down || right ? 0 : radius,
    bl: down || left ? 0 : radius,
  }
}

/**
 * One finder eye: a rounded outer ring around a rounded core.
 *
 * Drawn in `dark`, NOT in the champagne accent, and this is not a style
 * preference. Decoders binarize before they look for the finder's 1:1:3:1:1
 * run-length signature. Champagne is luminance ~168/255 against bone at ~228
 * and the modules at ~11, which puts any sane threshold near 120 — the accent
 * would binarize as LIGHT and the three locator patterns would disappear.
 * The brand lives in the shape here (rounded rings, rounded modules) and in
 * the crest; the locators stay legible to a camera. This is structural: the
 * function is only ever handed `dark`/`light`, so no palette — screen or print
 * — can make the eyes champagne. Do not add an accent parameter.
 */
function drawFinder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cell: number,
  dark: string,
  light: string,
): void {
  const outer = cell * QR_FINDER_SIZE

  ctx.fillStyle = dark
  roundedRect(ctx, x, y, outer, outer, corners(outer * 0.28))
  ctx.fill()

  ctx.fillStyle = light
  roundedRect(ctx, x + cell, y + cell, outer - cell * 2, outer - cell * 2, corners(outer * 0.2))
  ctx.fill()

  ctx.fillStyle = dark
  roundedRect(ctx, x + cell * 2, y + cell * 2, cell * 3, cell * 3, corners(cell * 1.1))
  ctx.fill()
}

/**
 * The crest, drawn into an already-resolved rect. All positioning maths lives
 * in {@link fitCrestBox}; this step is a pure transform so there is no second
 * place for the two axes to disagree.
 */
function drawCrest(ctx: CanvasRenderingContext2D, box: QrRect, color: string): void {
  const [minX, minY, vbW] = ANVL_CREST_VIEWBOX
  const scale = box.width / vbW
  ctx.save()
  ctx.translate(box.x, box.y)
  ctx.scale(scale, scale)
  ctx.translate(-minX, -minY)
  ctx.fillStyle = color
  for (const d of ANVL_CREST_PATHS) ctx.fill(new Path2D(d))
  ctx.restore()
}

/* ---------------------------------------------------------------- palette */

/**
 * Screen palette: ANVL black on bone with a champagne crest.
 *
 * Literal hex, not CSS tokens, because a canvas cannot resolve `var()` — the
 * same constraint that makes `image/drawKit.ts` resolve tokens to literals.
 */
const SCREEN_QR_COLORS = {
  dark: '#0B0B0C',
  light: '#E7E4DF',
  accent: '#C5A56A',
} as const

/**
 * Paper, not screen — and deliberately NOT derived from theme tokens.
 *
 * `/admin` wears the Studio palette (molten copper `#D96C2C`, ember bronze
 * `#B8814A`), so resolving these from live CSS vars inside the print sheet
 * would silently print BRONZE crests. And the storefront's bone `#E7E4DF`
 * would lay ink across every light module of a white card, where the paper
 * already IS the light field — doubling dot gain at exactly the module
 * boundaries decoders measure run lengths across.
 *
 * `#000000` maps to K-only in most print drivers, avoiding the CMY
 * registration fringing at module edges that kills small codes; `#0B0B0C` is a
 * 4.7% grey a colour-managed driver may composite instead. The champagne crest
 * keeps the printed tag identical to the in-app code; on a MONOCHROME laser it
 * halftones to ~35% grey on black — still legible, but the one-line override
 * there is `accent: '#FFFFFF'` (crest knocked white out of the plate).
 */
export const PRINT_QR_COLORS = {
  dark: '#000000',
  light: '#FFFFFF',
  accent: '#C5A56A',
} as const

/* --------------------------------------------------------------- renderers */

export interface AnvlQrOptions {
  url: string
  /** Output edge in px. */
  size?: number
  dark?: string
  light?: string
  accent?: string
  /** Set false for a plain (still rounded) code with no crest. */
  crest?: boolean
}

export interface AnvlQrResult {
  dataUrl: string
  blob: Blob | null
  size: number
}

/** Paint one code into a context already sized `size`×`size`, opaquely. */
function paintQr(
  ctx: CanvasRenderingContext2D,
  url: string,
  size: number,
  options: Omit<AnvlQrOptions, 'url' | 'size'>,
): void {
  const dark = options.dark ?? SCREEN_QR_COLORS.dark
  const light = options.light ?? SCREEN_QR_COLORS.light
  const accent = options.accent ?? SCREEN_QR_COLORS.accent
  const withCrest = options.crest ?? true

  const code = QRCode.create(url, { errorCorrectionLevel: 'H' })
  const moduleCount = code.modules.size
  const data = code.modules.data
  const matrix: QrMatrix = {
    size: moduleCount,
    get: (row, col) => Boolean(data[row * moduleCount + col]),
  }

  const { cell, origin } = qrGeometry(size, moduleCount)

  /* Opaque full-canvas fill — this is also what makes a scratch canvas safely
     reusable across a batch, including between codes of different versions. */
  ctx.fillStyle = light
  ctx.fillRect(0, 0, size, size)

  /* Data modules — finders and the knockout are handled separately. */
  ctx.fillStyle = dark
  const radius = cell * 0.42
  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount; col += 1) {
      if (!matrix.get(row, col)) continue
      if (isFinderModule(row, col, moduleCount)) continue
      if (withCrest && isKnockoutModule(row, col, moduleCount)) continue
      const x = origin + col * cell
      const y = origin + row * cell
      roundedRect(ctx, x, y, cell, cell, moduleRadii(matrix, row, col, radius))
      ctx.fill()
    }
  }

  /* Finder eyes. */
  const far = origin + (moduleCount - QR_FINDER_SIZE) * cell
  drawFinder(ctx, origin, origin, cell, dark, light)
  drawFinder(ctx, far, origin, cell, dark, light)
  drawFinder(ctx, origin, far, cell, dark, light)

  /* Crest, on a rounded plate with a hairline ring. */
  if (withCrest) {
    const plate = crestPlateRect(size, moduleCount)
    ctx.fillStyle = light
    roundedRect(ctx, plate.x, plate.y, plate.width, plate.height, corners(plate.width * 0.24))
    ctx.fill()

    const inset = cell * 0.5
    const inner = plate.width - inset * 2
    ctx.fillStyle = dark
    roundedRect(ctx, plate.x + inset, plate.y + inset, inner, inner, corners(plate.width * 0.2))
    ctx.fill()
    ctx.strokeStyle = accent
    ctx.lineWidth = Math.max(1, cell * 0.14)
    ctx.stroke()

    drawCrest(ctx, crestBox(size, moduleCount), accent)
  }
}

/**
 * Render the branded code. Returns an empty result rather than throwing when
 * there is no 2D context (SSR, or a browser that refuses the canvas).
 */
export async function renderAnvlQr(options: AnvlQrOptions): Promise<AnvlQrResult> {
  const size = options.size ?? DEFAULT_QR_PX

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return { dataUrl: '', blob: null, size }

  paintQr(ctx, options.url, size, options)

  const dataUrl = canvas.toDataURL('image/png')
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
  return { dataUrl, blob, size }
}

export interface AnvlQrBatchOptions extends Omit<AnvlQrOptions, 'url'> {
  /** Progress counter only — anything heavier here runs once per code. */
  onProgress?: (done: number, total: number) => void
  /** Yield to the event loop every N codes. */
  chunk?: number
}

/**
 * Nested `setTimeout` is clamped to 4 ms, so a yield is never free: at the
 * default chunk a 500-code batch spends ~0.25 s handing the thread back, which
 * is what keeps the tab painting. Yielding per code would cost ~2 s.
 */
const BATCH_YIELD_EVERY = 8

/**
 * Render many codes off ONE scratch canvas — data URLs, index-aligned with
 * `urls`.
 *
 * A batch can be 500 codes. A 1024×1024 canvas each (4 MB of backing store)
 * plus both a PNG data URL and a Blob per code froze the admin tab for tens of
 * seconds; a print sheet renders `<img>` and never shares a file, so the Blob
 * is pure waste here. Rejects rather than returning blanks when there is no 2D
 * context, so the caller can say so instead of showing an eternal skeleton.
 */
export async function renderAnvlQrBatch(
  urls: readonly string[],
  options: AnvlQrBatchOptions = {},
): Promise<string[]> {
  const size = options.size ?? DEFAULT_QR_PX
  const chunk = Math.max(1, options.chunk ?? BATCH_YIELD_EVERY)

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('QR batch: this browser gave no 2D canvas context.')

  const dataUrls: string[] = []
  for (const url of urls) {
    paintQr(ctx, url, size, options)
    dataUrls.push(canvas.toDataURL('image/png'))
    options.onProgress?.(dataUrls.length, urls.length)
    if (dataUrls.length % chunk === 0 && dataUrls.length < urls.length) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0)
      })
    }
  }
  return dataUrls
}
