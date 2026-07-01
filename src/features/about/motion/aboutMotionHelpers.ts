import { gsap } from '@/shared/lib/gsap'

export type Selector = (sel: string) => HTMLElement[]

export function scopedSelector(host: HTMLElement): Selector {
  return (sel) => gsap.utils.toArray<HTMLElement>(sel, host)
}

/** Standard pinned + scrubbed trigger. Sections are full-screen height and the
 * header is a transparent overlay, so they pin at the very top of the viewport
 * (the section fills the screen behind the bar — no header-height gap). */
export function pinTrigger(trigger: Element, endPct: number): ScrollTrigger.Vars {
  return {
    trigger,
    start: 'top top',
    end: `+=${Math.round(endPct)}%`,
    pin: true,
    scrub: 1,
    anticipatePin: 1,
    invalidateOnRefresh: true,
  }
}
