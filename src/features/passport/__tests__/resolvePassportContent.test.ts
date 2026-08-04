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
          material: { title: 'Wizard fabric', note: '', macroAsset: 'asset-1', materials: [] },
          care: {
            intro: 'Treat it well.',
            steps: ['Authored step'],
            asset: '',
            symbols: ['no-bleach'],
            notes: ['Bleach eats elastane.'],
            careItems: [],
          },
          details: {
            heading: 'From the wizard',
            story: '',
            facts: [],
            funFact: 'Fun!',
            asset: '',
          },
          origin: {
            label: 'Forged in Beirut',
            place: 'Beirut',
            story: '',
            asset: '',
            madeIn: 'lebanon',
            designedIn: 'portugal',
          },
        },
      },
      pdpContent: {
        storyHeading: 'PDP heading',
        storyBody: 'PDP story',
        materialTitle: 'PDP fabric',
        materialNote: 'PDP note',
        care: ['PDP step'],
        designDetails: ['PDP detail'],
        materials: [],
        careItems: [],
        careAuthored: false,
        details: [],
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

  it('resolves structured materials + care items, else falls back to the PDP', () => {
    const authored = resolvePassportContent({
      product,
      passportContent: {
        'seamless-tee': {
          ...DEFAULT_PASSPORT_PRODUCT_CONTENT,
          material: {
            title: '',
            note: '',
            macroAsset: '',
            materials: [{ id: 'm1', name: 'Merino', percentage: 100, gsm: 210, image: '' }],
          },
          care: {
            intro: '',
            steps: [],
            asset: '',
            symbols: [],
            notes: [],
            careItems: [
              { id: 'c1', icon: 'do-not-bleach', name: 'Do not bleach', value: '', note: '' },
            ],
          },
        },
      },
      pdpContent: null,
      mediaIndex: [],
      productSlug: 'seamless-tee',
    })
    expect(authored.material.materials[0]?.name).toBe('Merino')
    expect(authored.care.careItems[0]?.icon).toBe('do-not-bleach')

    // Nothing authored on the passport → inherit the PDP's structured lists.
    const inherited = resolvePassportContent({
      product,
      passportContent: {},
      pdpContent: {
        storyHeading: '',
        storyBody: '',
        materialTitle: '',
        materialNote: '',
        care: [],
        designDetails: [],
        materials: [{ id: 'pm', name: 'PDP cotton', percentage: 90, gsm: 240 }],
        careItems: [{ id: 'pc', icon: 'iron-low', name: 'Iron low', value: '', note: '' }],
        careAuthored: true,
        details: [],
      },
      mediaIndex: [],
      productSlug: 'seamless-tee',
    })
    expect(inherited.material.materials[0]?.name).toBe('PDP cotton')
    expect(inherited.care.careItems[0]?.icon).toBe('iron-low')
  })

  it('resolves the blueprint callouts and drops the ones with nothing to say', () => {
    const resolved = resolvePassportContent({
      product,
      passportContent: {
        'seamless-tee': {
          ...DEFAULT_PASSPORT_PRODUCT_CONTENT,
          blueprint: {
            heading: '',
            intro: '  Every seam, marked.  ',
            features: [
              { code: 'j', title: 'Hem wrapped label', body: '  Woven, not printed. ' },
              // Untitled callouts carry nothing readable — dropped.
              { code: 'z', title: '   ', body: 'Orphan' },
            ],
            points: [],
          },
        },
      },
      pdpContent: null,
      mediaIndex,
      productSlug: 'seamless-tee',
    })
    expect(resolved.blueprint.heading).toBe('Blueprint')
    expect(resolved.blueprint.intro).toBe('Every seam, marked.')
    expect(resolved.blueprint.features).toEqual([
      { code: 'j', title: 'Hem wrapped label', body: 'Woven, not printed.' },
    ])
  })

  it('letters a blank callout code so its chip still reads', () => {
    const resolved = resolvePassportContent({
      product,
      passportContent: {
        'seamless-tee': {
          ...DEFAULT_PASSPORT_PRODUCT_CONTENT,
          blueprint: {
            heading: '',
            intro: '',
            features: [
              { code: '', title: 'First', body: '' },
              { code: '', title: 'Second', body: '' },
            ],
            points: [],
          },
        },
      },
      pdpContent: null,
      mediaIndex: [],
      productSlug: 'seamless-tee',
    })
    expect(resolved.blueprint.features.map((f) => f.code)).toEqual(['a', 'b'])
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
