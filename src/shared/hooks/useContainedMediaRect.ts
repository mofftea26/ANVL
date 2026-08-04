import { useEffect, useState, type RefObject } from 'react'

/** Where the drawn media actually sits inside its box (px, box-relative). */
export interface ContainedMediaRect {
  left: number
  top: number
  width: number
  height: number
}

/**
 * ACCURACY CORE for percent-positioned markers. Marker x/y are authored as a
 * percent of the IMAGE itself, but an `object-contain` image occupies only a
 * letterboxed sub-rect of its box — so a naive `left: x%` of the box drifts
 * whenever the two aspect ratios differ. This measures the contained rect
 * (natural aspect vs. box) and re-measures on resize and on a late decode.
 *
 * When nothing matches `mediaSelector` (a 3D viewer, a fallback plate) the
 * drawn media IS the box, so the full box is returned.
 */
export function useContainedMediaRect(
  boxRef: RefObject<HTMLElement | null>,
  mediaSelector: string,
): ContainedMediaRect | null {
  const [rect, setRect] = useState<ContainedMediaRect | null>(null)

  useEffect(() => {
    const box = boxRef.current
    if (!box) return

    const measure = () => {
      const outer = box.getBoundingClientRect()
      if (outer.width < 2 || outer.height < 2) return
      const img = box.querySelector<HTMLImageElement>(mediaSelector)
      if (!img || !img.naturalWidth || !img.naturalHeight) {
        setRect({ left: 0, top: 0, width: outer.width, height: outer.height })
        return
      }
      const scale = Math.min(
        outer.width / img.naturalWidth,
        outer.height / img.naturalHeight,
      )
      const width = img.naturalWidth * scale
      const height = img.naturalHeight * scale
      setRect({
        left: (outer.width - width) / 2,
        top: (outer.height - height) / 2,
        width,
        height,
      })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(box)
    // Images can finish decoding after mount — re-measure once natural size lands.
    const img = box.querySelector<HTMLImageElement>(mediaSelector)
    img?.addEventListener('load', measure)
    return () => {
      observer.disconnect()
      img?.removeEventListener('load', measure)
    }
  }, [boxRef, mediaSelector])

  return rect
}
