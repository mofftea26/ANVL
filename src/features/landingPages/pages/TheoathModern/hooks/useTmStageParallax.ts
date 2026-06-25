import { useEffect, type RefObject } from 'react'
import type { TmMotionState } from '../motion/tmMotionState'

/**
 * Pointer-driven 2.5D tilt for the hero product. Reads the shared motion state
 * (pointer position, written by `useTmPointerMotion`) and lerps a clamped
 * perspective transform onto `ref` each frame — so the real garment cutout leans
 * toward the cursor over the procedural WebGL platform. Fine-pointer desktop
 * only; disabled under reduced motion (the element keeps its static transform).
 */
export function useTmStageParallax(
  ref: RefObject<HTMLElement | null>,
  motion: TmMotionState,
): void {
  useEffect(() => {
    const el = ref.current
    if (!el || typeof window === 'undefined') return
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let raf = 0
    let rx = 0
    let ry = 0
    let tx = 0
    let ty = 0
    const tick = () => {
      rx += (-motion.pointerY * 6 - rx) * 0.08
      ry += (motion.pointerX * 9 - ry) * 0.08
      tx += (motion.pointerX * 12 - tx) * 0.08
      ty += (motion.pointerY * 9 - ty) * 0.08
      el.style.transform = `perspective(1200px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [ref, motion])
}
