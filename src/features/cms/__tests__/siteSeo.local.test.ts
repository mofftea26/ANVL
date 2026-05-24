import { describe, expect, it } from 'vitest'
import {
  parseSiteSeoUnknown,
  sanitizeStaticPagesLoose,
  saveSiteSeoContent,
} from '@/features/cms/siteSeo.local'

describe('sanitizeStaticPagesLoose / site SEO parse', () => {
  it('drops undefined and null static page placeholders', () => {
    const cleaned = sanitizeStaticPagesLoose({
      '/': undefined,
      '/shop': null,
      '/about': {},
      '/size-guide': { metaTitle: 'Size' },
    })
    expect(cleaned['/']).toBeUndefined()
    expect(cleaned['/shop']).toBeUndefined()
    expect(cleaned['/about']).toEqual({})
    expect(cleaned['/size-guide']).toEqual({ metaTitle: 'Size' })
  })

  it('parseSiteSeoUnknown accepts globalDefaults-only blobs (no staticPages key)', () => {
    const d = parseSiteSeoUnknown({
      globalDefaults: { metaTitle: 'Campaign' },
    } as unknown)
    expect(d.globalDefaults.metaTitle).toBe('Campaign')
    expect(d.staticPages).toEqual({})
  })

  it('parseSiteSeoUnknown accepts blobs with placeholder static page keys', () => {
    const d = parseSiteSeoUnknown({
      globalDefaults: { metaTitle: 'Site' },
      staticPages: {
        '/': undefined,
        '/shop': null,
        '/about': {},
        '/size-guide': {},
      },
    })
    expect(d.globalDefaults.metaTitle).toBe('Site')
    expect(d.staticPages['/']).toBeUndefined()
    expect(d.staticPages['/about']).toEqual({})
  })

  it('saveSiteSeoContent does not throw when staticPages entries are undefined', () => {
    expect(() =>
      saveSiteSeoContent({
        globalDefaults: { metaTitle: 'X' },
        staticPages: {
          '/': undefined,
          '/shop': undefined,
          '/about': undefined,
          '/size-guide': undefined,
        },
      }),
    ).not.toThrow()
  })
})
