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
})
