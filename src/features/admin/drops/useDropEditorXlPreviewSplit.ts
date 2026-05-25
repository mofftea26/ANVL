import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from 'react'

import { ADMIN_STORAGE_KEYS } from '@/features/admin/storageKeys'
import {
  clampDropEditorPreviewWidthPx,
  DROP_EDITOR_PREVIEW_SASH_PX,
} from '@/features/admin/drops/dropEditorPreviewSash'

function readStoredWidth(): number | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(
      ADMIN_STORAGE_KEYS.dropEditorPreviewSplitPx,
    )
    if (raw == null || raw === '') return null
    const n = Number.parseFloat(raw)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

function writeStoredWidth(px: number): void {
  try {
    window.localStorage.setItem(
      ADMIN_STORAGE_KEYS.dropEditorPreviewSplitPx,
      String(Math.round(px)),
    )
  } catch {
    /* quota / private mode */
  }
}

export function useDropEditorXlPreviewSplit(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  const [isXl, setIsXl] = useState(false)
  const [previewPx, setPreviewPx] = useState(720)
  const [isDragging, setIsDragging] = useState(false)

  const previewRef = useRef(previewPx)
  previewRef.current = previewPx

  const draggingRef = useRef(false)
  const dragStartRef = useRef<{ x: number; w: number } | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(min-width: 1024px)')
    const apply = () => setIsXl(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const measureClamp = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const cw = el.clientWidth
    if (cw <= 0) return
    setPreviewPx((p) => clampDropEditorPreviewWidthPx(p, cw))
  }, [containerRef])

  useLayoutEffect(() => {
    if (!enabled) return
    const el = containerRef.current
    if (!el) return
    const cw = el.clientWidth
    if (cw <= 0) return
    const stored = readStoredWidth()
    const seed = stored ?? Math.round(cw * 0.58)
    setPreviewPx(clampDropEditorPreviewWidthPx(seed, cw))
  }, [enabled, containerRef])

  useEffect(() => {
    if (!enabled) return
    const onResize = () => measureClamp()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [enabled, measureClamp])

  useEffect(() => {
    if (!isDragging) return
    const prevSelect = document.body.style.userSelect
    document.body.style.userSelect = 'none'
    return () => {
      document.body.style.userSelect = prevSelect
    }
  }, [isDragging])

  const endDrag = useCallback(
    (target: HTMLElement, pointerId: number) => {
      if (!draggingRef.current) return
      draggingRef.current = false
      dragStartRef.current = null
      setIsDragging(false)
      try {
        target.releasePointerCapture(pointerId)
      } catch {
        /* already released */
      }
      writeStoredWidth(previewRef.current)
    },
    [],
  )

  const onSashPointerDown = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!isXl || e.button !== 0) return
      e.preventDefault()
      draggingRef.current = true
      dragStartRef.current = { x: e.clientX, w: previewRef.current }
      setIsDragging(true)
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [isXl],
  )

  const onSashPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!draggingRef.current || !dragStartRef.current) return
      const el = containerRef.current
      if (!el) return
      const { x, w } = dragStartRef.current
      const dx = e.clientX - x
      const next = clampDropEditorPreviewWidthPx(w + dx, el.clientWidth)
      setPreviewPx(next)
    },
    [containerRef],
  )

  const onSashPointerUp = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      endDrag(e.currentTarget, e.pointerId)
    },
    [endDrag],
  )

  const onSashLostPointerCapture = useCallback(() => {
    if (!draggingRef.current) return
    draggingRef.current = false
    dragStartRef.current = null
    setIsDragging(false)
    writeStoredWidth(previewRef.current)
  }, [])

  const onSashKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (!isXl) return
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      e.preventDefault()
      const el = containerRef.current
      if (!el) return
      const delta = e.key === 'ArrowLeft' ? -24 : 24
      setPreviewPx((p) => {
        const next = clampDropEditorPreviewWidthPx(p + delta, el.clientWidth)
        writeStoredWidth(next)
        return next
      })
    },
    [isXl, containerRef],
  )

  return {
    isXl,
    previewPx,
    sashWidthPx: DROP_EDITOR_PREVIEW_SASH_PX,
    isDragging,
    onSashPointerDown,
    onSashPointerMove,
    onSashPointerUp,
    onSashPointerCancel: onSashPointerUp,
    onSashLostPointerCapture,
    onSashKeyDown,
  }
}
