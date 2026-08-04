import type { ContainedMediaRect } from '@/shared/hooks/useContainedMediaRect'

/**
 * Where an AUTHORED marker lands on the displayed piece.
 *
 * The passport's Blueprint / Specifications / Fit sections carry markers an
 * editor clicked onto the product render (`passportMarkerSchema` → `points`).
 * Their `x`/`y` are a percent of the IMAGE, exactly the convention
 * `PassportHotspots` uses — and for the same reason: the render is
 * `object-contain`, so it occupies a letterboxed sub-rect of its box and a
 * naive percent-of-the-BOX drifts on every product whose aspect differs from
 * the stage's. A readout that sits confidently on the wrong seam is worse
 * than one that was never placed.
 *
 * So this module owns the one conversion all three effects share: measured
 * contain-rect → the effect's viewBox units → an authored percent resolved
 * onto it. It was three near-identical private copies before; one copy means
 * a marker cannot land in a different place per section.
 *
 * Pure (no React, no DOM) apart from the clearly marked `decodeImageAspect`,
 * so every effect's geometry stays unit-testable from plain numbers.
 */

/** Where the displayed image sits, in an effect's own viewBox units. */
export interface StageRegion {
  x: number
  y: number
  w: number
  h: number
}

/** An authored placement, percent of the image box — the CMS's own units. */
export interface MarkerPlacement {
  x: number
  y: number
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * The classic garment inset — a 13% margin all round. Used when the effect
 * knows nothing about the image at all (no measured rect, no sampled aspect):
 * a plausible box for a product render on a portrait stage.
 */
const FALLBACK_INSET = 0.13

/**
 * Read a marker's authored placement, or null when it carries none.
 *
 * The parameter is structural rather than `PassportEffectMarker` so this
 * survives the coordinate becoming nullable in the CMS schema (the sanctioned
 * "unplaced" discriminator): an absent, null or non-finite coordinate is not
 * a placement, and the caller falls back to its own designed geometry instead
 * of parking the readout at a coordinate nobody chose.
 */
export function markerPlacement(marker: {
  x?: number | null
  y?: number | null
}): MarkerPlacement | null {
  const { x, y } = marker
  if (typeof x !== 'number' || typeof y !== 'number') return null
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return { x: clamp(x, 0, 100), y: clamp(y, 0, 100) }
}

/** An authored percent resolved onto the displayed image, in viewBox units. */
export function placeOnRegion(
  place: MarkerPlacement,
  region: StageRegion,
): { x: number; y: number } {
  return { x: region.x + (place.x / 100) * region.w, y: region.y + (place.y / 100) * region.h }
}

/**
 * Which stage edge a placed readout runs to: the nearer one, so the leader
 * stays short and the text never crosses the piece to reach its rail.
 */
export function placementSide(place: MarkerPlacement): 1 | -1 {
  return place.x < 50 ? -1 : 1
}

/**
 * The displayed image's rect in viewBox units: the MEASURED contain-rect
 * first (box size recovered from the centering), else contain math from the
 * sampled image's aspect, else the fallback inset.
 *
 * The measured rect is rejected when the media is flush with its box, because
 * `useContainedMediaRect`'s "no media found / not decoded yet" answer IS the
 * full box — indistinguishable from a genuine aspect match, and guessing
 * wrong there would pin every marker against an un-letterboxed box.
 */
export function resolveStageRegion(
  rect: ContainedMediaRect | null,
  aspect: number | undefined,
  viewW: number,
  viewH: number,
): StageRegion {
  if (rect) {
    const boxW = rect.width + rect.left * 2
    const boxH = rect.height + rect.top * 2
    if (boxW >= 2 && boxH >= 2 && (rect.left >= 1 || rect.top >= 1)) {
      const [sx, sy] = [viewW / boxW, viewH / boxH]
      return { x: rect.left * sx, y: rect.top * sy, w: rect.width * sx, h: rect.height * sy }
    }
  }
  if (aspect && Number.isFinite(aspect) && aspect > 0) {
    const s = Math.min(viewW / aspect, viewH)
    return { x: (viewW - aspect * s) / 2, y: (viewH - s) / 2, w: aspect * s, h: s }
  }
  return {
    x: FALLBACK_INSET * viewW,
    y: FALLBACK_INSET * viewH,
    w: (1 - FALLBACK_INSET * 2) * viewW,
    h: (1 - FALLBACK_INSET * 2) * viewH,
  }
}

/**
 * The image's natural aspect (w/h), or null when it cannot be read.
 *
 * Browser-only, and the ONE impure export here. The WebGL blueprint has no
 * `<img>` on stage to measure — its projection replaces the photograph — so
 * it recovers the image box this way instead. The decode is a cache hit
 * behind the silhouette sampler that already loaded the same URL; never
 * rejects, so a CORS-blocked or broken render simply reverts the plates to
 * their frozen composition.
 */
export function decodeImageAspect(url: string): Promise<number | null> {
  if (!url) return Promise.resolve(null)
  return new Promise<number | null>((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () =>
      resolve(image.naturalWidth > 0 && image.naturalHeight > 0
        ? image.naturalWidth / image.naturalHeight
        : null)
    image.onerror = () => resolve(null)
    image.src = url
  })
}
