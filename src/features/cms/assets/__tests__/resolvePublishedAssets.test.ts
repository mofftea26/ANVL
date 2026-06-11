import { describe, expect, it } from 'vitest'
import { resolvePublishedAssets } from '../resolvePublishedAssets'
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
  ]

  it('resolves general loadingEmblem slot to a public URL', () => {
    const config: AssetConfig = {
      general: { loadingEmblem: 'media-loading' },
      drops: {},
    }
    const resolved = resolvePublishedAssets(config, 'the-oath', mediaIndex)
    expect(resolved.loadingEmblem).toContain('library/loading-1.svg')
  })

  it('passes through select slots like heroMediaMode without media resolution', () => {
    const config: AssetConfig = {
      general: {},
      drops: { 'the-oath': { heroMediaMode: 'image' } },
    }
    const resolved = resolvePublishedAssets(config, 'the-oath', mediaIndex)
    expect(resolved.heroMediaMode).toBe('image')
  })
})
