import { describe, expect, it } from 'vitest'
import {
  buildSeoHeadForSiteStaticPath,
  buildSeoMetaFromCmsSource,
  seoContentToMetaSource,
} from '@/features/cms/seoMeta'
import type { SiteSeoContent } from '@/features/cms/siteSeo.local'
import type { SeoContent } from '@/features/cms/types/cms.types'

const baseDoc: SeoContent = {
  title: 'About | ANVL Athletics',
  description: 'Default about description.',
  canonicalPath: '/about',
}

describe('buildSeoHeadForSiteStaticPath / static page overrides', () => {
  it('applies static page metaTitle and metaDescription overrides', () => {
    const site: SiteSeoContent = {
      globalDefaults: {
        metaTitle: 'Global Title',
        metaDescription: 'Global description.',
      },
      staticPages: {
        '/about': {
          metaTitle: 'About Override Title',
          metaDescription: 'About override description.',
        },
      },
    }

    const head = buildSeoHeadForSiteStaticPath('/about', baseDoc, site)
    expect(head.title).toBe('About Override Title')
    expect(head.meta.find((m) => m.name === 'description')?.content).toBe(
      'About override description.',
    )
  })

  it('uses doc title when static patch exists but leaves meta fields empty', () => {
    const site: SiteSeoContent = {
      globalDefaults: {
        metaTitle: 'Global Title',
        metaDescription: 'Global description.',
      },
      staticPages: {
        '/shop': {},
      },
    }

    const doc: SeoContent = {
      title: 'Shop | ANVL Athletics',
      description: 'Shop catalog.',
      canonicalPath: '/shop',
    }

    const head = buildSeoHeadForSiteStaticPath('/shop', doc, site)
    expect(head.title).toBe('Shop | ANVL Athletics')
    expect(head.meta.find((m) => m.name === 'description')?.content).toBe(
      'Shop catalog.',
    )
  })

  it('buildSeoMetaFromCmsSource uses merged source from static overrides', () => {
    const site: SiteSeoContent = {
      globalDefaults: { metaTitle: 'Global' },
      staticPages: {
        '/size-guide': { metaTitle: 'Size Guide Custom' },
      },
    }

    const merged = {
      ...baseDoc,
      canonicalPath: '/size-guide',
      metaTitle: site.staticPages['/size-guide']?.metaTitle,
    }

    const head = buildSeoMetaFromCmsSource(
      seoContentToMetaSource(merged, site.globalDefaults),
      site.globalDefaults,
    )

    expect(head.title).toBe('Size Guide Custom')
  })
})
