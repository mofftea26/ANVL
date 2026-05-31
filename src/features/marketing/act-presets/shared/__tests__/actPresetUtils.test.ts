import { describe, expect, it } from 'vitest'
import { hasActRowMedia, hasActForegroundMedia } from '@/features/marketing/act-presets/shared/actPresetUtils'
import type { LandingAct } from '@/features/cms/landing/landingActs.types'

describe('actPresetUtils', () => {
  it('hasActRowMedia is true when image or video is set', () => {
    const base: LandingAct = {
      id: 'a',
      nature: 'hero',
      preset: 'theOathCinematic',
      isEnabled: true,
      sortOrder: 0,
    }
    expect(hasActRowMedia({ ...base, media: { imageUrl: '/img.jpg' } })).toBe(true)
    expect(hasActRowMedia({ ...base, media: { videoUrl: '/vid.mp4' } })).toBe(true)
    expect(hasActRowMedia({ ...base, media: {} })).toBe(false)
    expect(hasActRowMedia(base)).toBe(false)
  })

  it('hasActForegroundMedia reads foreground content keys', () => {
    const base: LandingAct = {
      id: 'a',
      nature: 'hero',
      preset: 'splitProduct',
      isEnabled: true,
      sortOrder: 0,
    }
    expect(
      hasActForegroundMedia({ ...base, content: { foregroundImageUrl: '/fg.png' } }),
    ).toBe(true)
    expect(hasActForegroundMedia(base)).toBe(false)
  })
})
