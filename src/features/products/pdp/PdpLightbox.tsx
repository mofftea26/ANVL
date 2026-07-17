import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from '@/shared/icons'
import { useEffect, useRef, useState } from 'react'
import { IconButton, Modal } from '@/shared/components/ui'
import { ShopSurfaceScope } from '@/shared/components/layout/ShopSurfaceScope'
import { cn } from '@/shared/lib/cn'
import { ICON_SIZE } from '@/shared/lib/iconSize'

const MIN_SCALE = 1
const MAX_SCALE = 4
const STEP = 0.5

/**
 * Full-size image viewer for the PDP gallery — a zoomable carousel. Lazy-loaded
 * and built on the shared `Modal` (focus trap, Escape, focus restore). Prev/next
 * cycle the colorway-aware images; zoom in/out buttons + wheel + double-click
 * scale the image, and dragging pans when zoomed. Zoom resets on image change.
 */
export function PdpLightbox({
  images,
  index,
  productName,
  onIndexChange,
  onClose,
}: {
  images: Array<{ src: string; alt: string }>
  index: number
  productName: string
  onIndexChange: (next: number) => void
  onClose: () => void
}) {
  const active = images[index] ?? images[0]
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null)

  // Reset zoom whenever the image changes.
  useEffect(() => {
    setScale(1)
    setPan({ x: 0, y: 0 })
  }, [index])

  const go = (delta: number) => onIndexChange((index + delta + images.length) % images.length)
  const zoom = (delta: number) =>
    setScale((s) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round((s + delta) * 10) / 10))
      if (next === 1) setPan({ x: 0, y: 0 })
      return next
    })

  const onPointerDown = (e: React.PointerEvent) => {
    if (scale <= 1) return
    dragRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    setPan({ x: d.px + (e.clientX - d.x), y: d.py + (e.clientY - d.y) })
  }
  const onPointerUp = () => {
    dragRef.current = null
  }

  return (
    <Modal open onClose={onClose} aria-label={`${productName} images`} className="max-w-4xl bg-[var(--shop-surface)]">
      <ShopSurfaceScope className="relative">
        <div
          className="relative overflow-hidden rounded-lg border border-[var(--shop-card-border)] bg-[var(--shop-image-bg)]"
          onWheel={(e) => {
            if (!e.ctrlKey && Math.abs(e.deltaY) < 1) return
            zoom(e.deltaY < 0 ? STEP : -STEP)
          }}
        >
          <img
            src={active?.src}
            alt={active?.alt ?? productName}
            onDoubleClick={() => (scale > 1 ? zoom(-MAX_SCALE) : setScale(2))}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            draggable={false}
            className={cn(
              'mx-auto max-h-[76vh] w-auto select-none object-contain transition-transform duration-150',
              scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in',
            )}
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
          />

          {/* Zoom controls. */}
          <div className="absolute right-2 top-2 flex gap-1.5">
            <IconButton
              variant="overlay"
              size="sm"
              onClick={() => zoom(STEP)}
              disabled={scale >= MAX_SCALE}
              aria-label="Zoom in"
            >
              <ZoomIn size={ICON_SIZE.md} aria-hidden="true" />
            </IconButton>
            <IconButton
              variant="overlay"
              size="sm"
              onClick={() => zoom(-STEP)}
              disabled={scale <= MIN_SCALE}
              aria-label="Zoom out"
            >
              <ZoomOut size={ICON_SIZE.md} aria-hidden="true" />
            </IconButton>
          </div>
        </div>

        {images.length > 1 ? (
          <>
            <IconButton
              variant="overlay"
              size="sm"
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2"
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </IconButton>
            <IconButton
              variant="overlay"
              size="sm"
              onClick={() => go(1)}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <ChevronRight size={20} aria-hidden="true" />
            </IconButton>
            <div className="mt-3 flex justify-center gap-2">
              {images.map((img, i) => (
                <button
                  key={`${img.src}-${i}`}
                  type="button"
                  onClick={() => onIndexChange(i)}
                  aria-label={`View image ${i + 1}`}
                  aria-current={i === index}
                  className={cn(
                    'h-1.5 w-6 rounded-full transition-colors',
                    i === index ? 'bg-[var(--shop-accent)]' : 'bg-[var(--shop-card-border)]',
                  )}
                />
              ))}
            </div>
          </>
        ) : null}
      </ShopSurfaceScope>
    </Modal>
  )
}
