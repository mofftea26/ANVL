import { describe, expect, it } from 'vitest'
import {
  ABOUT_CHAPTER_SPAN_VH,
  ABOUT_SCROLL,
  aboutScrollToEase,
} from '../motion/aboutScrollTiming'

/**
 * The clock is pure data — these are the invariants the motion builders, the
 * altar prefetch, and the strike's scroll answer all depend on but cannot
 * enforce themselves.
 */
describe('aboutScrollTiming', () => {
  it('gives every pin real scrub room', () => {
    expect(ABOUT_SCROLL.heroPinPct).toBeGreaterThan(0)
    expect(ABOUT_SCROLL.chapterPinPct).toBeGreaterThan(0)
    expect(ABOUT_SCROLL.altarPinPct).toBeGreaterThan(0)
  })

  it('orders the chapter beats: materialize → hold → dissolve', () => {
    expect(ABOUT_SCROLL.materializeEnd).toBeGreaterThan(0)
    expect(ABOUT_SCROLL.holdEnd).toBeGreaterThan(ABOUT_SCROLL.materializeEnd)
    expect(ABOUT_SCROLL.holdEnd).toBeLessThan(1)
  })

  it('prefetches the altar at least two chapters out', () => {
    expect(ABOUT_SCROLL.prefetchLeadChapters).toBeGreaterThanOrEqual(2)
  })

  it('derives the chapter span from the pin length', () => {
    expect(ABOUT_CHAPTER_SPAN_VH).toBe(100 + ABOUT_SCROLL.chapterPinPct)
  })

  it('gives the strike answer an eased, non-instant journey', () => {
    expect(ABOUT_SCROLL.scrollToDurationS).toBeGreaterThan(0.5)
    // The ease is a real 0→1 curve: anchored at both ends, monotonic.
    expect(aboutScrollToEase(0)).toBeCloseTo(0)
    expect(aboutScrollToEase(1)).toBeCloseTo(1)
    let prev = 0
    for (let t = 0.1; t <= 1.001; t += 0.1) {
      const v = aboutScrollToEase(t)
      expect(v).toBeGreaterThanOrEqual(prev)
      prev = v
    }
  })
})
