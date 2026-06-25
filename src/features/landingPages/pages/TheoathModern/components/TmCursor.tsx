import { useEffect } from 'react'

/**
 * Theoath Modern custom cursor — a champagne ring (lagged follow) + a tight dot.
 * The ring grows and fills over interactive targets. Fine-pointer desktop only;
 * never mounts (so never hides the native cursor) under reduced motion or coarse
 * pointers. Page-scoped: it cleans up + restores the native cursor on unmount /
 * route change. Form fields keep the native cursor. Transform-only, rAF-lerped.
 */
export function TmCursor() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ring = document.createElement('div')
    ring.className = 'tm-cursor-ring'
    const dot = document.createElement('div')
    dot.className = 'tm-cursor-dot'
    document.body.append(ring, dot)
    document.body.classList.add('tm-cursor-active')

    let mx = window.innerWidth / 2
    let my = window.innerHeight / 2
    let rx = mx
    let ry = my
    let scale = 1
    let targetScale = 1
    let raf = 0

    const onMove = (e: PointerEvent) => {
      mx = e.clientX
      my = e.clientY
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`
    }
    const onOver = (e: PointerEvent) => {
      const target = (e.target as Element | null)?.closest(
        'a, button, [role="button"], [data-cursor-hover]',
      )
      targetScale = target ? 1.7 : 1
      ring.classList.toggle('is-hover', Boolean(target))
    }
    const onDown = () => {
      ring.classList.add('is-down')
    }
    const onUp = () => {
      ring.classList.remove('is-down')
    }

    const tick = () => {
      rx += (mx - rx) * 0.18
      ry += (my - ry) * 0.18
      scale += (targetScale - scale) * 0.2
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerover', onOver, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerover', onOver)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      ring.remove()
      dot.remove()
      document.body.classList.remove('tm-cursor-active')
    }
  }, [])

  return null
}
