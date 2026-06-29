import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SHOP_CONFIG,
  parseShopConfig,
} from '@/features/cms/shop/shopExperience.zod'

describe('parseShopConfig', () => {
  it('returns full defaults for nullish / non-object input', () => {
    expect(parseShopConfig(undefined)).toEqual(DEFAULT_SHOP_CONFIG)
    expect(parseShopConfig(null)).toEqual(DEFAULT_SHOP_CONFIG)
    expect(parseShopConfig('nope')).toEqual(DEFAULT_SHOP_CONFIG)
    expect(parseShopConfig([])).toEqual(DEFAULT_SHOP_CONFIG)
  })

  it('merges a partial blob over defaults', () => {
    const cfg = parseShopConfig({ heading: 'Custom Armory', desktopColumns: 4 })
    expect(cfg.heading).toBe('Custom Armory')
    expect(cfg.desktopColumns).toBe(4)
    // Untouched keys keep their defaults.
    expect(cfg.cardStyle).toBe(DEFAULT_SHOP_CONFIG.cardStyle)
    expect(cfg.intro).toBe(DEFAULT_SHOP_CONFIG.intro)
  })

  it('falls back to the field default for invalid values', () => {
    const cfg = parseShopConfig({
      gridDensity: 'ultra', // invalid enum
      desktopColumns: 7, // invalid literal
      animationDurationMultiplier: 99, // out of range
      cardRadius: -10, // out of range
    })
    expect(cfg.gridDensity).toBe(DEFAULT_SHOP_CONFIG.gridDensity)
    expect(cfg.desktopColumns).toBe(DEFAULT_SHOP_CONFIG.desktopColumns)
    expect(cfg.animationDurationMultiplier).toBe(
      DEFAULT_SHOP_CONFIG.animationDurationMultiplier,
    )
    expect(cfg.cardRadius).toBe(DEFAULT_SHOP_CONFIG.cardRadius)
  })

  it('keeps valid nested copy objects', () => {
    const cfg = parseShopConfig({
      emptyState: { title: 'Empty', body: 'Nothing here' },
    })
    expect(cfg.emptyState).toEqual({ title: 'Empty', body: 'Nothing here' })
  })

  it('fills full pdp defaults when absent', () => {
    expect(parseShopConfig({}).pdp).toEqual(DEFAULT_SHOP_CONFIG.pdp)
  })

  it('merges a partial pdp blob and rejects invalid values', () => {
    const cfg = parseShopConfig({
      pdp: { showRelated: false, relatedCount: 99, animationIntensity: 'nope' },
    })
    expect(cfg.pdp.showRelated).toBe(false)
    // Invalid values fall back to their defaults.
    expect(cfg.pdp.relatedCount).toBe(DEFAULT_SHOP_CONFIG.pdp.relatedCount)
    expect(cfg.pdp.animationIntensity).toBe(DEFAULT_SHOP_CONFIG.pdp.animationIntensity)
    // Untouched keys keep defaults.
    expect(cfg.pdp.showMaterials).toBe(true)
  })
})
