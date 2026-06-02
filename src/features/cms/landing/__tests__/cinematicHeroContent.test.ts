import { describe, expect, it } from 'vitest'
import { previewCinematicHeroMedia } from '@/features/cms/landing/cinematicHeroContent'
import type { LandingAct } from '@/features/cms/landing/landingActs.types'
import type { LandingPageCmsContent } from '@/features/cms/landing/landingPageCms.types'

const landingHero = {
  badgeText: 'Default badge',
  title: 'DEFAULT TITLE',
  subtitle: 'Default subtitle',
  primaryCta: { label: 'Primary', href: '/primary' },
  secondaryCta: { label: 'Secondary', href: '/secondary' },
  meta: [{ id: 'd1', label: 'Drop', value: '99' }],
} as LandingPageCmsContent['hero']

describe('previewCinematicHeroMedia', () => {
  it('prefers act content video and poster over media fallback', () => {
    const row: LandingAct = {
      id: 'a1',
      nature: 'hero',
      preset: 'theOathCinematic',
      isEnabled: true,
      sortOrder: 0,
      content: {
        backgroundVideoUrl: 'https://cdn.test/hero.mp4',
        backgroundImageUrl: 'https://cdn.test/poster.jpg',
        playVideoOnMobile: true,
        metaItems: [{ id: 'm1', label: 'Status', value: 'Live' }],
      },
      media: {
        videoUrl: 'https://cdn.test/fallback.mp4',
        imageUrl: 'https://cdn.test/fallback.jpg',
      },
    }

    const media = previewCinematicHeroMedia(landingHero, row)
    expect(media.backgroundVideoUrl).toBe('https://cdn.test/hero.mp4')
    expect(media.backgroundImageUrl).toBe('https://cdn.test/poster.jpg')
    expect(media.playVideoOnMobile).toBe(true)
    expect(media.meta[0]?.value).toBe('Live')
  })

  it('falls back to act.media when content URLs are empty', () => {
    const row: LandingAct = {
      id: 'a2',
      nature: 'hero',
      preset: 'theOathCinematic',
      isEnabled: true,
      sortOrder: 0,
      content: {},
      media: {
        videoUrl: 'https://cdn.test/media.mp4',
        imageUrl: 'https://cdn.test/media.jpg',
      },
    }

    const media = previewCinematicHeroMedia(landingHero, row)
    expect(media.backgroundVideoUrl).toBe('https://cdn.test/media.mp4')
    expect(media.backgroundImageUrl).toBe('https://cdn.test/media.jpg')
    expect(media.meta[0]?.value).toBe('99')
  })
})
