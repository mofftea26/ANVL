import { gsap, ScrollTrigger } from '@/shared/lib/gsap'

/**
 * Mobile + reduced motion: no pinning, no WebGL. Content is CSS-visible;
 * `[data-reveal-m]` elements rise in batches so grids that share a row reveal
 * together with a short stagger. The hero film loops muted on mobile and holds
 * its first frame under reduced motion (no scroll-scrub — that's desktop-only).
 */
export function buildOathStatic(host: HTMLElement): void {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reduced) {
    for (const video of Array.from(host.querySelectorAll('video'))) {
      video.pause()
      try {
        video.currentTime = 0
      } catch {
        /* not seekable yet */
      }
    }
  } else {
    const heroVideo =
      (host.querySelector('[data-hero-video-mobile]') as HTMLVideoElement | null) ??
      (host.querySelector('[data-hero-video-desktop]') as HTMLVideoElement | null)
    if (heroVideo) {
      heroVideo.muted = true
      heroVideo.loop = true
      void heroVideo.play().catch(() => {})
    }
  }

  const items = gsap.utils.toArray<HTMLElement>('[data-reveal-m]', host)
  if (items.length === 0) return

  gsap.set(items, { opacity: 0, y: 24 })
  ScrollTrigger.batch(items, {
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
}
