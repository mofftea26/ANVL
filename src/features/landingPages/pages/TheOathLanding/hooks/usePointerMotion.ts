import { useEffect, type RefObject } from 'react'
import type { OathMotionState } from '../motion/oathMotionState'

/**
 * One passive `pointermove` listener on the page root feeding the shared motion
 * state: position normalized to the viewport center (-1..1) plus a rough
 * velocity. The WebGL scene lerps toward these targets in `useFrame`; no React
 * state, no re-renders.
 */
export function usePointerMotion(
  root: RefObject<HTMLElement | null>,
  motion: OathMotionState,
): void {
  useEffect(() => {
    const host = root.current
    if (!host) return
    if (window.matchMedia('(pointer: coarse)').matches) return

    let lastX = 0
    let lastY = 0
    let lastT = 0

    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1
      const ny = (e.clientY / window.innerHeight) * 2 - 1
      const now = e.timeStamp
      if (lastT > 0) {
        const dt = Math.max(8, now - lastT) / 1000
        motion.pointerVX = (nx - lastX) / dt
        motion.pointerVY = (ny - lastY) / dt
      }
      motion.pointerX = nx
      motion.pointerY = ny
      lastX = nx
      lastY = ny
      lastT = now
    }

    host.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      host.removeEventListener('pointermove', onMove)
      motion.pointerVX = 0
      motion.pointerVY = 0
    }
  }, [root, motion])
}
