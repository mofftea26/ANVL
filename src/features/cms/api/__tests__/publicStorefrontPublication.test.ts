import { describe, expect, it } from 'vitest'
import { createDefaultTheOathDrop } from '@/features/admin/drops/drops.defaults'
import { createDefaultGlobalBrandSettings } from '@/features/admin/global-brand/globalBrand.defaults'
import { createDefaultWebsiteLayout } from '@/features/admin/website-layout/websiteLayout.defaults'
import { normalizeStorefrontPublicationRow } from '@/features/cms/api/publicStorefrontPublication'
import { parseSiteSeoUnknown } from '@/features/cms/siteSeo.local'
import type { AdminProduct } from '@/features/admin/products/products.types'

describe('normalizeStorefrontPublicationRow', () => {
  it('returns null when snapshot is missing', () => {
    expect(
      normalizeStorefrontPublicationRow({
        published_drop_snapshot: null,
        website_layout: {},
        site_seo: null,
        revision: 0,
        published_at: null,
      }),
    ).toBeNull()
  })

  it('parses published oath drop, layout, and site SEO', () => {
    const drop = createDefaultTheOathDrop()
    const layout = createDefaultWebsiteLayout(drop.updatedAt)
    const out = normalizeStorefrontPublicationRow({
      published_drop_snapshot: drop,
      website_layout: layout,
      site_seo: { globalDefaults: { metaTitle: 'Campaign' } },
      revision: '4',
      published_at: '2026-01-01T00:00:00.000Z',
    })
    expect(out).not.toBeNull()
    expect(out!.revision).toBe(4)
    expect(out!.drop.id).toBe(drop.id)
    expect(out!.layout.version).toBe(layout.version)
    expect(out!.siteSeo.globalDefaults.metaTitle).toBe('Campaign')
  })

  it('returns null on invalid drop snapshot (tamper guard)', () => {
    expect(
      normalizeStorefrontPublicationRow({
        published_drop_snapshot: { bogus: true },
        website_layout: {},
        site_seo: null,
        revision: 0,
        published_at: null,
      }),
    ).toBeNull()
  })

  it('parses products_snapshot, catalog_drop_index, global_brand, campaigns, lookbook', () => {
    const drop = createDefaultTheOathDrop()
    const layout = createDefaultWebsiteLayout(drop.updatedAt)
    const defaults = createDefaultGlobalBrandSettings()
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
      dropIds: [drop.id],
      details: {},
      seo: {},
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    const out = normalizeStorefrontPublicationRow({
      published_drop_snapshot: drop,
      website_layout: layout,
      site_seo: null,
      revision: 1,
      published_at: null,
      products_snapshot: [productRow, { bogus: true }],
      catalog_drop_index: [
        {
          id: drop.id,
          slug: drop.slug,
          name: drop.name,
          dropNumber: drop.dropNumber,
        },
      ],
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
    expect(out!.catalogDropIndex).toEqual([
      {
        id: drop.id,
        slug: drop.slug,
        name: drop.name,
        dropNumber: drop.dropNumber,
      },
    ])
    expect(out!.globalBrand.emblemFallbackUrl).toBe('https://cdn.example/emblem.svg')
    expect(out!.globalBrand.loadingEmblemFallbackUrl).toBe(
      defaults.loadingEmblemFallbackUrl,
    )
    expect(out!.campaigns).toEqual([
      { id: 'c1', title: 'Summer', description: 'Drop' },
    ])
    expect(out!.lookbook).toEqual([{ id: 'l1', alt: 'Look', src: '/look.webp' }])
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
