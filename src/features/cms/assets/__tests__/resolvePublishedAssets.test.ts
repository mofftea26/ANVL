import { describe, expect, it } from 'vitest'
import {
  resolvePublishedAssets,
  resolveStorefrontPageAssets,
} from '../resolvePublishedAssets'
import type { AssetConfig } from '@/features/cms/config/cmsSiteConfig.zod'

describe('resolvePublishedAssets', () => {
  const mediaIndex = [
    {
      id: 'media-loading',
      path: 'library/loading-1.svg',
      alt: 'Loading emblem',
      mime: 'image/svg+xml',
      w: null,
      h: null,
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'media-shop-hero',
      path: 'library/shop-hero.webp',
      alt: 'Shop hero',
      mime: 'image/webp',
      w: 1920,
      h: 1080,
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ]

  it('resolves general loadingEmblem slot to a public URL', () => {
    const config: AssetConfig = {
      general: { loadingEmblem: 'media-loading' },
      drops: {},
      pages: {},
    }
    const resolved = resolvePublishedAssets(config, 'the-oath', mediaIndex)
    expect(resolved.loadingEmblem).toContain('library/loading-1.svg')
  })

  it('passes through select slots like heroMediaMode without media resolution', () => {
    const config: AssetConfig = {
      general: {},
      drops: { 'the-oath': { heroMediaMode: 'image' } },
      pages: {},
    }
    const resolved = resolvePublishedAssets(config, 'the-oath', mediaIndex)
    expect(resolved.heroMediaMode).toBe('image')
  })
})

describe('resolveStorefrontPageAssets', () => {
  const mediaIndex = [
    {
      id: 'media-shop-hero',
      path: 'library/shop-hero.webp',
      alt: 'Shop hero',
      mime: 'image/webp',
      w: 1920,
      h: 1080,
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ]

  it("resolves a page's own slot assignment to a public URL", () => {
    const config: AssetConfig = {
      general: {},
      drops: {},
      pages: { shop: { heroImage: 'media-shop-hero' } },
    }
    const resolved = resolveStorefrontPageAssets(config, 'shop', mediaIndex)
    expect(resolved.heroImage).toContain('library/shop-hero.webp')
  })

  it('merges site-wide general slots into every page', () => {
    const config: AssetConfig = {
      general: { ogImage: 'media-shop-hero' },
      drops: {},
      pages: {},
    }
    const resolved = resolveStorefrontPageAssets(config, 'about', mediaIndex)
    expect(resolved.ogImage).toContain('library/shop-hero.webp')
  })

  it('leaves unassigned slots absent so callers fall back to code defaults', () => {
    const config: AssetConfig = { general: {}, drops: {}, pages: {} }
    const resolved = resolveStorefrontPageAssets(config, 'shop', mediaIndex)
    expect(resolved.heroImage).toBeUndefined()
  })
})
