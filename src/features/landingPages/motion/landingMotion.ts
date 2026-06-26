import { gsap, SplitText } from '@/shared/lib/gsap'

/**
 * Shared, framework-agnostic GSAP helpers for code-owned landing pages. Mirrors
 * the per-page helpers The Oath uses, promoted so new experiences (Theoath
 * Modern) reuse one implementation instead of copying scroll math.
 */

export type LandingSelector = (sel: string) => HTMLElement[]

export function scopedSelector(host: HTMLElement): LandingSelector {
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
export function pinTrigger(trigger: Element, endPct: number): ScrollTrigger.Vars {
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

/** Premium expo-out feel shared by entrance reveals. */
export const LANDING_PREMIUM_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

const MAGNET_STRENGTH = 0.3
const MAGNET_RADIUS_PX = 10

/**
 * Magnetic hover for every `[data-tm-magnetic]` / `[data-om-magnetic]` element
 * under `host` — leans toward the pointer inside its bounds and springs back on
 * leave. Fine-pointer desktop only (the caller gates); returns a disposer for
 * `mm.revert()`.
 */
export function attachLandingMagnetics(host: HTMLElement): () => void {
  const disposers: Array<() => void> = []

  for (const el of gsap.utils.toArray<HTMLElement>(
    '[data-tm-magnetic], [data-om-magnetic]',
    host,
  )) {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' })

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const relX = e.clientX - (rect.left + rect.width / 2)
      const relY = e.clientY - (rect.top + rect.height / 2)
      xTo(gsap.utils.clamp(-MAGNET_RADIUS_PX, MAGNET_RADIUS_PX, relX * MAGNET_STRENGTH))
      yTo(gsap.utils.clamp(-MAGNET_RADIUS_PX, MAGNET_RADIUS_PX, relY * MAGNET_STRENGTH))
    }
    const onLeave = () => {
      xTo(0)
      yTo(0)
    }

    el.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerleave', onLeave, { passive: true })
    disposers.push(() => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      gsap.set(el, { clearProps: 'x,y' })
    })
  }

  return () => {
    for (const dispose of disposers) dispose()
  }
}

/**
 * Split helper around GSAP SplitText (free since 3.13). `mask` wraps each unit in
 * an overflow-clipped span (masked-reveal look); SplitText keeps the source text
 * readable to assistive tech. Always call `revert` in the matchMedia cleanup.
 */
export function splitUnits(
  el: HTMLElement,
  type: 'chars' | 'words' | 'lines',
): { units: HTMLElement[]; revert: () => void } {
  const split = SplitText.create(el, { type, mask: type })
  const units = (
    type === 'chars' ? split.chars : type === 'words' ? split.words : split.lines
  ) as HTMLElement[]
  return { units, revert: () => split.revert() }
}
