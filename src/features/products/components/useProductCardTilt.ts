import { useEffect, type RefObject } from 'react'

/**
 * Restrained pointer tilt for a product card (≤~2.5° each axis). Fine-pointer
 * desktop only, disabled under reduced motion. Writes the transform directly on
 * the element (no React state, no re-render); the element keeps a CSS
 * `transition-transform` for an eased follow + reset. Clears on unmount.
 */
export function useProductCardTilt(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
): void {
  useEffect(() => {
    const el = ref.current
    if (!el || !enabled || typeof window === 'undefined') return
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width - 0.5
      const py = (e.clientY - rect.top) / rect.height - 0.5
      el.style.transform = `perspective(1000px) rotateY(${(px * 5).toFixed(2)}deg) rotateX(${(-py * 4).toFixed(2)}deg)`
    }
    const onLeave = () => {
      el.style.transform = ''
    }
    el.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerleave', onLeave, { passive: true })
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      el.style.transform = ''
    }
  }, [ref, enabled])
}
