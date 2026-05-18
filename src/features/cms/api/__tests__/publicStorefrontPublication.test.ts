import { describe, expect, it } from 'vitest'
import { createDefaultTheOathDrop } from '@/features/admin/drops/drops.defaults'
import { createDefaultWebsiteLayout } from '@/features/admin/website-layout/websiteLayout.defaults'
import { normalizeStorefrontPublicationRow } from '@/features/cms/api/publicStorefrontPublication'
import { parseSiteSeoUnknown } from '@/features/cms/siteSeo.local'

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
