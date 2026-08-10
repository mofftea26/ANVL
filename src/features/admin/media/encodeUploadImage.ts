/**
 * Browser-side re-encode applied to CMS image uploads before they reach
 * Supabase Storage.
 *
 * WHY: the media library had no encode step, so whatever the editor picked went
 * into the bucket verbatim. That put four 2752x1536 PNGs (6.3-7.7 MB each,
 * ~28.5 MB total) behind the About page and three 1.2-1.9 MB cutouts behind the
 * home hero — measured on mobile, where none of it is needed. Fixing the bytes
 * at upload time is the only fix that stays fixed: the read path
 * (`publicCmsMediaUrl`) stores a path, not a size, so nothing downstream can
 * enforce a budget.
 *
 * Deliberately conservative — this runs on assets an editor cannot re-source:
 *   - never returns a file LARGER than the original (falls back to it),
 *   - never touches vector/animated/already-modern formats,
 *   - never throws: any decode/encode failure returns the original file, so a
 *     browser without `createImageBitmap` or canvas WebP just uploads as before.
 *
 * ALPHA IS LOAD-BEARING. The Oath hero samples real pixels to build its
 * particle silhouette and gates on fully-opaque pixels only (see the alpha gate
 * in `shared/webgl/particleShapes.ts`). WebP carries alpha, which is why it is
 * the target format and why JPEG must never be — a JPEG cutout would flatten to
 * a rectangle and the forge would emit a block of embers instead of a garment.
 * The quality below is set high for the same reason: lossy alpha frays the
 * cutout edge, which shifts which pixels pass that gate.
 */

/** Longest-edge cap. 2048 still exceeds every slot the storefront renders. */
export const MAX_UPLOAD_IMAGE_EDGE = 2048

/** High enough that lossy alpha does not fray cutout edges (see file header). */
export const UPLOAD_IMAGE_WEBP_QUALITY = 0.9

/**
 * Below this, re-encoding costs quality without meaningfully saving bytes —
 * and risks making a well-optimised asset worse.
 */
export const MIN_UPLOAD_IMAGE_BYTES_TO_REENCODE = 150 * 1024

/**
 * Formats that must pass through untouched:
 *   - `svg+xml`   vector; rasterising it would be a downgrade, not an optimisation
 *   - `gif`       may be animated; canvas would keep only the first frame
 *   - `avif`      already smaller than anything we would produce
 */
const PASSTHROUGH_IMAGE_MIMES = new Set([
  'image/svg+xml',
  'image/gif',
  'image/avif',
])

/**
 * Pure decision half of `encodeUploadImage`, split out so the skip rules are
 * unit-testable — jsdom has no canvas, so the encode half cannot be.
 */
export function shouldReencodeUpload(file: File): boolean {
  if (!file.type.startsWith('image/')) return false
  if (PASSTHROUGH_IMAGE_MIMES.has(file.type)) return false
  if (file.size < MIN_UPLOAD_IMAGE_BYTES_TO_REENCODE) return false
  return true
}

/** Swaps the extension so the stored filename matches the stored bytes. */
export function webpFilename(name: string): string {
  const trimmed = name.trim() || 'asset'
  const stem = trimmed.includes('.') ? trimmed.replace(/\.[^.]+$/, '') : trimmed
  return `${stem || 'asset'}.webp`
}

/** Scale factor that fits `w x h` inside `maxEdge`; 1 when it already fits. */
export function fitScale(w: number, h: number, maxEdge: number): number {
  const longest = Math.max(w, h)
  if (longest <= maxEdge) return 1
  return maxEdge / longest
}

function canvasToWebpBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/webp', quality)
  })
}

/**
 * Returns an optimised WebP copy of `file`, or `file` itself when re-encoding
 * is skipped, unsupported, or would not be an improvement.
 */
export async function encodeUploadImage(file: File): Promise<File> {
  if (!shouldReencodeUpload(file)) return file
  if (typeof window === 'undefined') return file
  if (typeof createImageBitmap !== 'function') return file

  let bitmap: ImageBitmap | null = null
  try {
    bitmap = await createImageBitmap(file)
    const scale = fitScale(bitmap.width, bitmap.height, MAX_UPLOAD_IMAGE_EDGE)

    // Already small enough AND already WebP — nothing left to win.
    if (scale === 1 && file.type === 'image/webp') return file

    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))

    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    // Default composite over a transparent canvas preserves the alpha channel.
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    const blob = await canvasToWebpBlob(canvas, UPLOAD_IMAGE_WEBP_QUALITY)
    // `toBlob` yields null when the encoder is unavailable; a larger result
    // means the source was already better optimised than we can manage.
    if (!blob || blob.size >= file.size) return file

    return new File([blob], webpFilename(file.name), {
      type: 'image/webp',
      lastModified: file.lastModified,
    })
  } catch {
    return file
  } finally {
    bitmap?.close()
  }
}
