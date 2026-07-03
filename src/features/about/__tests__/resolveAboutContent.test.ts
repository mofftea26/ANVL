import { describe, expect, it } from 'vitest'
import { orbImage, resolveAboutContent } from '@/features/about/content/resolveAboutContent'
import { ABOUT_DEFAULT_CONTENT } from '@/features/about/content/aboutContent.defaults'

describe('resolveAboutContent', () => {
  it('returns the full designed defaults for an empty CMS slice', () => {
    expect(resolveAboutContent({})).toEqual(ABOUT_DEFAULT_CONTENT)
    expect(resolveAboutContent(undefined)).toEqual(ABOUT_DEFAULT_CONTENT)
  })

  it('returns defaults for a malformed slice (safeParse path)', () => {
    expect(resolveAboutContent({ hero: 'not-an-object' })).toEqual(ABOUT_DEFAULT_CONTENT)
    expect(resolveAboutContent(42)).toEqual(ABOUT_DEFAULT_CONTENT)
  })

  it('merges partial hero/marquee overrides over defaults', () => {
    const resolved = resolveAboutContent({
      hero: { headline: 'Custom Headline' },
      marquee: { text: 'Custom Marquee' },
    })
    expect(resolved.hero.headline).toBe('Custom Headline')
    expect(resolved.hero.subhead).toBe(ABOUT_DEFAULT_CONTENT.hero.subhead)
    expect(resolved.marquee.text).toBe('Custom Marquee')
    expect(resolved.orbs).toEqual(ABOUT_DEFAULT_CONTENT.orbs)
  })

  it('treats blank/whitespace values as unset', () => {
    const resolved = resolveAboutContent({ hero: { headline: '   ' }, marquee: { text: '' } })
    expect(resolved.hero.headline).toBe(ABOUT_DEFAULT_CONTENT.hero.headline)
    expect(resolved.marquee.text).toBe(ABOUT_DEFAULT_CONTENT.marquee.text)
  })

  it('merges same-length orb overrides positionally', () => {
    const overrides = ABOUT_DEFAULT_CONTENT.orbs.map(() => ({}))
    overrides[0] = { title: 'Custom ANVL Title', color: '#123ABC' }
    const resolved = resolveAboutContent({ orbs: overrides })
    expect(resolved.orbs).toHaveLength(ABOUT_DEFAULT_CONTENT.orbs.length)
    expect(resolved.orbs[0]?.title).toBe('Custom ANVL Title')
    expect(resolved.orbs[0]?.color).toBe('#123ABC')
    expect(resolved.orbs[0]?.body).toBe(ABOUT_DEFAULT_CONTENT.orbs[0]?.body)
    expect(resolved.orbs[1]).toEqual(ABOUT_DEFAULT_CONTENT.orbs[1])
  })

  it('lets the CMS own the list when lengths differ (add/remove orbs)', () => {
    const resolved = resolveAboutContent({
      orbs: [{ label: 'Only Orb', title: 'Solo' }],
    })
    expect(resolved.orbs).toHaveLength(1)
    expect(resolved.orbs[0]?.label).toBe('Only Orb')
    expect(resolved.orbs[0]?.title).toBe('Solo')
    // Positional default still fills unset fields for orb 0.
    expect(resolved.orbs[0]?.color).toBe(ABOUT_DEFAULT_CONTENT.orbs[0]?.color)
  })

  it('gives extra orbs beyond the defaults a distinct generic identity', () => {
    const overrides = [...ABOUT_DEFAULT_CONTENT.orbs.map(() => ({})), { label: 'Community' }]
    const resolved = resolveAboutContent({ orbs: overrides })
    const extra = resolved.orbs[resolved.orbs.length - 1]
    expect(extra?.label).toBe('Community')
    expect(extra?.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })

  it('rejects invalid orb colors and falls back to the default tint', () => {
    const overrides = ABOUT_DEFAULT_CONTENT.orbs.map(() => ({}))
    overrides[1] = { color: 'red' }
    const resolved = resolveAboutContent({ orbs: overrides })
    expect(resolved.orbs[1]?.color).toBe(ABOUT_DEFAULT_CONTENT.orbs[1]?.color)
  })

  it('keeps creed lines when CMS lines are all blank', () => {
    const overrides = ABOUT_DEFAULT_CONTENT.orbs.map(() => ({}))
    overrides[1] = { lines: ['  ', ''] }
    const resolved = resolveAboutContent({ orbs: overrides })
    expect(resolved.orbs[1]?.lines).toEqual(ABOUT_DEFAULT_CONTENT.orbs[1]?.lines)
  })

  it('resolves orb CTAs only when both label and href resolve', () => {
    const resolved = resolveAboutContent({
      orbs: [{ primaryCta: { label: 'Go' } }],
    })
    // Default anvl orb has no CTA; label without href stays undefined.
    expect(resolved.orbs[0]?.primaryCta).toBeUndefined()
  })
})

describe('orbImage', () => {
  it('prefers the orb-specific image, falls back to its page slot', () => {
    const assets = { heroImage: '/slot-hero.webp' }
    const def = ABOUT_DEFAULT_CONTENT.orbs[0]!
    expect(orbImage(def, assets)).toBe('/slot-hero.webp')
    expect(orbImage({ ...def, image: '/cms.webp' }, assets)).toBe('/cms.webp')
    expect(orbImage({ ...def, imageSlot: undefined }, assets)).toBeUndefined()
  })
})
