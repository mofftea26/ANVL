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

vi.mock('@/features/marketing/components/HeroForgeSequence', () => ({
  HeroForgeSequence: ({
    title,
    badgeText,
  }: {
    title: string
    badgeText: string
  }) => (
    <div data-testid="hero">
      {badgeText} — {title}
    </div>
  ),
}))

vi.mock('@/features/marketing/components/OathStampSequence', () => ({
  OathStampSequence: () => <div data-testid="manifesto" />,
}))
vi.mock('@/features/marketing/components/DropRevealSection', () => ({
  DropRevealSection: () => null,
}))
const piecesGridProducts = vi.fn()

vi.mock('@/features/marketing/components/PiecesGrid', () => ({
  PiecesGrid: ({ products }: { products: { id: string }[] }) => {
    piecesGridProducts(products)
    return <div data-testid="pieces" />
  },
}))
vi.mock('@/features/marketing/components/MaterialsMarquee', () => ({
  MaterialsMarquee: () => null,
}))
vi.mock('@/features/marketing/components/WaitlistSection', () => ({
  WaitlistSection: () => null,
}))

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
