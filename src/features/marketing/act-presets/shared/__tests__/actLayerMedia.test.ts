import { describe, expect, it } from 'vitest'
import {
  hasActForegroundMedia,
  hasActLayerMedia,
  isLayeredHeroPreset,
  resolveActLayerMedia,
} from '@/features/marketing/act-presets/shared/actLayerMedia'
import type { LandingAct } from '@/features/cms/landing/landingActs.types'

describe('actLayerMedia', () => {
  const base: LandingAct = {
    id: 'a',
    nature: 'hero',
    preset: 'splitProduct',
    isEnabled: true,
    sortOrder: 0,
  }

  it('isLayeredHeroPreset identifies split and minimal presets only', () => {
    expect(isLayeredHeroPreset('splitProduct')).toBe(true)
    expect(isLayeredHeroPreset('minimalEmblem')).toBe(true)
    expect(isLayeredHeroPreset('theOathCinematic')).toBe(false)
  })

  it('resolveActLayerMedia reads background from row.media', () => {
    const row = {
      ...base,
      media: { imageUrl: '/bg.jpg', videoUrl: '/bg.mp4' },
    }
    expect(resolveActLayerMedia(row, 'background')).toEqual({
      imageUrl: '/bg.jpg',
      videoUrl: '/bg.mp4',
      alt: undefined,
    })
  })

  it('resolveActLayerMedia reads foreground from content keys', () => {
    const row = {
      ...base,
      content: {
        foregroundImageUrl: '/fg.png',
        foregroundVideoUrl: '/fg.mp4',
      },
    }
    expect(resolveActLayerMedia(row, 'foreground')).toEqual({
      imageUrl: '/fg.png',
      videoUrl: '/fg.mp4',
      alt: undefined,
    })
  })

  it('hasActLayerMedia and hasActForegroundMedia detect layer presence', () => {
    expect(hasActLayerMedia({ ...base, media: { imageUrl: '/bg.jpg' } })).toBe(true)
    expect(hasActForegroundMedia({ ...base, content: { foregroundVideoUrl: '/fg.mp4' } })).toBe(
      true,
    )
    expect(hasActForegroundMedia(base)).toBe(false)
  })
})
