import { describe, expect, it } from 'vitest'
import { createDefaultGlobalBrandSettings } from '@/features/admin/global-brand/globalBrand.defaults'
import { createDefaultWebsiteLayout } from '@/features/admin/website-layout/websiteLayout.defaults'
import {
  getSupabasePublicationAnonClient,
  normalizeStorefrontPublicationRow,
} from '@/features/cms/api/publicStorefrontPublication'
import { parseSiteSeoUnknown } from '@/features/cms/siteSeo.local'
import { DEFAULT_SITE_HOMEPAGE } from '@/features/cms/siteHomepage.settings'
import type { AdminProduct } from '@/features/admin/products/products.types'

const STAMP = '2026-01-01T00:00:00.000Z'

describe('normalizeStorefrontPublicationRow', () => {
  it('resolves a projection from layout/SEO alone (no drop snapshot)', () => {
    const out = normalizeStorefrontPublicationRow({
      website_layout: {},
      site_seo: null,
      revision: 0,
      published_at: null,
    })
    expect(out).not.toBeNull()
    expect(out!.adminProducts).toEqual([])
    expect(out!.catalogDropIndex).toEqual([])
  })

  it('parses layout and site SEO', () => {
    const layout = createDefaultWebsiteLayout(STAMP)
    const out = normalizeStorefrontPublicationRow({
      website_layout: layout,
      site_seo: { globalDefaults: { metaTitle: 'Campaign' } },
      revision: '4',
      published_at: STAMP,
    })
    expect(out).not.toBeNull()
    expect(out!.revision).toBe(4)
    expect(out!.layout.version).toBe(layout.version)
    expect(out!.siteSeo.globalDefaults.metaTitle).toBe('Campaign')
  })

  it('parses products_snapshot, catalog_drop_index, global_brand, campaigns, lookbook', () => {
    const layout = createDefaultWebsiteLayout(STAMP)
    const defaults = createDefaultGlobalBrandSettings()
    const dropIndexRow = {
      id: 'drop-oath',
      slug: 'the-oath',
      name: 'The Oath',
      dropNumber: 'Drop 01',
    }
    const productRow: AdminProduct = {
      id: 'prod-1',
      slug: 'oversized-tee',
      name: 'Oversized Tee',
      shortDescription: 'Heavyweight tee',
      description: 'Full description',
      price: 49,
      isOnSale: false,
      status: 'active',
      isActive: true,
      currency: 'USD',
      sourceType: 'drop',
      category: 'tops',
      tags: [],
      colors: [
        {
          id: 'col-black',
          name: 'Black',
          hex: '#0b0b0c',
          images: [
            {
              id: 'img-1',
              url: '/media/tee-black.webp',
              alt: 'Tee black',
              isPrimary: true,
              sortOrder: 0,
            },
          ],
        },
      ],
      sizes: [{ id: 'sz-m', label: 'M', sortOrder: 0 }],
      availability: [
        {
          colorId: 'col-black',
          sizeId: 'sz-m',
          stockQuantity: 10,
          reservedQuantity: 0,
          isAvailable: true,
        },
      ],
      dropIds: [dropIndexRow.id],
      details: {},
      seo: {},
      createdAt: STAMP,
      updatedAt: STAMP,
    }
    const out = normalizeStorefrontPublicationRow({
      website_layout: layout,
      site_seo: null,
      revision: 1,
      published_at: null,
      products_snapshot: [productRow, { bogus: true }],
      catalog_drop_index: [dropIndexRow],
      global_brand: {
        emblemFallbackUrl: 'https://cdn.example/emblem.svg',
        loadingEmblemFallbackUrl: '',
      },
      campaigns: [{ id: 'c1', title: 'Summer', description: 'Drop' }],
      lookbook: [{ id: 'l1', alt: 'Look', src: '/look.webp' }],
    })
    expect(out).not.toBeNull()
    expect(out!.adminProducts).toHaveLength(1)
    expect(out!.adminProducts[0]!.slug).toBe('oversized-tee')
    expect(out!.catalogDropIndex).toEqual([dropIndexRow])
    expect(out!.globalBrand.emblemFallbackUrl).toBe('https://cdn.example/emblem.svg')
    expect(out!.globalBrand.loadingEmblemFallbackUrl).toBe(
      defaults.loadingEmblemFallbackUrl,
    )
    expect(out!.campaigns).toEqual([
      { id: 'c1', title: 'Summer', description: 'Drop' },
    ])
    expect(out!.lookbook).toEqual([{ id: 'l1', alt: 'Look', src: '/look.webp' }])
    expect(out!.siteHomepage).toEqual(DEFAULT_SITE_HOMEPAGE)
  })

  it('parses site_homepage mode from publication', () => {
    const layout = createDefaultWebsiteLayout(STAMP)
    const out = normalizeStorefrontPublicationRow({
      website_layout: layout,
      site_seo: null,
      revision: 1,
      published_at: null,
      site_homepage: { mode: 'default', updatedAt: '2026-05-01T00:00:00.000Z' },
    })
    expect(out?.siteHomepage.mode).toBe('custom')
  })
})

describe('getSupabasePublicationAnonClient', () => {
  it('returns the same in-memory client for identical env (singleton)', () => {
    const env = {
      url: 'https://unit-test.supabase.co',
      anonKey: 'anon-unit-test',
    }
    expect(getSupabasePublicationAnonClient(env)).toBe(
      getSupabasePublicationAnonClient(env),
    )
  })
})

describe('parseSiteSeoUnknown (Supabase site_seo column)', () => {
  it('falls back to defaults when schema does not match', () => {
    const d = parseSiteSeoUnknown({
      globalDefaults: { nope: true },
      staticPages: {},
    } as unknown)
    expect(d.staticPages).toEqual({})
  })
})
