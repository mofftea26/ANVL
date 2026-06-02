import { describe, expect, it } from 'vitest'

import { publicLandingActsHeroSlotOnly } from '@/features/cms/landing/landingActs.normalize'

describe('publicLandingActsHeroSlotOnly', () => {
  it('returns exactly one hero row with landing-slot-hero id', () => {
    const acts = publicLandingActsHeroSlotOnly()
    expect(acts).toHaveLength(1)
    expect(acts[0]).toMatchObject({
      id: 'landing-slot-hero',
      nature: 'hero',
      preset: 'cinematicScrollHero',
      slotKey: 'hero',
      enabled: true,
    })
  })
})
