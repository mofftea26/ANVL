import { describe, expect, it } from 'vitest'
import {
  FULL_BLEED_STOREFRONT_PATHS,
  isFullBleedStorefrontPath,
  getStorefrontMainClassName,
} from '@/routes/storefrontMainLayout'

describe('getStorefrontMainClassName', () => {
  it('locks main during home entry (no chrome)', () => {
    expect(
      getStorefrontMainClassName({ showChrome: false, isFullBleed: true }),
    ).toContain('fixed inset-0')
  })

  it('does not pad full-bleed routes — sections sit under the fixed header', () => {
    expect(
      getStorefrontMainClassName({ showChrome: true, isFullBleed: true }),
    ).toBeUndefined()
  })

  it('pads standard routes below the fixed header', () => {
    expect(getStorefrontMainClassName({ showChrome: true, isFullBleed: false })).toBe(
      'pt-[var(--anvl-header-h)]',
    )
  })
})

describe('FULL_BLEED_STOREFRONT_PATHS', () => {
  it('covers home and about', () => {
    expect(FULL_BLEED_STOREFRONT_PATHS.has('/')).toBe(true)
    expect(FULL_BLEED_STOREFRONT_PATHS.has('/about')).toBe(true)
    expect(FULL_BLEED_STOREFRONT_PATHS.has('/shop')).toBe(false)
  })
})

describe('isFullBleedStorefrontPath', () => {
  it('covers the exact-match set', () => {
    expect(isFullBleedStorefrontPath('/')).toBe(true)
    expect(isFullBleedStorefrontPath('/about')).toBe(true)
  })

  it('covers every passport token route (the atmosphere paints under the bar)', () => {
    expect(isFullBleedStorefrontPath('/p/abc-123')).toBe(true)
    expect(isFullBleedStorefrontPath('/p/another-token')).toBe(true)
  })

  it('leaves normal routes padded', () => {
    expect(isFullBleedStorefrontPath('/shop')).toBe(false)
    expect(isFullBleedStorefrontPath('/account')).toBe(false)
    // Lookalike prefix must not match.
    expect(isFullBleedStorefrontPath('/products')).toBe(false)
  })
})
