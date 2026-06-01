import { gsap } from '@/shared/lib/gsap'
import type { ActAnimationConfig } from '@/features/cms/landing/landingActs.types'
import type { ActMotionTokens } from './actAnimationConfig'
import {
  normalizeActMotionType,
  scaleEase,
  type ActMotionType,
} from './actAnimationConfig'
import type { ActAnimationIntensity } from '@/features/cms/landing/landingActs.types'

export type ActMotionSelectors = {
  /** Stagger / fade targets (blocks). */
  blocks?: string
  /** Per-word reveal selector. */
  words?: string
  /** Calm idle float target. */
  floatTarget?: string
  scrollStart?: string
}

export function applyCalmIdleFloat(
  target: Element | null,
  _tokens: ActMotionTokens,
  intensity: ActAnimationIntensity,
): (() => void) | void {
  if (!target) return
  const y = intensity === 'subtle' ? 4 : intensity === 'bold' ? 10 : 7
  const tween = gsap.to(target, {
    y: `+=${y}`,
    duration: intensity === 'bold' ? 5.5 : 4.2,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  })
  return () => {
    tween.kill()
  }
}

export function applyCalmIdlePulse(
  target: Element | null,
  intensity: ActAnimationIntensity,
): (() => void) | void {
  if (!target) return
  const scale = intensity === 'subtle' ? 1.02 : intensity === 'bold' ? 1.06 : 1.04
  const tween = gsap.to(target, {
    scale,
    duration: intensity === 'bold' ? 4.8 : 3.6,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
    transformOrigin: '50% 50%',
  })
  return () => {
    tween.kill()
  }
}

export function bindMicroHover(host: HTMLElement): (() => void) | void {
  const buttons = gsap.utils.toArray<HTMLElement>('[data-act-micro]', host)
  if (!buttons.length) return

  const cleanups: Array<() => void> = []

  for (const btn of buttons) {
    const onEnter = () => {
      gsap.to(btn, { y: -2, scale: 1.02, duration: 0.25, ease: 'power2.out' })
    }
    const onLeave = () => {
      gsap.to(btn, { y: 0, scale: 1, duration: 0.3, ease: 'power2.out' })
    }
    btn.addEventListener('pointerenter', onEnter)
    btn.addEventListener('pointerleave', onLeave)
    cleanups.push(() => {
      btn.removeEventListener('pointerenter', onEnter)
      btn.removeEventListener('pointerleave', onLeave)
    })
  }

  return () => {
    for (const fn of cleanups) fn()
  }
}

export function scrollEnterTimeline(
  host: HTMLElement,
  targets: Array<Element | null | undefined>,
  tokens: ActMotionTokens,
  intensity: ActAnimationIntensity,
  start = 'top 78%',
) {
  const filtered = targets.filter(Boolean) as Element[]
  if (!filtered.length) return

  gsap.set(filtered, { opacity: 0, y: tokens.enterY })
  return gsap.timeline({
    scrollTrigger: {
      trigger: host,
      start,
      toggleActions: 'play none none reverse',
    },
  }).to(filtered, {
    opacity: 1,
    y: 0,
    duration: tokens.duration,
    stagger: tokens.stagger,
    ease: scaleEase(intensity),
  })
}

export function wordRevealTargets(
  host: HTMLElement,
  selector: string,
  tokens: ActMotionTokens,
  intensity: ActAnimationIntensity,
  start = 'top 78%',
) {
  const words = gsap.utils.toArray<HTMLElement>(selector, host)
  if (!words.length) return

  gsap.set(words, { opacity: 0, y: tokens.enterY * 0.65 })
  return gsap.timeline({
    scrollTrigger: {
      trigger: host,
      start,
      toggleActions: 'play none none reverse',
    },
  }).to(words, {
    opacity: 1,
    y: 0,
    duration: tokens.duration * 0.85,
    stagger: tokens.stagger * 0.75,
    ease: scaleEase(intensity),
  })
}

function bindParallaxScroll(
  host: HTMLElement,
  selector: string,
  tokens: ActMotionTokens,
): void {
  const target = host.querySelector(selector)
  if (!target) return
  gsap.to(target, {
    yPercent: -tokens.parallaxY * 1.4,
    ease: 'none',
    scrollTrigger: {
      trigger: host,
      start: 'top bottom',
      end: 'bottom top',
      scrub: tokens.scrub,
    },
  })
}

/**
 * Applies CMS `animation.type` motion inside a preset `onAnimate` hook.
 * Returns optional cleanup (e.g. calm idle tweens).
 */
export function applyActMotionByType(
  host: HTMLElement,
  animation: ActAnimationConfig,
  tokens: ActMotionTokens,
  selectors: ActMotionSelectors = {},
): (() => void) | void {
  const type: ActMotionType = normalizeActMotionType(animation.type)
  const start = selectors.scrollStart ?? 'top 78%'
  const intensity = animation.intensity
  const cleanups: Array<() => void> = []

  if (type === 'none') return

  if (type === 'fadeUp' || type === 'stagger') {
    const blockSel = selectors.blocks
    if (blockSel) {
      const blocks = gsap.utils.toArray<HTMLElement>(blockSel, host)
      scrollEnterTimeline(host, blocks, tokens, intensity, start)
    }
    if (type === 'stagger' && selectors.words) {
      wordRevealTargets(host, selectors.words, tokens, intensity, start)
    }
  }

  if (type === 'wordReveal' && selectors.words) {
    wordRevealTargets(host, selectors.words, tokens, intensity, start)
    if (selectors.blocks) {
      const blocks = gsap.utils.toArray<HTMLElement>(selectors.blocks, host)
      scrollEnterTimeline(host, blocks, tokens, intensity, start)
    }
  }

  if (type === 'parallax') {
    if (selectors.blocks) bindParallaxScroll(host, selectors.blocks, tokens)
    if (selectors.floatTarget) bindParallaxScroll(host, selectors.floatTarget, tokens)
    if (selectors.words) wordRevealTargets(host, selectors.words, tokens, intensity, start)
  }

  if (type === 'calmIdle') {
    if (selectors.blocks) {
      const blocks = gsap.utils.toArray<HTMLElement>(selectors.blocks, host)
      scrollEnterTimeline(host, blocks, tokens, intensity, start)
    }
    const floatSel = selectors.floatTarget ?? selectors.blocks
    if (floatSel) {
      const floatEl = host.querySelector(floatSel)
      const idle = applyCalmIdleFloat(floatEl, tokens, intensity)
      if (idle) cleanups.push(idle)
    }
  }

  if (cleanups.length) {
    return () => {
      for (const fn of cleanups) fn()
    }
  }
}
