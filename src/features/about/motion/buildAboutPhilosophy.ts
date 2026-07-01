import { gsap } from '@/shared/lib/gsap'
import type { AboutMotionState } from './aboutMotionState'
import { pinTrigger, type Selector } from './aboutMotionHelpers'
import { splitUnits } from './splitTextReveal'

/**
 * Scene 02 — The Philosophy (desktop). Pinned: each line reveals word-by-word
 * through masks as scroll scrubs, the backdrop pushes in, and the monolith
 * recedes/darkens behind it (`philosophyProgress` → WebGL `useFrame`).
 */
export function buildAboutPhilosophy(
  host: HTMLElement,
  q: Selector,
  motion: AboutMotionState,
): () => void {
  const scene = host.querySelector('[data-scene="philosophy"]')
  if (!scene) return () => {}

  const lines = q('[data-philosophy-line]')
  const disposers: Array<() => void> = []

  const trigger = pinTrigger(scene, 120)
  trigger.onUpdate = (self) => {
    motion.philosophyProgress = self.progress
  }
  const tl = gsap.timeline({ scrollTrigger: trigger })

  tl.from(q('[data-philosophy-media]'), { scale: 1.16, ease: 'none', duration: 1 }, 0)
  tl.fromTo(
    q('[data-philosophy-eyebrow]'),
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
      { yPercent: 0, duration: 0.3, ease: 'power3.out', stagger: { each: 0.035 } },
      0.12 + i * 0.24,
    )
  })

  return () => {
    for (const dispose of disposers) dispose()
  }
}
