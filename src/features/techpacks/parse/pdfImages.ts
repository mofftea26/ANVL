/**
 * Image-XObject decoding — the single most fragile thing in this feature.
 *
 * `page.objs`, `ImageKind` and the shape of a decoded image object are, in
 * practice, pdf.js internals: they sit outside its semver promises and have
 * changed shape between majors. Everything that touches them is confined to
 * this one file so a pdf.js upgrade has exactly one place to break, and image
 * extraction is optional by design — a pack still yields sizing, colorways,
 * construction and care with `images: []`.
 *
 * Two shapes are handled because 6.x emits both depending on the decode path:
 * a raw `{ data, kind }` buffer, and an already-decoded `ImageBitmap`.
 * Unknown shapes raise rather than silently producing a black rectangle.
 */

import { boxArea, imagePlacementBox, type Box } from './geometry'
import type { ImagePlacement } from './pdfTypes'

/** Minimal surface we need off a pdf.js page — deliberately not their type. */
export interface PdfPageLike {
  objs: {
    get(objId: string, callback: (value: unknown) => void): void
    has?(objId: string): boolean
  }
}

/** pdf.js `ImageKind` values. Restated so a rename upstream is a visible break. */
const IMAGE_KIND_GRAYSCALE_1BPP = 1
const IMAGE_KIND_RGB_24BPP = 2
const IMAGE_KIND_RGBA_32BPP = 3

/** `page.objs.get` never settles if the operator list was not built first. */
const OBJECT_TIMEOUT_MS = 15_000

export interface ExtractedImage {
  blob: Blob
  width: number
  height: number
  mime: string
}

interface RawImageObject {
  data?: Uint8Array | Uint8ClampedArray
  bitmap?: ImageBitmap
  width?: number
  height?: number
  kind?: number
}

/**
 * Await a pdf.js object by key.
 *
 * The callback API never fires when the object was never registered — which is
 * exactly what happens if `getOperatorList()` has not run for the page — so
 * this races a timeout instead of hanging the whole ingest.
 */
function getPageObject(page: PdfPageLike, objectKey: string): Promise<RawImageObject> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`image_extract_timeout:${objectKey}`))
    }, OBJECT_TIMEOUT_MS)

    try {
      page.objs.get(objectKey, (value) => {
        clearTimeout(timer)
        resolve((value ?? {}) as RawImageObject)
      })
    } catch (error) {
      clearTimeout(timer)
      reject(error instanceof Error ? error : new Error(String(error)))
    }
  })
}

/**
 * Expand a pdf.js pixel buffer to RGBA.
 *
 * Each branch is written out rather than inferred: a missing case would not
 * throw, it would render a plausible-looking black image, and nobody reviewing
 * a techpack would question a black technical flat until much later.
 */
function toRgba(
  raw: RawImageObject,
  width: number,
  height: number,
): Uint8ClampedArray<ArrayBuffer> {
  const src = raw.data
  if (!src) throw new Error('image_no_pixel_data')

  // Backed by a plain ArrayBuffer rather than the default ArrayBufferLike:
  // `ImageData` will not accept a possibly-shared buffer.
  const out = new Uint8ClampedArray(new ArrayBuffer(width * height * 4))

  if (raw.kind === IMAGE_KIND_RGBA_32BPP) {
    out.set(src.subarray(0, out.length))
    return out
  }

  if (raw.kind === IMAGE_KIND_RGB_24BPP) {
    for (let i = 0, o = 0; o < out.length; i += 3, o += 4) {
      out[o] = src[i] ?? 0
      out[o + 1] = src[i + 1] ?? 0
      out[o + 2] = src[i + 2] ?? 0
      out[o + 3] = 255
    }
    return out
  }

  if (raw.kind === IMAGE_KIND_GRAYSCALE_1BPP) {
    // Packed 1-bit rows, each row padded to a byte boundary. A set bit is
    // white, matching pdf.js's own canvas path.
    const bytesPerRow = (width + 7) >> 3
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const byte = src[y * bytesPerRow + (x >> 3)] ?? 0
        const value = (byte >> (7 - (x & 7))) & 1 ? 255 : 0
        const o = (y * width + x) * 4
        out[o] = value
        out[o + 1] = value
        out[o + 2] = value
        out[o + 3] = 255
      }
    }
    return out
  }

  throw new Error(`image_unsupported_kind:${String(raw.kind)}`)
}

function createCanvas(width: number, height: number): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

async function canvasToBlob(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  mime: string,
  quality: number,
): Promise<Blob> {
  if ('convertToBlob' in canvas) {
    return canvas.convertToBlob({ type: mime, quality })
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('image_encode_failed'))),
      mime,
      quality,
    )
  })
}

/**
 * Pull one image out of a page and re-encode it.
 *
 * Re-encoding is not optional: these PDFs store flats as Flate-compressed raw
 * pixels, so the decoded buffer is many megabytes of RGBA. WebP takes a line-art
 * flat down by an order of magnitude, which is the difference between an upload
 * that works and a tab that runs out of memory.
 */
export async function extractImage(
  page: PdfPageLike,
  objectKey: string,
  mime = 'image/webp',
  quality = 0.92,
): Promise<ExtractedImage> {
  const raw = await getPageObject(page, objectKey)

  const width = raw.width ?? raw.bitmap?.width ?? 0
  const height = raw.height ?? raw.bitmap?.height ?? 0
  if (width <= 0 || height <= 0) throw new Error('image_zero_size')

  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d') as
    | OffscreenCanvasRenderingContext2D
    | CanvasRenderingContext2D
    | null
  if (!ctx) throw new Error('image_no_2d_context')

  try {
    if (raw.bitmap) {
      ctx.drawImage(raw.bitmap, 0, 0)
    } else {
      ctx.putImageData(new ImageData(toRgba(raw, width, height), width, height), 0, 0)
    }
    const blob = await canvasToBlob(canvas, mime, quality)
    return { blob, width, height, mime }
  } finally {
    // Release the backing store immediately; a 13-page pack decodes a lot of
    // pixels and the tab holds every canvas until GC otherwise.
    canvas.width = 0
    canvas.height = 0
  }
}

/* --------------------------------------------------------------------------- *
 * Picking the technical flat
 * --------------------------------------------------------------------------- */

const MIN_FLAT_WIDTH_FRACTION = 0.25
const MIN_FLAT_HEIGHT_FRACTION = 0.25
const MIN_FLAT_PIXELS = 40_000

/**
 * Score the image most likely to be the garment flat on a BASIC SPECS page.
 *
 * The flat is the large, roughly-portrait drawing in the middle of the page;
 * the competition is logos, swatch chips and banner strips. Scoring beats a
 * "largest wins" rule because a full-bleed background would otherwise take it.
 *
 * This is a heuristic and it WILL be wrong on some pack eventually, so the
 * admin always offers a manual override — returning null here is a normal
 * outcome, not a failure.
 */
export function rankGarmentFlat(
  placements: readonly ImagePlacement[],
  viewport: { width: number; height: number },
): string | null {
  let bestKey: string | null = null
  let bestScore = 0

  for (const placement of placements) {
    const box: Box = imagePlacementBox(placement, viewport.height)
    if (box.w < viewport.width * MIN_FLAT_WIDTH_FRACTION) continue
    if (box.h < viewport.height * MIN_FLAT_HEIGHT_FRACTION) continue
    // Intrinsic size is only known for the plain paint operator; the tiling
    // form reports scale factors instead. Apply the pixel floor only when the
    // number means what we think it means — the placement-size gates above
    // already exclude tiles.
    const knownPixels = placement.width > 0 && placement.height > 0
    if (knownPixels && placement.width * placement.height < MIN_FLAT_PIXELS) continue

    const aspect = box.h > 0 ? box.w / box.h : 0
    // A garment flat is roughly square to portrait; anything wildly wide is a
    // banner or a rule, not the drawing.
    const aspectPenalty = aspect >= 0.5 && aspect <= 2 ? 1 : 0.4

    const cx = box.x + box.w / 2
    const cy = box.y + box.h / 2
    const centred =
      cx > viewport.width * 0.2 &&
      cx < viewport.width * 0.8 &&
      cy > viewport.height * 0.2 &&
      cy < viewport.height * 0.8
    const positionBonus = centred ? 1.25 : 1

    const score = boxArea(box) * aspectPenalty * positionBonus
    if (score > bestScore) {
      bestScore = score
      bestKey = placement.objectKey
    }
  }

  return bestKey
}
