import { gsap } from '@/shared/lib/gsap'
import type { OathMotionState } from './oathMotionState'
import { pinTrigger, type Selector } from './oathMotionHelpers'
import { splitUnits } from './splitTextReveal'

/**
 * Scene 02 — The Creed (desktop/tablet). Pinned: each manifesto line reveals
 * word-by-word through masks as scroll scrubs, the backdrop pushes in, and the
 * monolith recedes/darkens behind it (`manifestoProgress` → WebGL `useFrame`).
 */
export function buildOathManifesto(
  host: HTMLElement,
  q: Selector,
  intensity: number,
  motion: OathMotionState,
): () => void {
  const scene = host.querySelector('[data-scene="manifesto"]')
  if (!scene) return () => {}

  const lines = q('[data-manifesto-line]')
  const disposers: Array<() => void> = []

  const trigger = pinTrigger(scene, 130 * intensity)
  trigger.onUpdate = (self) => {
    motion.manifestoProgress = self.progress
  }
  const tl = gsap.timeline({ scrollTrigger: trigger })

  tl.from(q('[data-manifesto-media]'), { scale: 1.16, ease: 'none', duration: 1 }, 0)
  tl.fromTo(
    q('[data-manifesto-eyebrow]'),
    { opacity: 0, y: 18 },
    { opacity: 1, y: 0, duration: 0.18, ease: 'power2.out' },
    0.02,
  )

  lines.forEach((line, i) => {
    const { units, revert } = splitUnits(line, 'words')
    disposers.push(revert)
    gsap.set(units, { yPercent: 115 })
    tl.to(
      units,
      {
        yPercent: 0,
        duration: 0.3,
        ease: 'power3.out',
        stagger: { each: 0.035 },
      },
      0.12 + i * 0.26,
    )
  })

  return () => {
    for (const dispose of disposers) dispose()
  }
}
