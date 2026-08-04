/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from 'vitest'
import {
  collectAssignedMediaIds,
  collectAssignedMediaUsage,
} from '../collectAssignedMediaIds'
import { writeAssetConfigToStorage } from '@/features/cms/config/cmsSiteConfig.settings'
import { writeLandingContentToStorage } from '@/features/cms/landingContent/landingContent.settings'
import { writePassportContentToStorage } from '@/features/cms/passportContent/passportContent.settings'
import { DEFAULT_PASSPORT_PRODUCT_CONTENT } from '@/features/cms/passportContent/passportContent.zod'
import { DEFAULT_ASSET_CONFIG, type AssetConfig } from '@/features/cms/config/cmsSiteConfig.zod'

describe('collectAssignedMediaIds', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

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

  it('G4 regression: reassigning a slot from A to B un-assigns A, including after a storage re-read', () => {
    // Assign A to slot S.
    writeAssetConfigToStorage({
      general: {},
      drops: {},
      pages: { shop: { heroImage: 'media-A' } },
    })
    let ids = collectAssignedMediaIds()
    expect(ids.has('media-A')).toBe(true)

    // Assign B to the same slot.
    writeAssetConfigToStorage({
      general: {},
      drops: {},
      pages: { shop: { heroImage: 'media-B' } },
    })
    ids = collectAssignedMediaIds()
    expect(ids.has('media-B')).toBe(true)
    expect(ids.has('media-A')).toBe(false)

    // Fresh collect (fresh read from storage) — same result.
    expect(collectAssignedMediaIds().has('media-A')).toBe(false)
    expect(collectAssignedMediaIds().has('media-B')).toBe(true)
  })

  it('collects only media-id fields from landing content — never plain copy strings', () => {
    writeLandingContentToStorage({
      'the-oath': {
        hero: { headline: 'Forged under pressure', subhead: 'Copy only' },
        tenets: {
          items: [
            {
              title: 'Oath Tee',
              mediaId: 'media-tenet-still',
              modelId: 'media-tenet-glb',
              bgId: 'media-tenet-bg',
              hotspots: [{ label: 'Seam', bubbleId: 'media-bubble' }],
            },
          ],
        },
      },
      about: {
        orbs: [{ label: 'Creed', title: 'The Creed', mediaId: 'media-orb' }],
      },
    })

    const ids = collectAssignedMediaIds(DEFAULT_ASSET_CONFIG)

    expect(ids.has('media-tenet-still')).toBe(true)
    expect(ids.has('media-tenet-glb')).toBe(true)
    expect(ids.has('media-tenet-bg')).toBe(true)
    expect(ids.has('media-bubble')).toBe(true)
    expect(ids.has('media-orb')).toBe(true)
    // The old all-strings walker counted every copy string as an assignment.
    expect(ids.has('Forged under pressure')).toBe(false)
    expect(ids.has('Oath Tee')).toBe(false)
    expect(ids.has('The Creed')).toBe(false)
  })

  it('counts passport media, including the card images nested one level down', () => {
    // An unregistered field makes the library call a live asset "unassigned"
    // and offer to delete it — so every media id the passport RENDERS has to
    // be reachable from here, not just the top-level slots.
    const base = DEFAULT_PASSPORT_PRODUCT_CONTENT
    writePassportContentToStorage({
      'oath-tee': {
        ...base,
        piece: { heroRender: 'media-hero', gallery: ['media-gallery-1'] },
        material: {
          ...base.material,
          macroAsset: 'media-macro',
          materials: [
            { id: 'm1', name: 'Cotton', percentage: null, gsm: null, image: 'media-material-card' },
          ],
        },
        care: { ...base.care, asset: 'media-care' },
        details: { ...base.details, asset: 'media-detail' },
        origin: { ...base.origin, asset: 'media-origin' },
        // Placed markers hold coordinates and copy — never a media id.
        blueprint: {
          ...base.blueprint,
          points: [{ x: 20, y: 30, label: 'Flatlock', value: '6-thread' }],
        },
      },
    })

    const usage = collectAssignedMediaUsage(DEFAULT_ASSET_CONFIG)

    for (const id of [
      'media-hero',
      'media-gallery-1',
      'media-macro',
      'media-material-card',
      'media-care',
      'media-detail',
      'media-origin',
    ]) {
      expect(usage.has(id)).toBe(true)
    }
    expect(usage.get('media-material-card')).toEqual([
      'Passport oath-tee — material card 1',
    ])
    // Marker copy is not a media id.
    expect(usage.has('Flatlock')).toBe(false)
  })

  it('reports where each id is used via collectAssignedMediaUsage', () => {
    const usage = collectAssignedMediaUsage({
      general: { emblemFallback: 'media-shared' },
      drops: {},
      pages: { shop: { heroImage: 'media-shared' } },
    })

    expect(usage.get('media-shared')).toEqual([
      'Slot: general/emblemFallback',
      'Slot: page shop/heroImage',
    ])
  })
})
