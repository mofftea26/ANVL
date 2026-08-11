import { gsap } from '@/shared/lib/gsap'
import { ABOUT_SCROLL } from './aboutScrollTiming'

export type Selector = (sel: string) => HTMLElement[]

/**
 * Deliberate 20-line clone of TheOathLanding's `oathMotionHelpers` rather than
 * a cross-feature import — `landingPages/**` and `about/**` are independent
 * features, and coupling About's film to the Oath's module graph for two tiny
 * helpers is the wrong trade.
 */
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
    scrub: ABOUT_SCROLL.scrubSmoothing,
    anticipatePin: 1,
    invalidateOnRefresh: true,
  }
}
