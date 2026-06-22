import { gsap, ScrollTrigger } from '@/shared/lib/gsap'

/**
 * Mobile, tablet, and reduced motion: no pinning, no WebGL, no manifesto/tenets
 * (those sections are hidden below xl). Content is CSS-visible; `[data-reveal-m]`
 * elements rise in batches. The hero film autoplays muted once on load and pauses
 * at the end (no loop). Reduced motion holds the first frame (no autoplay).
 */
export function buildOathStatic(host: HTMLElement): () => void {
  const disposers: Array<() => void> = []

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
      heroVideo.loop = false

      const onEnded = () => {
        heroVideo.pause()
      }
      heroVideo.addEventListener('ended', onEnded)
      disposers.push(() => heroVideo.removeEventListener('ended', onEnded))

      void heroVideo.play().catch(() => {})
    }
  }

  const items = gsap.utils.toArray<HTMLElement>('[data-reveal-m]', host)
  if (items.length > 0) {
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

  return () => {
    for (const dispose of disposers) dispose()
    ScrollTrigger.getAll().forEach((trigger) => {
      if (trigger.trigger && host.contains(trigger.trigger as Node)) {
        trigger.kill()
      }
    })
  }
}
