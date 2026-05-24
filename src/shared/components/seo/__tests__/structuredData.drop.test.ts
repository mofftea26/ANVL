import { describe, expect, it } from 'vitest'
import type { Drop } from '@/features/drops/drop.types'
import { dropStructuredDataJsonLd } from '@/shared/components/seo/structuredData'

const drop = {
  id: 'drop-1',
  slug: 'the-oath',
  title: 'The Oath',
  seo: {
    title: 'The Oath | ANVL',
    description: 'Drop 01 campaign.',
    ogImage: '/brand/og-default.svg',
    structuredDataType: 'CollectionPage' as const,
  },
} as Drop

describe('dropStructuredDataJsonLd', () => {
  it('emits CollectionPage JSON-LD for drop campaigns', () => {
    expect(
      dropStructuredDataJsonLd('CollectionPage', drop),
    ).toMatchInlineSnapshot(`
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "description": "Drop 01 campaign.",
        "image": "https://www.anvlathletics.com/brand/og-default.svg",
        "name": "The Oath | ANVL",
        "url": "https://www.anvlathletics.com/drop/the-oath",
      }
    `)
  })

  it('emits BreadcrumbList JSON-LD with home + drop trail', () => {
    expect(
      dropStructuredDataJsonLd('BreadcrumbList', drop),
    ).toMatchInlineSnapshot(`
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "item": "https://www.anvlathletics.com/",
            "name": "Home",
            "position": 1,
          },
          {
            "@type": "ListItem",
            "item": "https://www.anvlathletics.com/drop/the-oath",
            "name": "The Oath",
            "position": 2,
          },
        ],
      }
    `)
  })

  it('returns null for Product without catalog context', () => {
    expect(dropStructuredDataJsonLd('Product', drop)).toBeNull()
  })
})
