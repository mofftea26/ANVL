import { describe, expect, it } from 'vitest'
import type { Product } from '@/features/products/types/product.types'
import { DEFAULT_PDP_PRODUCT_CONTENT } from '@/features/cms/pdpContent/pdpContent.zod'
import { resolvePdpContent } from '@/features/products/pdp/resolvePdpContent'

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p',
    slug: 'tee',
    name: 'Tee',
    dropName: 'The Oath',
    role: '',
    fit: '',
    fabric: 'Heavyweight cotton',
    gsm: '240 GSM',
    storytelling: 'Product story.',
    designDetails: ['Product detail A'],
    careInstructions: ['Wash cold'],
    colorways: [],
    sizes: [],
    price: 59,
    images: [],
    ...overrides,
  }
}

describe('resolvePdpContent', () => {
  it('layers CMS copy over product fields, blanks fall back', () => {
    const product = makeProduct()
    const resolved = resolvePdpContent({
      product,
      pdpContent: {
        tee: {
          ...DEFAULT_PDP_PRODUCT_CONTENT,
          storyBody: 'Custom story',
          designDetails: ['CMS A', 'CMS B'],
        },
      },
      globalAssets: {},
      mediaIndex: [],
    })
    expect(resolved.storyBody).toBe('Custom story') // CMS wins
    expect(resolved.materialTitle).toBe('Heavyweight cotton') // blank → product
    expect(resolved.care).toEqual(['Wash cold']) // blank → product
    expect(resolved.designDetails).toEqual(['CMS A', 'CMS B']) // CMS wins
    expect(resolved.storyHeading).toBe('The piece') // blank → default
  })

  it('falls back to the global asset slot when no per-product media id', () => {
    const resolved = resolvePdpContent({
      product: makeProduct(),
      pdpContent: {},
      globalAssets: { materialMacro: '/global/macro.webp' },
      mediaIndex: [],
    })
    expect(resolved.materialMacro).toBe('/global/macro.webp')
    expect(resolved.lifestyleImage).toBeUndefined()
  })

  it('filters blank lines out of CMS care / details', () => {
    const resolved = resolvePdpContent({
      product: makeProduct(),
      pdpContent: { tee: { ...DEFAULT_PDP_PRODUCT_CONTENT, care: ['  ', 'Hang dry', ''] } },
      globalAssets: {},
      mediaIndex: [],
    })
    expect(resolved.care).toEqual(['Hang dry'])
  })
})
