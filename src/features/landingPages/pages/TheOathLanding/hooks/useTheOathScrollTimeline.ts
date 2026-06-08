import type { RefObject } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '@/shared/lib/gsap'

/**
 * The Oath — master scroll choreography (one continuous cinematic film).
 *
 * Full-bleed media planes with scroll-as-camera motion: hero parallax + intro,
 * a pinned manifesto push-in, a pinned **cross-dissolving chapter gallery**
 * (the Lando-style scrub), sequential pinned product scenes, and a closing
 * reveal. Scene components only render markup + `data-*` hooks; all logic is here.
 *
 * Rules: `gsap.matchMedia` → desktop (full) / tablet (reduced) / static
 * (mobile + reduced-motion = NO pins, light reveals). transform/opacity only.
 * Initial hidden states are set INSIDE the motion branches, so the page is never
 * blank without JS / on mobile / under reduced motion. `mm.revert()` on cleanup.
 */

const DESKTOP = '(min-width: 1024px) and (prefers-reduced-motion: no-preference)'
const TABLET =
  '(min-width: 768px) and (max-width: 1023.98px) and (prefers-reduced-motion: no-preference)'
const STATIC = '(max-width: 767.98px), (prefers-reduced-motion: reduce)'

type Selector = (sel: string) => HTMLElement[]

/** Pixel height of the fixed header, read from `--anvl-header-h` (SSR-safe). */
function headerOffsetPx(): number {
  if (typeof window === 'undefined') return 64
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--anvl-header-h')
    .trim()
  if (raw.endsWith('rem')) return parseFloat(raw) * 16
  if (raw.endsWith('px')) return parseFloat(raw)
  return 64
}

function pinTrigger(trigger: Element, endPct: number) {
  return {
    trigger,
    // Pin just below the fixed header so the pinned frame fills the area under
    // the bar (no gap, content never hidden behind the nav).
    start: () => `top top+=${headerOffsetPx()}`,
    end: `+=${Math.round(endPct)}%`,
    pin: true,
    scrub: 1 as const,
    anticipatePin: 1,
    invalidateOnRefresh: true,
  }
}

function buildHero(host: HTMLElement, q: Selector, intensity: number) {
  const hero = host.querySelector('[data-scene="hero"]')
  if (!hero) return
  const video = host.querySelector('[data-hero-video]') as HTMLVideoElement | null

  // Intro choreography (plays on load): title masks up, underline draws, lines rise.
  gsap.set(q('[data-hero-line-inner]'), { yPercent: 120 })
  gsap.set(q('[data-hero-underline]'), { scaleX: 0 })
  gsap.set(q('[data-hero-fade]'), { opacity: 0, y: 24 })
  gsap
    .timeline({ defaults: { ease: 'expo.out' }, delay: 0.15 })
    .to(q('[data-hero-line-inner]'), { yPercent: 0, duration: 1.1, stagger: 0.12 }, 0)
    .to(q('[data-hero-underline]'), { scaleX: 1, duration: 0.9, ease: 'power3.inOut' }, 0.6)
    .to(q('[data-hero-fade]'), { opacity: 1, y: 0, duration: 0.7, stagger: 0.09 }, 0.5)

  if (video) {
    // Prime for frame-accurate seeking (Safari needs a play() before scrubbing).
    video.muted = true
    const primed = video.play()
    if (primed && typeof primed.then === 'function') primed.then(() => video.pause()).catch(() => {})
    else video.pause()

    // Pin the hero just below the fixed header (so the pinned frame fills the
    // area under the bar, no gap); scroll progress drives the video playback
    // frame-by-frame, while the title card parallaxes up and the veil deepens.
    const proxy = { p: 0 }
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: () => `top top+=${headerOffsetPx()}`,
        end: `+=${Math.round(150 * intensity)}%`,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    })
    // Video progress spans the ENTIRE pin (explicit duration:1) so it never
    // finishes early and stalls — it reaches the last frame exactly as the
    // title card bleeds out and the section releases into the forge.
    tl.to(
      proxy,
      {
        p: 1,
        ease: 'none',
        duration: 1,
        onUpdate: () => {
          const d = video.duration
          if (d && Number.isFinite(d)) {
            const t = proxy.p * d
            if (Math.abs(video.currentTime - t) > 0.033) {
              try {
                video.currentTime = t
              } catch {
                /* a seek is already in flight — skip this frame */
              }
            }
          }
        },
      },
      0,
    )
    tl.to(q('[data-hero-veil]'), { opacity: 1.1, ease: 'none', duration: 1 }, 0)
    tl.to(q('[data-hero-content]'), { yPercent: -12 * intensity, ease: 'none', duration: 1 }, 0)
    tl.to(q('[data-hero-content]'), { opacity: 0, y: -24, duration: 0.2 }, 0.8)
    return
  }

  // No video — simple parallax exit (non-pinned).
  gsap.to(q('[data-hero-content]'), {
    yPercent: -16 * intensity,
    opacity: 0.25,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
  })
}

function buildManifesto(host: HTMLElement, q: Selector, intensity: number) {
  const man = host.querySelector('[data-scene="manifesto"]')
  if (!man) return
  gsap.set(q('[data-manifesto-inner]'), { yPercent: 115 })
  gsap
    .timeline({ scrollTrigger: pinTrigger(man, 120 * intensity) })
    .from(q('[data-manifesto-media]'), { scale: 1.16, ease: 'none' }, 0)
    .to(q('[data-manifesto-inner]'), { yPercent: 0, duration: 0.7, stagger: 0.3, ease: 'power3.out' }, 0.15)
}

/** Distinct enter/exit poses per tenet (cycled) so no two transitions repeat. */
const CHAPTER_MEDIA_IN = [
  { scale: 1.28 },
  { xPercent: 12, scale: 1.12 },
  { yPercent: 14, scale: 1.12 },
  { scale: 0.86 },
]
const CHAPTER_TEXT_IN = [
  { opacity: 0, x: -44 },
  { opacity: 0, y: 44 },
  { opacity: 0, x: 44 },
  { opacity: 0, y: -36, scale: 0.96 },
]
const CHAPTER_TEXT_OUT = [
  { opacity: 0, x: 34 },
  { opacity: 0, y: -30 },
  { opacity: 0, x: -34 },
  { opacity: 0, scale: 1.05 },
]

function buildChapters(host: HTMLElement, q: Selector, intensity: number) {
  const chapters = host.querySelector('[data-scene="chapters"]')
  if (!chapters) return
  const layers = q('[data-chapter]')
  if (layers.length === 0) return
  const ticks = q('[data-chapter-tick]')

  gsap.set(layers, { opacity: 0 })
  gsap.set(layers[0], { opacity: 1 })
  if (ticks.length) gsap.set(ticks, { opacity: 0.25, scaleX: 0.35, transformOrigin: 'left center' })

  // Shorter than before (~55% per tenet vs 80%) so it doesn't overstay.
  const tl = gsap.timeline({
    scrollTrigger: pinTrigger(chapters, layers.length * 55 * intensity),
  })
  layers.forEach((layer, i) => {
    const text = layer.querySelector('[data-chapter-text]')
    const media = layer.querySelector('[data-chapter-media]')
    const mediaIn = CHAPTER_MEDIA_IN[i % CHAPTER_MEDIA_IN.length]
    const textIn = CHAPTER_TEXT_IN[i % CHAPTER_TEXT_IN.length]

    if (i > 0) {
      tl.to(layers[i - 1], { opacity: 0, duration: 0.4 }, i)
      tl.to(layer, { opacity: 1, duration: 0.4 }, i)
    }
    if (ticks[i]) tl.to(ticks[i], { opacity: 1, scaleX: 1, duration: 0.4, ease: 'power2.out' }, i)
    if (media)
      tl.fromTo(
        media,
        { ...mediaIn },
        { scale: 1, xPercent: 0, yPercent: 0, duration: 0.95, ease: 'power2.out' },
        i,
      )
    if (text) tl.fromTo(text, { ...textIn }, { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.5, ease: 'power3.out' }, i + 0.08)
    if (text && i < layers.length - 1) {
      const out = CHAPTER_TEXT_OUT[i % CHAPTER_TEXT_OUT.length]
      tl.to(text, { ...out, duration: 0.32, ease: 'power2.in' }, i + 0.72)
    }
  })
}

/**
 * The three pieces assemble **horizontally** while the section is pinned: the
 * outer banners march in from the left/right edges and the centre one drops onto
 * the rail — a sideways read driven by vertical scroll.
 */
function buildProducts(host: HTMLElement, q: Selector, intensity: number) {
  const scene = host.querySelector('[data-product-reveal]')
  if (!scene) return
  const banners = q('[data-banner]')
  if (banners.length === 0) return
  const heading = q('[data-products-heading]')
  const rail = q('[data-banner-rail]')

  // Entrance pose per column: left slides from the left, right from the right,
  // centre drops down. Index 1 is treated as the centre regardless of count.
  banners.forEach((banner, i) => {
    const isLeft = i === 0
    const isRight = i === banners.length - 1 && banners.length > 1
    const isCenter = !isLeft && !isRight
    gsap.set(banner, {
      opacity: 0,
      transformPerspective: 1600,
      transformOrigin: 'top center',
      xPercent: isLeft ? -210 : isRight ? 210 : 0,
      yPercent: isLeft || isRight ? -12 : 42,
      rotateY: isLeft ? 48 : isRight ? -48 : 0,
      rotateX: isCenter ? -22 : isLeft ? 8 : -8,
      scale: isCenter ? 0.82 : 0.92,
    })
  })
  if (heading.length) gsap.set(heading, { opacity: 0, y: 28 })
  if (rail.length) gsap.set(rail, { scaleX: 0, transformOrigin: 'center center' })

  const tl = gsap.timeline({ scrollTrigger: pinTrigger(scene, 110 * intensity) })
  if (heading.length) tl.to(heading, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 0)
  if (rail.length) tl.to(rail, { scaleX: 1, duration: 0.5, ease: 'power2.out' }, 0.25)
  tl.to(
    banners,
    {
      opacity: 1,
      xPercent: 0,
      yPercent: 0,
      rotateY: 0,
      rotateX: 0,
      scale: 1,
      duration: 1.05,
      ease: 'back.out(1.15)',
      stagger: { each: 0.16, from: 'edges' },
    },
    0.38,
  )
}

function buildFinal(host: HTMLElement, q: Selector) {
  const fin = host.querySelector('[data-scene="final"]')
  if (!fin) return

  gsap.set(q('[data-final-crest]'), { opacity: 0, yPercent: -70, rotateX: -28, scale: 0.9, transformOrigin: 'top center' })
  gsap.set(q('[data-final-word]'), { yPercent: 120 })
  gsap.set(q('[data-final-rule]'), { scaleX: 0 })
  gsap.set(q('[data-final-fade]'), { opacity: 0, y: 22 })
  gsap.set(q('[data-final-inner]'), { yPercent: 115 })

  gsap
    .timeline({
      scrollTrigger: { trigger: fin, start: 'top 80%', end: 'top 28%', scrub: 1, invalidateOnRefresh: true },
    })
    .to(q('[data-final-crest]'), { opacity: 1, yPercent: 0, rotateX: 0, scale: 1, duration: 0.7, ease: 'power3.out' }, 0)
    .to(q('[data-final-word]'), { yPercent: 0, duration: 0.7, stagger: 0.12, ease: 'expo.out' }, 0.25)
    .to(q('[data-final-rule]'), { scaleX: 1, duration: 0.5, ease: 'power3.inOut' }, 0.7)
    .to(q('[data-final-fade]'), { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }, 0.8)
    .to(q('[data-final-inner]'), { yPercent: 0, stagger: 0.16, duration: 0.7, ease: 'power3.out' }, 1.0)
}

function buildCinematic(host: HTMLElement, intensity: number) {
  const q: Selector = (sel) => gsap.utils.toArray<HTMLElement>(sel, host)
  buildHero(host, q, intensity)
  buildManifesto(host, q, intensity)
  buildChapters(host, q, intensity)
  buildProducts(host, q, intensity)
  buildFinal(host, q)
}

/**
 * Mobile + reduced motion: no pinning. Content is CSS-visible; reveal lightly.
 * Elements are revealed in **batches** (`ScrollTrigger.batch`) so a grid of cards
 * that share the same row — the tenets, the product grid — rise together with a
 * short stagger instead of each firing its own trigger.
 */
function buildStatic(host: HTMLElement) {
  const items = gsap.utils.toArray<HTMLElement>('[data-reveal-m]', host)
  if (items.length) {
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

  // Hero video: loop muted on mobile; hold the first frame under reduced motion
  // (no scroll-scrub — that's desktop-only).
  const video = host.querySelector('[data-hero-video]') as HTMLVideoElement | null
  if (video) {
    video.muted = true
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      video.pause()
      try {
        video.currentTime = 0
      } catch {
        /* not seekable yet */
      }
    } else {
      // Mobile: play through exactly once per page load, then hold the final
      // frame (no loop) — a single cinematic pass rather than a restless loop.
      video.loop = false
      void video.play().catch(() => {})
    }
  }
}

export function useTheOathScrollTimeline(root: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const host = root.current
      if (!host) return
      const mm = gsap.matchMedia()
      mm.add(STATIC, () => buildStatic(host))
      // Tablet runs the SAME cinematic as desktop (full intensity) — only the
      // CSS layout differs (handled per-scene with md:/lg: breakpoints).
      mm.add(TABLET, () => buildCinematic(host, 1))
      mm.add(DESKTOP, () => buildCinematic(host, 1))
      return () => mm.revert()
    },
    { scope: root },
  )
}
