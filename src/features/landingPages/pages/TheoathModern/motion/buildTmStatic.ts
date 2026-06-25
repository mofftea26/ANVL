import { gsap, ScrollTrigger } from '@/shared/lib/gsap'
import { prefersReducedMotion } from '@/features/landingPages/motion/landingMotion'

/**
 * Mobile, tablet, and reduced-motion path: no pins, no WebGL, no pointer motion.
 * `[data-tm-reveal]` / `[data-tm-reveal-m]` rise once in batches. Reduced motion
 * snaps everything visible immediately (content is never gated behind motion).
 */
export function buildTmStatic(host: HTMLElement): () => void {
  const items = gsap.utils.toArray<HTMLElement>(
    '[data-tm-reveal], [data-tm-reveal-m]',
    host,
  )
  if (items.length === 0) return () => {}

  if (prefersReducedMotion()) {
    gsap.set(items, { opacity: 1, y: 0, clearProps: 'all' })
    return () => {}
  }

  gsap.set(items, { opacity: 0, y: 24 })
  const batch = ScrollTrigger.batch(items, {
    start: 'top 90%',
    once: true,
    onEnter: (group) =>
      gsap.to(group, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.08,
        overwrite: true,
      }),
  })

  return () => {
    batch.forEach((t) => t.kill())
    gsap.set(items, { clearProps: 'all' })
  }
}
