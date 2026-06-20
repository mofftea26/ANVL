import { gsap } from '@/shared/lib/gsap'

export type Selector = (sel: string) => HTMLElement[]

export function scopedSelector(host: HTMLElement): Selector {
  return (sel) => gsap.utils.toArray<HTMLElement>(sel, host)
}

/** Pixel height of the fixed header, read from `--anvl-header-h` (SSR-safe). */
export function headerOffsetPx(): number {
  if (typeof window === 'undefined') return 64
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--anvl-header-h')
    .trim()
  if (raw.endsWith('rem')) return parseFloat(raw) * 16
  if (raw.endsWith('px')) return parseFloat(raw)
  return 64
}

/** Standard pinned + scrubbed trigger, pinned just below the fixed header. */
export function pinTrigger(
  trigger: Element,
  endPct: number,
): ScrollTrigger.Vars {
  return {
    trigger,
    start: () => `top top+=${headerOffsetPx()}`,
    end: `+=${Math.round(endPct)}%`,
    pin: true,
    scrub: 1,
    anticipatePin: 1,
    invalidateOnRefresh: true,
  }
}

/** Premium expo-out feel shared by the hero entrance reveals. */
export const OATH_PREMIUM_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}
