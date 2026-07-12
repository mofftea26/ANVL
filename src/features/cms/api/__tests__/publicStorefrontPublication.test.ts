import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ASSET_CONFIG,
  DEFAULT_FONT_CONFIG,
  DEFAULT_THEME_CONFIG,
} from '@/features/cms/config/cmsSiteConfig.zod'
import {
  DEFAULT_THEME_LIBRARY,
  resolveThemeConfig,
} from '@/features/cms/config/themeLibrary'
import { DEFAULT_FONT_LIBRARY_CONFIG } from '@/features/cms/config/fontLibrary'
import { getSupabasePublicationAnonClient } from '@/features/cms/api/supabasePublicationClient'
import { normalizeStorefrontPublicationRow } from '@/features/cms/api/publicStorefrontPublication'

const STAMP = '2026-01-01T00:00:00.000Z'

describe('normalizeStorefrontPublicationRow', () => {
  it('resolves slim projection with defaults when config is empty', () => {
    const out = normalizeStorefrontPublicationRow({
      revision: 0,
      published_at: null,
    })
    expect(out).not.toBeNull()
    // Empty config resolves to the Graphite & Champagne house preset.
    expect(out!.theme).toEqual(resolveThemeConfig(DEFAULT_THEME_LIBRARY))
    expect(out!.fonts).toEqual(DEFAULT_FONT_LIBRARY_CONFIG)
    expect(out!.assets).toEqual(DEFAULT_ASSET_CONFIG)
    expect(out!.activeLandingPageKey).toBe('the-oath')
    expect(out!.mediaIndex).toEqual([])
    expect(out!.landingContent).toEqual({})
  })

  it('parses landing_content and degrades malformed blobs to empty', () => {
    const withContent = normalizeStorefrontPublicationRow({
      revision: 1,
      published_at: STAMP,
      landing_content: {
        'the-oath': { hero: { headline: 'FORGED UNDER PRESSURE' } },
      },
    })
    expect(withContent!.landingContent['the-oath']).toEqual({
      hero: { headline: 'FORGED UNDER PRESSURE' },
    })

    const malformed = normalizeStorefrontPublicationRow({
      revision: 1,
      published_at: STAMP,
      landing_content: 'not-an-object',
    })
    expect(malformed!.landingContent).toEqual({})
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

  it('ignores any legacy landing-page theme assignment (global theme wins)', () => {
    const out = normalizeStorefrontPublicationRow({
      revision: 5,
      published_at: STAMP,
      active_landing_page_key: 'the-oath',
      theme_config: {
        activeThemeId: 'custom-dark',
        // Legacy field — must no longer influence the resolved theme.
        landingPageThemes: { 'the-oath': 'bone' },
        themes: [
          {
            id: 'custom-dark',
            name: 'Custom dark',
            appearance: 'dark',
            palette: DEFAULT_THEME_CONFIG.palette,
          },
          {
            id: 'bone',
            name: 'Bone',
            appearance: 'light',
            palette: { ...DEFAULT_THEME_CONFIG.palette, background: '#ffffff' },
          },
        ],
      },
    })
    // The single global activeThemeId drives the storefront regardless of the
    // active landing page, so the dark default is used — not the bone preset.
    expect(out!.theme.dataTheme).toBe('oath-dark')
    expect(out!.theme.palette.background).toBe(DEFAULT_THEME_CONFIG.palette.background)
  })

  it('uses the live active theme unchanged regardless of active landing page', () => {
    const out = normalizeStorefrontPublicationRow({
      revision: 6,
      published_at: STAMP,
      active_landing_page_key: 'the-oath',
      theme_config: {
        activeThemeId: 'custom-dark',
        themes: [
          {
            id: 'custom-dark',
            name: 'Custom dark',
            appearance: 'dark',
            palette: DEFAULT_THEME_CONFIG.palette,
          },
        ],
      },
    })
    // No assignment and no code-owned palette override → the live active theme
    // passes through verbatim, so the CMS fully controls the-oath's colors.
    expect(out!.theme.palette.accent).toBe(
      DEFAULT_THEME_CONFIG.palette.accent,
    )
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
