import { gsap, ScrollTrigger } from '@/shared/lib/gsap'

/**
 * Mobile, tablet, and reduced motion: no pinning, no WebGL. Content is
 * CSS-visible; `[data-reveal-m]` elements rise in batches as they enter view.
 */
export function buildAboutStatic(host: HTMLElement): () => void {
  const items = gsap.utils.toArray<HTMLElement>('[data-reveal-m]', host)
  if (items.length === 0) return () => {}

  gsap.set(items, { opacity: 0, y: 24 })
  const batchTriggers = ScrollTrigger.batch(items, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.09,
        overwrite: true,
      }),
  })

  return () => {
    for (const trigger of batchTriggers) trigger.kill()
  }
}
