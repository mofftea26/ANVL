/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { LandingPageCmsContent } from '@/features/cms/landing/landingPageCms.types'
import type { LandingAct } from '@/features/cms/landing/landingActs.types'
import { landingCmsDefaults } from '@/features/admin/landing-cms/landingCms.defaults'
import {
  PublicLandingActs,
  resolveProductShowcaseProducts,
} from '@/features/marketing/public-landing/PublicLandingActs'
import type { Product } from '@/features/products/types/product.types'

vi.mock('@/features/marketing/act-presets/hero/TheOathCinematic', () => ({
  TheOathCinematicPreset: ({
    landing,
    row,
  }: {
    landing: LandingPageCmsContent
    row?: LandingAct
  }) => {
    const hero = row?.eyebrow ?? landing.hero.badgeText
    const title = row?.title ?? landing.hero.title
    return (
      <div data-testid="hero">
        {hero} — {title}
      </div>
    )
  },
}))

const piecesGridProducts = vi.hoisted(() => vi.fn())

vi.mock('@/features/marketing/act-presets/productShowcase/ThreeCardEditorial', async () => {
  const { resolveProductShowcaseProducts } = await import(
    '@/features/marketing/act-presets/resolveProductShowcaseProducts'
  )
  return {
    ThreeCardEditorialPreset: ({
      products,
      row,
    }: {
      products: Product[]
      row?: LandingAct
    }) => {
      piecesGridProducts(resolveProductShowcaseProducts(products, row?.productIds))
      return <div data-testid="pieces" />
    },
  }
})

function minimalLanding(
  overrides: Partial<LandingPageCmsContent> = {},
): LandingPageCmsContent {
  return {
    ...landingCmsDefaults,
    landingActs: [
      {
        id: 'act-hero-1',
        nature: 'hero',
        preset: 'theOathCinematic',
        sortOrder: 0,
        enabled: true,
        slotKey: 'hero',
        animation: { enabled: true, desktopOnly: true, type: 'fade', intensity: 'standard' },
      },
    ],
    ...overrides,
  }
}

const sampleProducts: Product[] = Array.from({ length: 8 }, (_, i) => ({
  id: `prod-${i + 1}`,
  slug: `product-${i + 1}`,
  name: `Product ${i + 1}`,
  dropName: 'Drop 01',
  role: 'Top',
  fit: 'Regular',
  fabric: 'Cotton',
  gsm: '280',
  storytelling: '',
  designDetails: [],
  careInstructions: [],
  price: 100,
  images: [],
  colorways: [],
  sizes: [],
  shop: {
    storefrontStatus: 'available',
    sourceType: 'drop',
    dropId: null,
    dropSlug: null,
    compareAtPrice: null,
    listPrice: 100,
    currency: 'USD',
    category: 'tops',
    availabilityByColorAndSize: {},
    imagesByColorName: {},
  },
}))

describe('resolveProductShowcaseProducts', () => {
  it('slices six products when act productIds is empty', () => {
    expect(resolveProductShowcaseProducts(sampleProducts).map((p) => p.id)).toEqual([
      'prod-1',
      'prod-2',
      'prod-3',
      'prod-4',
      'prod-5',
      'prod-6',
    ])
  })

  it('preserves act productIds order and skips unknown ids', () => {
    expect(
      resolveProductShowcaseProducts(sampleProducts, [
        'prod-8',
        'missing',
        'prod-3',
      ]).map((p) => p.id),
    ).toEqual(['prod-8', 'prod-3'])
  })
})

describe('PublicLandingActs', () => {
  it('overlays hero copy from landing.dropActs on the storefront', async () => {
    const dropActs: LandingAct[] = [
      {
        id: 'act-hero-1',
        nature: 'hero',
        preset: 'theOathCinematic',
        isEnabled: true,
        sortOrder: 0,
        eyebrow: 'Drop 02',
        title: 'FORGED HEADLINE',
        subtitle: 'From acts builder',
      },
    ]

    render(
      <PublicLandingActs
        landing={minimalLanding({ dropActs })}
        products={[]}
      />,
    )

    expect(await screen.findByTestId('hero')).toHaveTextContent(
      'Drop 02 — FORGED HEADLINE',
    )
  })

  it('passes act productIds to PiecesGrid when set', async () => {
    piecesGridProducts.mockClear()
    const dropActs: LandingAct[] = [
      {
        id: 'act-pieces-1',
        nature: 'productShowcase',
        preset: 'gridSix',
        isEnabled: true,
        sortOrder: 0,
        productIds: ['prod-8', 'prod-2'],
      },
    ]

    render(
      <PublicLandingActs
        landing={minimalLanding({
          landingActs: [
            {
              id: 'act-pieces-1',
              nature: 'productShowcase',
              preset: 'gridSix',
              sortOrder: 0,
              enabled: true,
              slotKey: 'pieces',
              animation: {
                enabled: true,
                desktopOnly: true,
                type: 'fade',
                intensity: 'standard',
              },
            },
          ],
          dropActs,
        })}
        products={sampleProducts}
      />,
    )

    expect(await screen.findByTestId('pieces')).toBeInTheDocument()
    expect(piecesGridProducts).toHaveBeenCalled()
    const passed = piecesGridProducts.mock.calls.at(-1)?.[0] as Product[]
    expect(passed.map((p) => p.id)).toEqual(['prod-8', 'prod-2'])
  })
})
