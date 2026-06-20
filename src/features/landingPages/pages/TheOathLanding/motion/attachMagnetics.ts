import { gsap } from '@/shared/lib/gsap'

const MAGNET_STRENGTH = 0.32
const MAGNET_RADIUS_PX = 8

/**
 * Magnetic hover for every `[data-magnetic]` element under `host` — the element
 * leans toward the pointer inside its bounds and springs back on leave. Desktop
 * motion branch only (the caller gates on fine pointer + no reduced motion);
 * returns a disposer for `mm.revert()` cleanup.
 */
export function attachMagnetics(host: HTMLElement): () => void {
  const disposers: Array<() => void> = []

  for (const el of gsap.utils.toArray<HTMLElement>('[data-magnetic]', host)) {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' })

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const relX = e.clientX - (rect.left + rect.width / 2)
      const relY = e.clientY - (rect.top + rect.height / 2)
      xTo(gsap.utils.clamp(-MAGNET_RADIUS_PX, MAGNET_RADIUS_PX, relX * MAGNET_STRENGTH))
      yTo(gsap.utils.clamp(-MAGNET_RADIUS_PX, MAGNET_RADIUS_PX, relY * MAGNET_STRENGTH))
    }
    const onLeave = () => {
      xTo(0)
      yTo(0)
    }

    el.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerleave', onLeave, { passive: true })
    disposers.push(() => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      gsap.set(el, { clearProps: 'x,y' })
    })
  }

  return () => {
    for (const dispose of disposers) dispose()
  }
}
