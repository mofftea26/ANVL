import { describe, expect, it } from 'vitest'
import { DEFAULT_PASSPORT_PRODUCT_CONTENT } from '@/features/cms/passportContent/passportContent.zod'
import { resolvePassportContent } from '@/features/passport/lib/resolvePassportContent'
import type { Product } from '@/features/products/types/product.types'

const product = {
  id: 'gid://1',
  slug: 'seamless-tee',
  name: 'Seamless Tee',
  dropName: 'The Oath',
  role: '',
  fit: 'Compression',
  fabric: 'Seamless knit',
  gsm: '240 GSM',
  storytelling: 'Product story fallback.',
  designDetails: ['Flatlock seams'],
  careInstructions: ['Cold wash'],
  colorways: [],
  sizes: ['M'],
  price: 40,
  images: [{ src: 'https://cdn/img.jpg', alt: 'Tee' }],
} as unknown as Product

const mediaIndex = [
  {
    id: 'asset-1',
    path: 'library/macro.webp',
    alt: 'macro',
    mime: 'image/webp',
    w: 100,
    h: 100,
    updatedAt: '2026-07-14',
  },
]

describe('resolvePassportContent', () => {
  it('falls back to product fields when nothing is authored', () => {
    const resolved = resolvePassportContent({
      product,
      passportContent: {},
      pdpContent: null,
      mediaIndex: [],
      productSlug: 'seamless-tee',
    })
    expect(resolved.material.title).toBe('Seamless knit')
    expect(resolved.care.steps).toEqual(['Cold wash'])
    expect(resolved.details.facts).toEqual(['Flatlock seams'])
    expect(resolved.details.story).toBe('Product story fallback.')
    expect(resolved.origin.label).toBe('Forged in Lebanon')
    expect(resolved.piece.gallery[0]?.src).toBe('https://cdn/img.jpg')
  })

  it('authored passport content wins over pdp and product', () => {
    const resolved = resolvePassportContent({
      product,
      passportContent: {
        'seamless-tee': {
          ...DEFAULT_PASSPORT_PRODUCT_CONTENT,
          material: { title: 'Wizard fabric', note: '', macroAsset: 'asset-1' },
          care: { intro: 'Treat it well.', steps: ['Authored step'], asset: '' },
          details: {
            heading: 'From the wizard',
            story: '',
            facts: [],
            funFact: 'Fun!',
            asset: '',
          },
          origin: { label: 'Forged in Beirut', place: 'Beirut', story: '', asset: '' },
        },
      },
      pdpContent: {
        storyHeading: 'PDP heading',
        storyBody: 'PDP story',
        materialTitle: 'PDP fabric',
        materialNote: 'PDP note',
        care: ['PDP step'],
        designDetails: ['PDP detail'],
      },
      mediaIndex,
      productSlug: 'seamless-tee',
    })
    expect(resolved.material.title).toBe('Wizard fabric')
    expect(resolved.material.macroUrl).toContain('library/macro.webp')
    expect(resolved.care.steps).toEqual(['Authored step'])
    expect(resolved.care.intro).toBe('Treat it well.')
    expect(resolved.details.heading).toBe('From the wizard')
    expect(resolved.details.funFact).toBe('Fun!')
    expect(resolved.origin.label).toBe('Forged in Beirut')
    // Unauthored fields still layer down to pdp content.
    expect(resolved.material.note).toBe('PDP note')
    expect(resolved.details.story).toBe('PDP story')
  })

  it('handles a missing product entirely (deleted from the catalog)', () => {
    const resolved = resolvePassportContent({
      product: null,
      passportContent: {},
      pdpContent: null,
      mediaIndex: [],
      productSlug: 'gone',
    })
    expect(resolved.piece.gallery).toEqual([])
    expect(resolved.material.title).toBe('')
    expect(resolved.origin.label).toBe('Forged in Lebanon')
  })
})
