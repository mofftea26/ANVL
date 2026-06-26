import { gsap, ScrollTrigger } from '@/shared/lib/gsap'
import { prefersReducedMotion } from '@/features/landingPages/motion/landingMotion'

/**
 * Mobile, tablet, and reduced-motion path: no pins, no WebGL, no pointer motion,
 * no scroll-driven camera. `[data-om-reveal]` items rise once in batches.
 * Reduced motion snaps everything visible immediately — content and the purchase
 * path are never gated behind motion. Returns a disposer.
 */
export function buildOathModernStatic(host: HTMLElement): () => void {
  const items = gsap.utils.toArray<HTMLElement>('[data-om-reveal]', host)
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
