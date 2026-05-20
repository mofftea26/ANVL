import { describe, expect, it, vi } from 'vitest'
import { composeLandingPageFromDrop } from '@/features/cms/landing/composeLandingPageFromDrop'
import { SEED_DROP, SEED_WEBSITE_LAYOUT } from '@/features/cms/api/seedSnapshots'
import {
  getResolvedStorefrontLandingCmsSync,
  resolveStorefrontActiveDrop,
} from '@/features/cms/runtime/storefrontCmsSync'

vi.mock('@/features/cms/api/cmsPersistenceMode', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@/features/cms/api/cmsPersistenceMode')
  >()
  return {
    ...actual,
    shouldStorefrontUseLocalCmsFallback: vi.fn(() => true),
  }
})

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

  it('uses seed drop when Supabase is configured (no local admin fallback)', async () => {
    const mode = await import('@/features/cms/api/cmsPersistenceMode')
    vi.mocked(mode.shouldStorefrontUseLocalCmsFallback).mockReturnValue(false)

    const landing = getResolvedStorefrontLandingCmsSync()
    const expected = composeLandingPageFromDrop(
      structuredClone(SEED_DROP),
      structuredClone(SEED_WEBSITE_LAYOUT),
    )
    expect(landing.hero.title).toBe(expected.hero.title)
    expect(resolveStorefrontActiveDrop()?.id).toBe(SEED_DROP.id)
  })
})
