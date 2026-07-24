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

  it('builds material/care/detail cards from the product when nothing is authored', () => {
    const resolved = resolvePdpContent({
      product: makeProduct(),
      pdpContent: {},
      globalAssets: {},
      mediaIndex: [],
    })
    // One legacy-style material card from the product fabric/gsm.
    expect(resolved.materials).toHaveLength(1)
    expect(resolved.materials[0].name).toBe('Heavyweight cotton')
    expect(resolved.careAuthored).toBe(false)
    expect(resolved.careItems.map((i) => i.name)).toEqual(['Wash cold'])
    expect(resolved.details.map((d) => d.title)).toEqual(['Product detail A'])
  })

  it('prefers authored structured materials / care / details as cards', () => {
    const resolved = resolvePdpContent({
      product: makeProduct(),
      pdpContent: {
        tee: {
          ...DEFAULT_PDP_PRODUCT_CONTENT,
          materials: [{ id: 'm1', name: 'Merino', percentage: 60, gsm: 260, image: '' }],
          careItems: [
            { id: 'c1', icon: 'snowflake', name: 'Machine wash cold', value: '', note: '' },
          ],
          details: [{ id: 'd1', title: 'Bonded hem', description: 'No stitch', image: '' }],
        },
      },
      globalAssets: {},
      mediaIndex: [],
    })
    expect(resolved.materials[0]).toMatchObject({ name: 'Merino', percentage: 60, gsm: 260 })
    expect(resolved.careAuthored).toBe(true)
    expect(resolved.careItems[0]).toMatchObject({ name: 'Machine wash cold', icon: 'snowflake' })
    expect(resolved.details[0]).toMatchObject({ title: 'Bonded hem', description: 'No stitch' })
    // Flat views still populated for downstream consumers (passport resolver).
    expect(resolved.designDetails).toEqual(['Bonded hem'])
    expect(resolved.care).toEqual(['Machine wash cold'])
  })

  it('LEGACY: flat pdp_content care/details still render as cards (never lost)', () => {
    const resolved = resolvePdpContent({
      product: makeProduct(),
      pdpContent: {
        tee: {
          ...DEFAULT_PDP_PRODUCT_CONTENT,
          materialTitle: 'Legacy fabric',
          materialNote: 'Legacy note',
          care: ['Legacy wash'],
          designDetails: ['Legacy detail'],
        },
      },
      globalAssets: {},
      mediaIndex: [],
    })
    expect(resolved.materials[0].name).toBe('Legacy fabric')
    expect(resolved.materials[0].note).toBe('Legacy note')
    expect(resolved.careItems.map((i) => i.name)).toEqual(['Legacy wash'])
    expect(resolved.details.map((d) => d.title)).toEqual(['Legacy detail'])
  })
})
