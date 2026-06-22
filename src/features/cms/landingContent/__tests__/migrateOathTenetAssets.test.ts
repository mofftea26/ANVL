import { describe, expect, it } from 'vitest'
import { DEFAULT_ASSET_CONFIG } from '@/features/cms/config/cmsSiteConfig.zod'
import { migrateOathTenetAssetsFromSlots } from '../migrateOathTenetAssets'

describe('migrateOathTenetAssetsFromSlots', () => {
  it('moves chapterMedia ids into landing content and strips legacy slots', () => {
    const landingContent = {}
    const assetConfig = {
      ...DEFAULT_ASSET_CONFIG,
      drops: {
        'the-oath': {
          chapterMedia1: 'media-a',
          chapterMedia2: 'media-b',
          dropLogo: 'logo-id',
        },
      },
    }

    const migrated = migrateOathTenetAssetsFromSlots(landingContent, assetConfig)
    expect(migrated.assetConfig.drops['the-oath']).toEqual({ dropLogo: 'logo-id' })
    expect(migrated.landingContent['the-oath']).toMatchObject({
      tenets: {
        items: [{ mediaId: 'media-a' }, { mediaId: 'media-b' }],
      },
    })
  })

  it('does not overwrite tenets that already carry mediaId', () => {
    const landingContent = {
      'the-oath': { tenets: { items: [{ mediaId: 'existing' }] } },
    }
    const assetConfig = {
      ...DEFAULT_ASSET_CONFIG,
      drops: { 'the-oath': { chapterMedia1: 'legacy' } },
    }

    const migrated = migrateOathTenetAssetsFromSlots(landingContent, assetConfig)
    expect(migrated.landingContent['the-oath']).toMatchObject({
      tenets: { items: [{ mediaId: 'existing' }] },
    })
    expect(migrated.assetConfig.drops['the-oath']).toEqual({})
  })

  it('does not re-migrate legacy slots when CMS already stores a shorter item list', () => {
    const landingContent = {
      'the-oath': { tenets: { items: [{ title: 'One' }, { title: 'Two' }] } },
    }
    const assetConfig = {
      ...DEFAULT_ASSET_CONFIG,
      drops: {
        'the-oath': {
          chapterMedia1: 'legacy-a',
          chapterMedia2: 'legacy-b',
        },
      },
    }

    const migrated = migrateOathTenetAssetsFromSlots(landingContent, assetConfig)
    expect(migrated.landingContent['the-oath']).toEqual(landingContent['the-oath'])
    expect(migrated.assetConfig.drops['the-oath']).toEqual({})
  })
})
