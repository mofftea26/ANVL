import { gsap } from '@/shared/lib/gsap'

/**
 * Hero cursor spotlight reveal (DOM path, adapted from the Lithos reference).
 *
 * A soft circular spotlight follows the cursor and reveals the `heroRevealMedia`
 * layer (or a themed ember gradient) over the base film through a CSS
 * `radial-gradient` mask. The mask centre is held in `--spotlight-x/y` (px),
 * eased toward the pointer by a single `gsap.ticker` lerp off one passive
 * `pointermove` listener — no per-frame data URLs, transform-free, one element.
 * Gated to fine-pointer desktop by the caller (motion branch); disposes fully.
 */
export function buildOathSpotlight(host: HTMLElement): () => void {
  const reveal = host.querySelector('[data-hero-spotlight]') as HTMLElement | null
  const hero = host.querySelector('[data-scene="hero"]') as HTMLElement | null
  if (!reveal || !hero) return () => {}

  const setX = gsap.quickSetter(reveal, '--spotlight-x', 'px') as (v: number) => void
  const setY = gsap.quickSetter(reveal, '--spotlight-y', 'px') as (v: number) => void

  const target = { x: 0, y: 0 }
  const current = { x: 0, y: 0 }
  let primed = false

  const onMove = (e: PointerEvent) => {
    const rect = hero.getBoundingClientRect()
    target.x = e.clientX - rect.left
    target.y = e.clientY - rect.top
    if (!primed) {
      primed = true
      current.x = target.x
      current.y = target.y
      gsap.to(reveal, { autoAlpha: 1, duration: 0.4, overwrite: 'auto' })
    }
  }
  const onLeave = () =>
    gsap.to(reveal, { autoAlpha: 0, duration: 0.4, overwrite: 'auto' })

  const tick = () => {
    current.x += (target.x - current.x) * 0.18
    current.y += (target.y - current.y) * 0.18
    setX(current.x)
    setY(current.y)
  }

  gsap.set(reveal, { autoAlpha: 0 })
  hero.addEventListener('pointermove', onMove, { passive: true })
  hero.addEventListener('pointerleave', onLeave, { passive: true })
  gsap.ticker.add(tick)

  return () => {
    gsap.ticker.remove(tick)
    hero.removeEventListener('pointermove', onMove)
    hero.removeEventListener('pointerleave', onLeave)
    gsap.set(reveal, { clearProps: 'opacity,visibility' })
  }
}
