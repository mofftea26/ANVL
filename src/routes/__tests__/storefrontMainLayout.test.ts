import { describe, expect, it } from 'vitest'
import {
  FULL_BLEED_STOREFRONT_PATHS,
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
