import { describe, expect, it } from 'vitest'
import {
  CINEMATIC_SCROLL_TOP_EPSILON,
  isCinematicScrollAtTop,
  resolveActiveSectionIndex,
} from '@/features/marketing/cinematic-hero/cinematicHero.visibility'

describe('cinematicHero.visibility', () => {
  it('treats progress at or below epsilon as scroll top', () => {
    expect(isCinematicScrollAtTop(0)).toBe(true)
    expect(isCinematicScrollAtTop(CINEMATIC_SCROLL_TOP_EPSILON)).toBe(true)
    expect(isCinematicScrollAtTop(CINEMATIC_SCROLL_TOP_EPSILON + 0.0001)).toBe(false)
  })

  it('always resolves active section index 0 at scroll top', () => {
    expect(resolveActiveSectionIndex(0, 4)).toBe(0)
    expect(resolveActiveSectionIndex(CINEMATIC_SCROLL_TOP_EPSILON, 4)).toBe(0)
  })

  it('maps mid-scroll progress to the correct beat index', () => {
    expect(resolveActiveSectionIndex(0.5, 4)).toBe(2)
    expect(resolveActiveSectionIndex(0.99, 3)).toBe(2)
  })
})
