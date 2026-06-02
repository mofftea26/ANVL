import type { RefObject } from 'react'
import { gsap, useGSAP } from '@/shared/lib/gsap'
import {
  BRAND_SHOWCASE_BEATS,
  BRAND_SHOWCASE_CLOSING_CHOREO,
  BRAND_SHOWCASE_MOTION,
  BRAND_SHOWCASE_SCROLL_END,
} from './brandShowcaseAssets'
import { bindScrollVideo } from './useScrollVideo'

type BrandShowcaseTimelineOptions = {
  /** Number of manifesto tenets — refreshes scroll distances when copy changes. */
  tenetCount: number
  /** Number of featured products — refreshes product reveal triggers. */
  productCount: number
}

function snapFinalState(host: HTMLElement) {
  gsap.set('[data-brand-beat]', { opacity: 1, y: 0, scale: 1, pointerEvents: 'auto', clearProps: 'transform,filter' })
  gsap.set('[data-brand-beat] > *', { opacity: 1, y: 0, clearProps: 'transform,opacity,filter' })
  gsap.set('[data-brand-hero-copy]', { opacity: 1, y: 0, scale: 1, filter: 'none' })
  gsap.set('[data-brand-word]', { opacity: 1, y: 0, scale: 1, filter: 'none' })
  gsap.set('[data-brand-ambient]', { clearProps: 'transform' })
  gsap.set('[data-brand-product]', { opacity: 1, y: 0, scale: 1, filter: 'none' })
  gsap.set('[data-brand-fog]', { opacity: 0.55 })
  gsap.set('[data-brand-vignette]', { opacity: 0.42 })
  gsap.set('[data-brand-hero-vignette]', { opacity: 0.58 })
  gsap.set('[data-brand-closing-wordmark]', {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'none',
    clearProps: 'transform,opacity,filter',
  })
  gsap.set('[data-brand-closing-emblem], [data-brand-close-emblem]', {
    opacity: 1,
    scale: 1,
    filter: 'none',
    clearProps: 'transform,opacity,filter,letterSpacing',
  })
  gsap.set(
    '[data-brand-closing-eyebrow], [data-brand-closing-word], [data-brand-closing-intro], [data-brand-closing-cta-shop], [data-brand-closing-cta-enter]',
    { opacity: 1, y: 0, scale: 1, filter: 'none', letterSpacing: '0em', clearProps: 'transform,opacity,filter,letterSpacing' },
  )

  const reducedStack = host.querySelector<HTMLElement>('[data-brand-reduced-stack]')
  if (reducedStack) {
    gsap.set(reducedStack, { display: 'block', opacity: 1 })
    gsap.set(reducedStack.querySelectorAll('[data-brand-scroll-section]'), {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: 'none',
      clearProps: 'transform,opacity,filter',
    })
  }
  const stage = host.querySelector<HTMLElement>('[data-brand-stage]')
  if (stage) {
    gsap.set(stage, { display: 'none' })
  }
}

function beatWindow(inAt: number, outAt: number) {
  const span = outAt - inAt
  return {
    fadeInEnd: inAt + span * 0.14,
    holdEnd: outAt - span * 0.14,
    fadeOutEnd: outAt,
  }
}

function bindBeat(
  timeline: gsap.core.Timeline,
  beat: HTMLElement | null,
  inAt: number,
  outAt: number,
  enterY = 48,
  startVisible = false,
  /** When true, beat stays fully visible through scroll progress 1.0 (no exit fade). */
  holdThroughEnd = false,
) {
  if (!beat) return

  const { fadeInEnd, holdEnd, fadeOutEnd } = beatWindow(inAt, outAt)
  const enterDuration = fadeInEnd - inAt
  const exitDuration = fadeOutEnd - holdEnd

  if (startVisible) {
    gsap.set(beat, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', pointerEvents: 'auto' })
  } else {
    gsap.set(beat, {
      opacity: 0,
      y: enterY,
      scale: 0.94,
      filter: 'blur(8px)',
      pointerEvents: 'none',
    })
    timeline.to(
      beat,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        pointerEvents: 'auto',
        ease: 'power3.out',
        duration: enterDuration,
      },
      inAt,
    )
  }

  if (!holdThroughEnd) {
    timeline.to(
      beat,
      {
        opacity: 0,
        y: -enterY * 0.72,
        scale: 0.97,
        filter: 'blur(6px)',
        pointerEvents: 'none',
        ease: 'power2.in',
        duration: exitDuration,
      },
      holdEnd,
    )
  }
}

function bindHeroCopy(
  timeline: gsap.core.Timeline,
  stage: HTMLElement,
  inAt: number,
  outAt: number,
  startVisible = false,
) {
  const lines = gsap.utils.toArray<HTMLElement>('[data-brand-hero-copy]', stage)
  if (!lines.length) return

  const { fadeInEnd, holdEnd } = beatWindow(inAt, outAt)
  const stagger = Math.min(0.05, (fadeInEnd - inAt) / lines.length)

  if (startVisible) {
    gsap.set(lines, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' })
  } else {
    gsap.set(lines, { opacity: 0, y: 36, scale: 0.96, filter: 'blur(10px)' })
    timeline.to(
      lines,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        stagger,
        ease: 'power3.out',
        duration: fadeInEnd - inAt,
      },
      inAt,
    )
  }

  timeline.to(
    lines,
    {
      opacity: 0,
      y: -20,
      scale: 0.98,
      filter: 'blur(5px)',
      stagger: stagger * 0.55,
      ease: 'power2.in',
      duration: 0.1,
    },
    holdEnd,
  )
}

function bindManifestoWords(
  timeline: gsap.core.Timeline,
  stage: HTMLElement,
  inAt: number,
  outAt: number,
) {
  const words = gsap.utils.toArray<HTMLElement>('[data-brand-word]', stage)
  if (!words.length) return

  const { fadeInEnd } = beatWindow(inAt, outAt)
  const stagger = Math.min(0.04, (fadeInEnd - inAt) / words.length)

  gsap.set(words, { opacity: 0.15, y: 28, scale: 0.94, filter: 'blur(8px)' })
  timeline.to(
    words,
    {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      stagger,
      ease: 'power3.out',
      duration: fadeInEnd - inAt,
    },
    inAt,
  )
  timeline.to(
    words,
    {
      opacity: 0,
      y: -18,
      scale: 0.98,
      filter: 'blur(6px)',
      stagger: stagger * 0.55,
      ease: 'power2.in',
      duration: 0.14,
    },
    outAt - 0.14,
  )
}

function bindManifestoTenets(
  timeline: gsap.core.Timeline,
  stage: HTMLElement,
  inAt: number,
  outAt: number,
) {
  const tenets = gsap.utils.toArray<HTMLElement>('[data-brand-tenet]', stage)
  if (!tenets.length) return

  const { fadeInEnd, holdEnd } = beatWindow(inAt, outAt)
  const stagger = Math.min(0.06, (fadeInEnd - inAt) / tenets.length)

  gsap.set(tenets, { opacity: 0, y: 24, filter: 'blur(6px)' })
  timeline.to(
    tenets,
    {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      stagger,
      ease: 'power3.out',
      duration: fadeInEnd - inAt,
    },
    inAt + 0.04,
  )
  timeline.to(
    tenets,
    {
      opacity: 0,
      y: -14,
      filter: 'blur(4px)',
      stagger: stagger * 0.45,
      ease: 'power2.in',
      duration: 0.12,
    },
    holdEnd,
  )
}

type ClosingRevealOpts = {
  y?: number
  scale?: number
  blur?: number
  letterSpacing?: string
}

function revealClosingPart(
  timeline: gsap.core.Timeline,
  target: gsap.TweenTarget,
  start: number,
  end: number,
  { y = 44, scale = 0.9, blur = 10, letterSpacing = '0.14em' }: ClosingRevealOpts = {},
) {
  const duration = Math.max(0.04, end - start)
  gsap.set(target, {
    opacity: 0,
    y,
    scale,
    filter: `blur(${blur}px)`,
    letterSpacing,
  })
  timeline.to(
    target,
    {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      letterSpacing: '0em',
      ease: 'power4.out',
      duration,
    },
    start,
  )
}

/** Closing beat shell — no container fade; children reveal on scroll. Holds through 1.0. */
function bindClosingBeatShell(timeline: gsap.core.Timeline, beat: HTMLElement | null, inAt: number) {
  if (!beat) return

  gsap.set(beat, {
    opacity: 0,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    pointerEvents: 'none',
  })
  timeline.to(
    beat,
    {
      opacity: 1,
      pointerEvents: 'auto',
      ease: 'none',
      duration: 0.03,
    },
    inAt,
  )
}

function bindClosingParts(timeline: gsap.core.Timeline, stage: HTMLElement) {
  const {
    wordmarkStart,
    wordmarkEnd,
    emblemStart,
    emblemEnd,
    eyebrowStart,
    eyebrowEnd,
    headlineStart,
    headlineEnd,
    introStart,
    introEnd,
    ctaShopStart,
    ctaShopEnd,
    ctaEnterStart,
    ctaEnterEnd,
  } = BRAND_SHOWCASE_CLOSING_CHOREO

  const wordmark = stage.querySelector('[data-brand-closing-wordmark]')
  const emblem = stage.querySelector('[data-brand-closing-emblem]')
  const eyebrow = stage.querySelector('[data-brand-closing-eyebrow]')
  const words = gsap.utils.toArray<HTMLElement>('[data-brand-closing-word]', stage)
  const intro = stage.querySelector('[data-brand-closing-intro]')
  const ctaShop = stage.querySelector('[data-brand-closing-cta-shop]')
  const ctaEnter = stage.querySelector('[data-brand-closing-cta-enter]')

  if (wordmark) {
    revealClosingPart(timeline, wordmark, wordmarkStart, wordmarkEnd, {
      y: 40,
      scale: 0.88,
      blur: 14,
    })
    timeline.to(
      wordmark,
      { scale: 1, opacity: 1, ease: 'none', duration: ctaEnterEnd - wordmarkEnd },
      wordmarkEnd,
    )
  }

  if (emblem) {
    revealClosingPart(timeline, emblem, emblemStart, emblemEnd, {
      y: 56,
      scale: 0.62,
      blur: 18,
      letterSpacing: '0em',
    })
    timeline.to(
      emblem,
      { scale: 1.03, opacity: 0.92, ease: 'none', duration: ctaEnterEnd - emblemEnd },
      emblemEnd,
    )
  }

  if (eyebrow) {
    revealClosingPart(timeline, eyebrow, eyebrowStart, eyebrowEnd, {
      y: 32,
      scale: 0.94,
      blur: 12,
      letterSpacing: '0.22em',
    })
  }

  if (words.length) {
    const span = headlineEnd - headlineStart
    const stagger = Math.min(0.028, span / words.length)
    gsap.set(words, {
      opacity: 0,
      y: 48,
      scale: 0.88,
      filter: 'blur(14px)',
      letterSpacing: '0.12em',
    })
    timeline.to(
      words,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        letterSpacing: '0em',
        stagger,
        ease: 'power4.out',
        duration: span - stagger * (words.length - 1),
      },
      headlineStart,
    )
  }

  if (intro) {
    revealClosingPart(timeline, intro, introStart, introEnd, {
      y: 28,
      scale: 0.96,
      blur: 10,
      letterSpacing: '0.06em',
    })
  }

  if (ctaShop) {
    revealClosingPart(timeline, ctaShop, ctaShopStart, ctaShopEnd, {
      y: 36,
      scale: 0.92,
      blur: 8,
      letterSpacing: '0.18em',
    })
  }

  if (ctaEnter) {
    revealClosingPart(timeline, ctaEnter, ctaEnterStart, ctaEnterEnd, {
      y: 40,
      scale: 0.9,
      blur: 8,
      letterSpacing: '0.2em',
    })
  }
}

function bindProductCards(
  timeline: gsap.core.Timeline,
  stage: HTMLElement,
  inAt: number,
  outAt: number,
) {
  const products = gsap.utils.toArray<HTMLElement>('[data-brand-product]', stage)
  if (!products.length) return

  const { fadeInEnd, holdEnd, fadeOutEnd } = beatWindow(inAt, outAt)
  const enterDuration = fadeInEnd - inAt
  const exitDuration = fadeOutEnd - holdEnd
  const stagger = Math.min(0.07, enterDuration / Math.max(products.length, 1))

  gsap.set(products, {
    opacity: 0,
    y: 52,
    scale: 0.82,
    filter: 'blur(10px)',
    transformOrigin: '50% 85%',
  })
  timeline.to(
    products,
    {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      stagger,
      ease: 'power3.out',
      duration: enterDuration,
    },
    inAt,
  )
  timeline.to(
    products,
    {
      opacity: 0,
      y: -32,
      scale: 0.9,
      filter: 'blur(6px)',
      stagger: stagger * 0.5,
      ease: 'power2.in',
      duration: exitDuration,
    },
    holdEnd,
  )
}

function bindAmbientParallax(host: HTMLElement, scrollEnd: string, scrub: number) {
  gsap.utils.toArray<HTMLElement>('[data-brand-ambient]', host).forEach((el) => {
    const depth = Number(el.dataset.brandDepth ?? 1)
    gsap.to(el, {
      y: () => window.innerHeight * 0.22 * depth,
      x: () => 14 * depth * (depth > 0.45 ? 1 : -1),
      rotation: `+=${depth * 3}`,
      ease: 'none',
      scrollTrigger: {
        trigger: host,
        start: 'top top',
        end: scrollEnd,
        scrub,
      },
    })
  })
}

function bindMasterScene(
  host: HTMLElement,
  scrollEnd: string,
  scrub: number,
  onProgress?: (progress: number) => void,
) {
  const stage = host.querySelector<HTMLElement>('[data-brand-stage]')
  const fog = host.querySelector('[data-brand-fog]')
  const vignette = host.querySelector('[data-brand-vignette]')
  const heroVignette = host.querySelector('[data-brand-hero-vignette]')
  const warrior = host.querySelector('[data-brand-hero-warrior]')

  const heroBeat = host.querySelector<HTMLElement>('[data-brand-beat="hero"]')
  const manifestoBeat = host.querySelector<HTMLElement>('[data-brand-beat="manifesto"]')
  const productsBeat = host.querySelector<HTMLElement>('[data-brand-beat="products"]')
  const closingBeat = host.querySelector<HTMLElement>('[data-brand-beat="closing"]')

  if (!stage) return

  const { heroIn, heroOut, manifestoIn, manifestoOut, productsIn, productsOut, closingIn } =
    BRAND_SHOWCASE_BEATS

  const scene = gsap.timeline({
    scrollTrigger: {
      trigger: stage,
      start: 'top top',
      end: scrollEnd,
      pin: true,
      scrub,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        onProgress?.(self.progress)
      },
    },
  })

  bindBeat(scene, heroBeat, heroIn, heroOut, 40, true)
  bindHeroCopy(scene, stage, heroIn, heroOut, true)

  if (warrior) {
    scene.fromTo(
      warrior,
      { y: 14, scale: 1.012 },
      { y: -4, scale: 1, ease: 'none', duration: 1 },
      0,
    )
  }

  bindBeat(scene, manifestoBeat, manifestoIn, manifestoOut, 52)
  bindManifestoWords(scene, stage, manifestoIn, manifestoOut)
  bindManifestoTenets(scene, stage, manifestoIn, manifestoOut)

  if (productsBeat) {
    bindBeat(scene, productsBeat, productsIn, productsOut, 36)
    bindProductCards(scene, stage, productsIn + 0.02, productsOut - 0.02)
  }

  bindClosingBeatShell(scene, closingBeat, closingIn)
  bindClosingParts(scene, stage)

  if (fog) {
    scene.fromTo(fog, { opacity: 0.38 }, { opacity: 0.62, ease: 'none', duration: 0.35 }, 0)
    scene.to(fog, { opacity: 0.48, ease: 'none', duration: 0.25 }, 0.75)
  }

  if (vignette) {
    scene.fromTo(vignette, { opacity: 0.38 }, { opacity: 0.52, ease: 'none', duration: 0.5 }, 0)
    scene.to(vignette, { opacity: 0.58, ease: 'none', duration: 0.5 }, 0.5)
  }

  if (heroVignette) {
    scene.fromTo(heroVignette, { opacity: 0.48 }, { opacity: 0.68, ease: 'none', duration: 0.45 }, 0)
    scene.to(heroVignette, { opacity: 0.78, ease: 'none', duration: 0.55 }, 0.45)
  }

  bindAmbientParallax(host, scrollEnd, scrub * 0.88)
}

/**
 * Single master ScrollTrigger timeline for the brand showcase — one pinned viewport,
 * warrior video scrubbed 0→1 across full scroll, copy beats enter/exit on labels.
 */
export function useBrandShowcaseTimeline(
  rootRef: RefObject<HTMLElement | null>,
  { tenetCount, productCount }: BrandShowcaseTimelineOptions,
) {
  useGSAP(
    () => {
      const host = rootRef.current
      if (!host) return

      const mm = gsap.matchMedia()

      mm.add(BRAND_SHOWCASE_MOTION.snap, () => {
        snapFinalState(host)
      })

      mm.add(BRAND_SHOWCASE_MOTION.mobile, () => {
        const stack = host.querySelector('[data-brand-reduced-stack]')
        if (!stack) return

        const ctx = gsap.context(() => {
          const sections = gsap.utils.toArray<HTMLElement>(
            '[data-brand-scroll-section]',
            stack,
          )
          sections.forEach((section) => {
            gsap.from(section, {
              opacity: 0,
              y: 28,
              scale: 0.98,
              filter: 'blur(6px)',
              duration: 0.75,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: section,
                start: 'top 88%',
                toggleActions: 'play none none none',
              },
            })
          })
        }, host)

        return () => ctx.revert()
      })

      mm.add(BRAND_SHOWCASE_MOTION.desktop, () => {
        let disposeScrollVideo: (() => void) | undefined

        const ctx = gsap.context(() => {
          let scrubWarriorVideo: ((progress: number) => void) | undefined
          disposeScrollVideo = bindScrollVideo(host, (update) => {
            scrubWarriorVideo = update
            scrubWarriorVideo(0)
          })

          bindMasterScene(host, BRAND_SHOWCASE_SCROLL_END, 0.85, (progress) => {
            scrubWarriorVideo?.(progress)
          })
        }, host)

        return () => {
          disposeScrollVideo?.()
          ctx.revert()
        }
      })

      return () => mm.revert()
    },
    { scope: rootRef, dependencies: [tenetCount, productCount] },
  )
}
