import { describe, expect, it } from 'vitest'
import {
  mergeActContentCta,
  previewHeroFields,
} from '@/features/cms/landing/landingActPreviewOverlay'
import type { LandingAct } from '@/features/cms/landing/landingActs.types'

describe('landingActPreviewOverlay', () => {
  it('mergeActContentCta overlays partial fragments from act content', () => {
    const base = { label: 'Shop', href: '/shop' }
    const next = mergeActContentCta(base, { primaryCta: { label: 'Go' } }, 'primaryCta')
    expect(next).toEqual({ label: 'Go', href: '/shop' })
  })

  it('mergeActContentCta leaves base when content is missing', () => {
    const base = { label: 'Shop', href: '/shop' }
    expect(mergeActContentCta(base, undefined, 'primaryCta')).toEqual(base)
  })

  it('previewHeroFields prefers act eyebrow/title/subtitle when present', () => {
    const landing = {
      actLabel: 'Act I',
      badgeText: 'Default badge',
      title: 'Default title',
      subtitle: 'Default subtitle',
      primaryCta: { label: 'A', href: '/a' },
      secondaryCta: { label: 'B', href: '/b' },
      meta: [],
    }
    const row: LandingAct = {
      id: 'act-1',
      nature: 'hero',
      preset: 'x',
      isEnabled: true,
      sortOrder: 0,
      eyebrow: 'Live badge',
      title: 'Live title',
      subtitle: 'Live subtitle',
      content: {
        primaryCta: { label: 'Cta' },
      },
    }
    const hero = previewHeroFields(landing, row)
    expect(hero.badgeText).toBe('Live badge')
    expect(hero.title).toBe('Live title')
    expect(hero.subtitle).toBe('Live subtitle')
    expect(hero.primaryCta).toEqual({ label: 'Cta', href: '/a' })
  })

  it('previewHeroFields builds meta from heroDrop, heroPieces, and heroStatus', () => {
    const landing = {
      actLabel: 'Act I',
      badgeText: 'Default badge',
      title: 'Default title',
      subtitle: 'Default subtitle',
      primaryCta: { label: 'A', href: '/a' },
      secondaryCta: { label: 'B', href: '/b' },
      meta: [{ id: 'x', label: 'Drop', value: '99' }],
    }
    const row: LandingAct = {
      id: 'act-1',
      nature: 'hero',
      preset: 'theOathCinematic',
      isEnabled: true,
      sortOrder: 0,
      content: {
        heroDrop: '02',
        heroPieces: '5',
        heroStatus: 'Live',
      },
    }
    const hero = previewHeroFields(landing, row)
    expect(hero.meta).toEqual([
      { id: 'hero-meta-drop', label: 'Drop', value: '02' },
      { id: 'hero-meta-pieces', label: 'Pieces', value: '5' },
      { id: 'hero-meta-status', label: 'Status', value: 'Live' },
    ])
    expect(hero.heroStatus).toBe('Live')
  })

  it('previewHeroFields does not expose removed background or watermark keys', () => {
    const landing = {
      actLabel: 'Act I',
      badgeText: 'Badge',
      title: 'Title',
      subtitle: 'Sub',
      primaryCta: { label: 'A', href: '/a' },
      secondaryCta: { label: 'B', href: '/b' },
      meta: [],
    }
    const hero = previewHeroFields(landing, undefined)
    expect('backgroundImageUrl' in hero).toBe(false)
    expect('emblemWatermarkSrc' in hero).toBe(false)
  })

  it('previewHeroFields exposes layered foreground media from act content', () => {
    const landing = {
      actLabel: 'Act I',
      badgeText: 'Badge',
      title: 'Title',
      subtitle: 'Sub',
      primaryCta: { label: 'A', href: '/a' },
      secondaryCta: { label: 'B', href: '/b' },
      meta: [],
    }
    const row: LandingAct = {
      id: 'act-1',
      nature: 'hero',
      preset: 'splitProduct',
      isEnabled: true,
      sortOrder: 0,
      content: {
        foregroundImageUrl: '/fg.png',
        foregroundVideoUrl: '/fg.mp4',
      },
    }
    const hero = previewHeroFields(landing, row)
    expect(hero.foregroundImageUrl).toBe('/fg.png')
    expect(hero.foregroundVideoUrl).toBe('/fg.mp4')
  })
})
