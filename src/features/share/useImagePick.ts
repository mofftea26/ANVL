import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * The gallery / camera photo seam.
 *
 * The previous implementation read the file with `FileReader` into a data URL,
 * put that multi-megabyte string into React state, and then listed it as an
 * effect dependency. This one decodes once into an offscreen canvas and keeps
 * the pixels in a ref, so only a small version counter ever moves through
 * React. Two consequences that matter:
 *
 * - No `data:` URL is ever handed to `<img crossOrigin>`, which is what
 *   silently dropped the user's photo before (a CORS-mode fetch of a `data:`
 *   URL fails in several engines).
 * - A photo that cannot be decoded — HEIC on a desktop browser is the usual
 *   case — reports an error instead of quietly leaving the preview unchanged.
 */

/** Long-edge cap. Above this we are burning memory to draw a 1080px canvas. */
export const MAX_PHOTO_EDGE = 2160

/**
 * Long edge of the thumbnail the photo card shows.
 *
 * This is the one string allowed back into React state, and it is kept tiny on
 * purpose: 160px at JPEG 0.7 is single-digit KB, where the original file this
 * hook was written to keep OUT of state is measured in megabytes.
 */
const PREVIEW_EDGE = 160

export interface ImagePickState {
  /** Decoded, downscaled pixels ready for `drawImage`, or null. */
  photo: CanvasImageSource | null
  /** A few-KB thumbnail for the photo card. Never the original file. */
  previewUrl: string | null
  /** Bumps on every successful pick — the effect dependency to watch. */
  version: number
  pending: boolean
  error: string | null
  pick: (file: File | null | undefined) => void
  clear: () => void
}

/** Target size for a source image, capped on its long edge. */
export function scaleToFit(
  width: number,
  height: number,
  maxEdge: number = MAX_PHOTO_EDGE,
): { width: number; height: number } {
  const longest = Math.max(width, height)
  if (longest <= maxEdge || longest === 0) return { width, height }
  const scale = maxEdge / longest
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

/**
 * A card-sized thumbnail of an already-decoded canvas. Returns null rather than
 * throwing: a missing thumbnail costs the card a glyph, while a throw here
 * would lose the photo the user just picked.
 */
function buildPreviewUrl(source: HTMLCanvasElement): string | null {
  try {
    const { width, height } = scaleToFit(source.width, source.height, PREVIEW_EDGE)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(source, 0, 0, width, height)
    return canvas.toDataURL('image/jpeg', 0.7)
  } catch {
    return null
  }
}

interface DecodedPick {
  canvas: HTMLCanvasElement
  previewUrl: string | null
}

async function decodeAndDownscale(file: File): Promise<DecodedPick> {
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = objectUrl
    if (typeof image.decode === 'function') {
      await image.decode()
    } else {
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve()
        image.onerror = () => reject(new Error('decode failed'))
      })
    }

    const sourceW = image.naturalWidth || image.width
    const sourceH = image.naturalHeight || image.height
    if (!sourceW || !sourceH) throw new Error('empty image')

    const { width, height } = scaleToFit(sourceW, sourceH)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no 2d context')
    ctx.drawImage(image, 0, 0, width, height)
    return { canvas, previewUrl: buildPreviewUrl(canvas) }
  } finally {
    // Safe here: the pixels have already been copied into the canvas.
    URL.revokeObjectURL(objectUrl)
  }
}

export function useImagePick(): ImagePickState {
  const photoRef = useRef<CanvasImageSource | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Guards against an earlier, slower pick landing after a later one.
  const pickIdRef = useRef(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      photoRef.current = null
    }
  }, [])

  const pick = useCallback((file: File | null | undefined) => {
    if (!file) return
    const pickId = pickIdRef.current + 1
    pickIdRef.current = pickId
    setPending(true)
    setError(null)

    void decodeAndDownscale(file)
      .then((decoded) => {
        if (!mountedRef.current || pickIdRef.current !== pickId) return
        photoRef.current = decoded.canvas
        setPreviewUrl(decoded.previewUrl)
        setVersion((v) => v + 1)
      })
      .catch(() => {
        if (!mountedRef.current || pickIdRef.current !== pickId) return
        setError("That photo couldn't be read — try another one.")
      })
      .finally(() => {
        if (!mountedRef.current || pickIdRef.current !== pickId) return
        setPending(false)
      })
  }, [])

  const clear = useCallback(() => {
    pickIdRef.current += 1
    photoRef.current = null
    setPreviewUrl(null)
    setError(null)
    setPending(false)
    setVersion((v) => v + 1)
  }, [])

  return { photo: photoRef.current, previewUrl, version, pending, error, pick, clear }
}
