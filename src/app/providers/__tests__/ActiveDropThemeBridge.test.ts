import { describe, expect, it } from 'vitest'
import { createDefaultGlobalBrandSettings } from '@/features/admin/global-brand/globalBrand.defaults'
import { previewLoadingSrc } from '@/app/providers/ActiveDropThemeBridge'

describe('previewLoadingSrc', () => {
  const globalBrand = {
    ...createDefaultGlobalBrandSettings(),
    emblemFallbackUrl: '/global/emblem.svg',
    loadingEmblemFallbackUrl: '/global/loading.svg',
  }

  it('prefers drop loading emblem over global fallbacks', () => {
    const src = previewLoadingSrc(
      {
        visuals: {
          emblemImageUrl: '/drop/emblem.svg',
          loadingEmblemUrl: '/drop/loading.svg',
        },
      },
      globalBrand,
    )
    expect(src).toBe('/drop/loading.svg')
  })

  it('falls back to drop emblem when loading emblem is empty', () => {
    const src = previewLoadingSrc(
      {
        visuals: {
          emblemImageUrl: '/drop/emblem.svg',
          loadingEmblemUrl: '',
        },
      },
      globalBrand,
    )
    expect(src).toBe('/drop/emblem.svg')
  })

  it('uses global fallbacks when drop visuals are empty', () => {
    const src = previewLoadingSrc(
      {
        visuals: { emblemImageUrl: '', loadingEmblemUrl: '' },
      },
      globalBrand,
    )
    expect(src).toBe('/global/loading.svg')
  })
})
