import { describe, expect, it } from 'vitest'
import {
  ACT_MOTION_TYPE_OPTIONS,
  normalizeActMotionType,
  shouldRunActMotion,
} from '@/features/marketing/act-presets/shared/actAnimationConfig'
import { hasActRowMedia } from '@/features/marketing/act-presets/shared/actPresetUtils'
import type { LandingAct } from '@/features/cms/landing/landingActs.types'

describe('actAnimationConfig', () => {
  it('normalizes legacy and kebab-case motion type aliases', () => {
    expect(normalizeActMotionType('default')).toBe('wordReveal')
    expect(normalizeActMotionType('fade-up')).toBe('fadeUp')
    expect(normalizeActMotionType('word-reveal')).toBe('wordReveal')
    expect(normalizeActMotionType('calm-idle')).toBe('calmIdle')
    expect(normalizeActMotionType('none')).toBe('none')
  })

  it('disables motion when type is none', () => {
    expect(
      shouldRunActMotion(
        { enabled: true, desktopOnly: false, type: 'none', intensity: 'standard' },
        'desktop',
      ),
    ).toBe(false)
  })

  it('exports CMS motion dropdown options', () => {
    expect(ACT_MOTION_TYPE_OPTIONS.map((o) => o.value)).toContain('parallax')
    expect(ACT_MOTION_TYPE_OPTIONS.length).toBeGreaterThanOrEqual(5)
  })
})

describe('hasActRowMedia', () => {
  it('returns true when image or video is set on act media', () => {
    const withImage: LandingAct = {
      id: 'a',
      nature: 'hero',
      preset: 'theOathCinematic',
      isEnabled: true,
      sortOrder: 0,
      media: { imageUrl: '/img.jpg' },
    }
    const withVideo: LandingAct = {
      ...withImage,
      media: { videoUrl: '/clip.mp4' },
    }
    expect(hasActRowMedia(withImage)).toBe(true)
    expect(hasActRowMedia(withVideo)).toBe(true)
    expect(hasActRowMedia({ ...withImage, media: {} })).toBe(false)
  })
})
