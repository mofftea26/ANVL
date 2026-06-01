import { gsap } from '@/shared/lib/gsap'

const REDUCED = '(prefers-reduced-motion: reduce)'

/**
 * Soft handoff when an act enters the viewport — vignette fade on section edge.
 */
export function bindActEnterTransition(
  host: HTMLElement,
  intensity: 'subtle' | 'standard' | 'bold' = 'standard',
): (() => void) | void {
  const overlay = host.querySelector('[data-act-transition]')
  if (!overlay) return

  const mm = gsap.matchMedia()
  mm.add(REDUCED, () => {
    gsap.set(overlay, { opacity: 0 })
  })

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const opacity = intensity === 'bold' ? 0.35 : intensity === 'subtle' ? 0.12 : 0.22
    gsap.set(overlay, { opacity: 0 })
    const tween = gsap.to(overlay, {
      opacity,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: host,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
    })
    return () => {
      tween.kill()
    }
  })

  return () => mm.revert()
}
