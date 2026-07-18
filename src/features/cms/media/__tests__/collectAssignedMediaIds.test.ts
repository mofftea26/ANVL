import { describe, expect, it } from 'vitest'
import { collectAssignedMediaIds } from '../collectAssignedMediaIds'
import { DEFAULT_ASSET_CONFIG, type AssetConfig } from '@/features/cms/config/cmsSiteConfig.zod'

describe('collectAssignedMediaIds', () => {
  it('collects ids from general, drop, and page slot maps in the working copy', () => {
    const config: AssetConfig = {
      ...DEFAULT_ASSET_CONFIG,
      general: { logo: 'media-general', wordmark: '' },
      drops: { 'the-oath': { hero: 'media-drop', poster: 'media-drop' } },
      pages: { about: { altar: 'media-page' } },
    }

    const ids = collectAssignedMediaIds(config)

    expect(ids.has('media-general')).toBe(true)
    expect(ids.has('media-drop')).toBe(true)
    expect(ids.has('media-page')).toBe(true)
    // Empty slot values are never treated as an assignment.
    expect(ids.has('')).toBe(false)
  })

  it('does not report an id that is assigned nowhere', () => {
    const ids = collectAssignedMediaIds({
      ...DEFAULT_ASSET_CONFIG,
      general: { logo: 'media-used' },
    })

    expect(ids.has('media-used')).toBe(true)
    expect(ids.has('media-orphan')).toBe(false)
  })
})
