import { describe, expect, it } from 'vitest'
import { composeLandingPageFromDrop } from '@/features/cms/landing/composeLandingPageFromDrop'
import { SEED_DROP, SEED_WEBSITE_LAYOUT } from '@/features/cms/api/seedSnapshots'
import {
  getResolvedStorefrontLandingCmsSync,
} from '@/features/cms/runtime/storefrontCmsSync'

describe('storefrontCmsSync', () => {
  it('forceSsrSnapshot matches compose(SEED_DROP, SEED_WEBSITE_LAYOUT)', () => {
    const expected = composeLandingPageFromDrop(
      structuredClone(SEED_DROP),
      structuredClone(SEED_WEBSITE_LAYOUT),
    )
    expect(getResolvedStorefrontLandingCmsSync({ forceSsrSnapshot: true })).toEqual(
      expected,
    )
  })

  it('ssr landing snapshot exposes active-drop navigation emblem metadata', () => {
    const landing = getResolvedStorefrontLandingCmsSync({ forceSsrSnapshot: true })
    expect(landing.navigation.activeDropEmblemSrc?.startsWith('/')).toBe(true)
    expect((landing.navigation.activeDropEmblemAlt ?? '').length).toBeGreaterThan(0)
  })
})
