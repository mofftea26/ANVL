import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ASSET_CONFIG,
  DEFAULT_FONT_CONFIG,
  DEFAULT_THEME_CONFIG,
} from '@/features/cms/config/cmsSiteConfig.zod'
import {
  getSupabasePublicationAnonClient,
  normalizeStorefrontPublicationRow,
} from '@/features/cms/api/publicStorefrontPublication'

const STAMP = '2026-01-01T00:00:00.000Z'

describe('normalizeStorefrontPublicationRow', () => {
  it('resolves slim projection with defaults when config is empty', () => {
    const out = normalizeStorefrontPublicationRow({
      revision: 0,
      published_at: null,
    })
    expect(out).not.toBeNull()
    expect(out!.theme).toEqual(DEFAULT_THEME_CONFIG)
    expect(out!.fonts).toEqual(DEFAULT_FONT_CONFIG)
    expect(out!.assets).toEqual(DEFAULT_ASSET_CONFIG)
    expect(out!.activeLandingPageKey).toBe('the-oath')
    expect(out!.mediaIndex).toEqual([])
  })

  it('parses theme, fonts, assets, and active landing key', () => {
    const out = normalizeStorefrontPublicationRow({
      revision: '4',
      published_at: STAMP,
      active_landing_page_key: 'the-oath',
      theme_config: {
        dataTheme: 'oath-dark',
        palette: DEFAULT_THEME_CONFIG.palette,
      },
      font_config: DEFAULT_FONT_CONFIG,
      asset_config: {
        general: { emblemFallback: 'media-1' },
        drops: { 'the-oath': { heroMedia: 'media-2' } },
      },
      media_index: [
        {
          id: 'media-1',
          path: 'library/emblem.svg',
          alt: '',
          mime: 'image/svg+xml',
          w: null,
          h: null,
          updatedAt: STAMP,
        },
      ],
    })
    expect(out).not.toBeNull()
    expect(out!.revision).toBe(4)
    expect(out!.publishedAt).toBe(STAMP)
    expect(out!.assets.general.emblemFallback).toBe('media-1')
    expect(out!.mediaIndex).toHaveLength(1)
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
