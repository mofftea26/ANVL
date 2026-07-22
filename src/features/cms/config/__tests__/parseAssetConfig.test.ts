import { describe, expect, it } from 'vitest'
import { DEFAULT_ASSET_CONFIG, parseAssetConfig } from '../cmsSiteConfig.zod'

describe('parseAssetConfig', () => {
  it('parses a fully-valid modern blob', () => {
    const parsed = parseAssetConfig({
      general: { logo: 'media-1' },
      drops: { 'the-oath': { heroImage: 'media-2' } },
      pages: { shop: { ogImage: 'media-3' } },
    })
    expect(parsed.general.logo).toBe('media-1')
    expect(parsed.drops['the-oath'].heroImage).toBe('media-2')
    expect(parsed.pages.shop.ogImage).toBe('media-3')
  })

  it('keeps `pages`/`drops` when a modern blob is merely missing `general`', () => {
    // Regression (G6 hardening): the legacy branch used to reinterpret ANY blob
    // without a `general` key as a flat general map, silently discarding
    // drops/pages and polluting general with object values.
    const parsed = parseAssetConfig({
      pages: { shop: { heroImage: 'media-shop' } },
      drops: { 'the-oath': { heroImage: 'media-oath' } },
    })
    expect(parsed.general).toEqual({})
    expect(parsed.pages.shop.heroImage).toBe('media-shop')
    expect(parsed.drops['the-oath'].heroImage).toBe('media-oath')
  })

  it('accepts the true legacy flat shape (no structured keys, all-string values)', () => {
    const parsed = parseAssetConfig({ logo: 'media-1', heroImage: 'media-2' })
    expect(parsed).toEqual({
      general: { logo: 'media-1', heroImage: 'media-2' },
      drops: {},
      pages: {},
    })
  })

  it('rejects a flat-looking blob with non-string values instead of mangling it', () => {
    const parsed = parseAssetConfig({ logo: 'media-1', junk: { nested: true } })
    expect(parsed).toEqual(DEFAULT_ASSET_CONFIG)
  })

  it('defaults invalid buckets on a partially-broken modern blob', () => {
    const parsed = parseAssetConfig({
      general: { logo: 'media-1' },
      drops: 'not-a-record',
    })
    expect(parsed.general.logo).toBe('media-1')
    expect(parsed.drops).toEqual({})
    expect(parsed.pages).toEqual({})
  })

  it('falls back to defaults for non-object input', () => {
    expect(parseAssetConfig(null)).toEqual(DEFAULT_ASSET_CONFIG)
    expect(parseAssetConfig([1, 2])).toEqual(DEFAULT_ASSET_CONFIG)
    expect(parseAssetConfig('nope')).toEqual(DEFAULT_ASSET_CONFIG)
  })
})
