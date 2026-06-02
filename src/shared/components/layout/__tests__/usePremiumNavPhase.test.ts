import { describe, expect, it, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCinematicHeroPhaseStore } from '@/features/marketing/cinematic-hero/cinematicHeroPhase.store'
import { usePremiumNavPhase } from '@/shared/components/layout/usePremiumNavPhase'

describe('usePremiumNavPhase', () => {
  beforeEach(() => {
    useCinematicHeroPhaseStore.getState().reset()
  })

  it('defaults to solid commerce chrome', () => {
    const { result } = renderHook(() => usePremiumNavPhase())
    expect(result.current.phase).toBe('commerce')
    expect(result.current.topbarVariant).toBe('solid')
    expect(result.current.showSideRail).toBe(false)
  })

  it('enables side rail in cinematic auto mode with sections', () => {
    useCinematicHeroPhaseStore.setState({
      phase: 'cinematic',
      navMode: 'auto',
      sections: [
        {
          id: 'a',
          isEnabled: true,
          sortOrder: 0,
        },
      ],
    })
    const { result } = renderHook(() => usePremiumNavPhase())
    expect(result.current.topbarVariant).toBe('transparent')
    expect(result.current.showSideRail).toBe(true)
  })
})
