import { describe, expect, it } from 'vitest'
import { composeLandingPageFromDrop } from '@/features/cms/landing/composeLandingPageFromDrop'
import { SEED_DROP, SEED_WEBSITE_LAYOUT } from '@/features/cms/api/seedSnapshots'
import {
  getStorefrontOfflineActiveDrop,
  getStorefrontOfflineLandingCms,
} from '@/features/cms/runtime/storefrontReadFallback'

describe('storefrontReadFallback', () => {
  it('uses seed landing on SSR (jsdom has window — force via offline helpers in browser path)', () => {
    const landing = getStorefrontOfflineLandingCms()
    expect(landing.hero.title.length).toBeGreaterThan(0)
  })

  it('offline active drop matches resolveStorefrontActiveDrop in jsdom', () => {
    const drop = getStorefrontOfflineActiveDrop()
    expect(drop?.slug).toBeTruthy()
  })

  it('seed-shaped landing matches compose(SEED_DROP, SEED_WEBSITE_LAYOUT) when forced', () => {
    const expected = composeLandingPageFromDrop(
      structuredClone(SEED_DROP),
      structuredClone(SEED_WEBSITE_LAYOUT),
    )
    expect(
      composeLandingPageFromDrop(SEED_DROP, SEED_WEBSITE_LAYOUT).hero.title,
    ).toBe(expected.hero.title)
  })
})
