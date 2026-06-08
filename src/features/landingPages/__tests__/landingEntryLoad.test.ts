import { describe, expect, it } from 'vitest'
import {
  criticalLandingAssetUrls,
  resolveLoadingEmblemUrl,
  resolveThemedSvgMarkup,
} from '../landingEntryLoad'

describe('landingEntryLoad', () => {
  it('resolves loading emblem with fallback chain', () => {
    expect(
      resolveLoadingEmblemUrl({
        loadingEmblem: 'https://cdn/a.svg',
        dropLogo: 'https://cdn/b.svg',
      }),
    ).toBe('https://cdn/a.svg')

    expect(
      resolveLoadingEmblemUrl({ dropLogo: 'https://cdn/b.svg' }),
    ).toBe('https://cdn/b.svg')
  })

  it('resolveThemedSvgMarkup returns bundled markup for default oath shape', async () => {
    const markup = await resolveThemedSvgMarkup('/brand/the-oath-shape.svg')
    expect(markup).toContain('<svg')
    expect(markup).toContain('currentColor')
  })

  it('resolveThemedSvgMarkup returns null for non-SVG urls', async () => {
    expect(await resolveThemedSvgMarkup('https://cdn/hero.png')).toBeNull()
    expect(await resolveThemedSvgMarkup('')).toBeNull()
  })

  it('collects critical asset urls without duplicates', () => {
    const urls = criticalLandingAssetUrls({
      loadingEmblem: 'https://cdn/emblem.svg',
      heroPoster: 'https://cdn/poster.jpg',
      heroMedia: 'https://cdn/hero.mp4',
    })
    expect(urls).toEqual([
      'https://cdn/emblem.svg',
      'https://cdn/poster.jpg',
      'https://cdn/hero.mp4',
    ])
  })
})
