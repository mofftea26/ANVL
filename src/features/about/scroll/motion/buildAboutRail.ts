import { gsap, ScrollTrigger } from '@/shared/lib/gsap'

/**
 * The minimap's motion: one film-wide scrub drives the track fill
 * (`[data-rail-fill]` scaleY = overall progress — the "where am I" needle)
 * and resolves the ACTIVE chapter by comparing the scroll position against
 * each dot's named pin start (`data-rail-target` → `ScrollTrigger.getById`)
 * — pin starts, never element rects, because pinned sections' DOM positions
 * say nothing about where their pins own scroll. The active dot carries
 * `data-active` (CSS lights it in its orb colour) + `aria-current`. The rail
 * itself rises in once the film has built.
 */
export function buildAboutRail(host: HTMLElement): () => void {
  const rail = host.querySelector('[data-about-rail]') as HTMLElement | null
  if (!rail) return () => {}
  const fill = rail.querySelector('[data-rail-fill]') as HTMLElement | null
  const dots = gsap.utils.toArray<HTMLElement>('[data-rail-dot]', rail)
  const setFill = fill ? gsap.quickSetter(fill, 'scaleY') : null
  let activeIndex = -1

  const trigger = ScrollTrigger.create({
    trigger: host,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      setFill?.(self.progress)
      const y = self.scroll()
      const lookahead = window.innerHeight * 0.4
      let index = 0
      for (let i = 0; i < dots.length; i += 1) {
        const target = ScrollTrigger.getById(dots[i].getAttribute('data-rail-target') ?? '')
        if (target && y >= target.start - lookahead) index = i
      }
      if (index !== activeIndex) {
        activeIndex = index
        dots.forEach((dot, i) => {
          dot.toggleAttribute('data-active', i === index)
          if (i === index) dot.setAttribute('aria-current', 'true')
          else dot.removeAttribute('aria-current')
        })
      }
    },
  })

  const entrance = gsap.fromTo(
    rail,
    { autoAlpha: 0, x: 10 },
    { autoAlpha: 1, x: 0, duration: 0.8, ease: 'power2.out', delay: 0.5 },
  )

  return () => {
    entrance.kill()
    trigger.kill()
  }
}
