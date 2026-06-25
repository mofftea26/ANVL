import { describe, expect, it } from 'vitest'
import { resolveTheoathModernContent } from '../content/resolveTheoathModernContent'
import { TM_DEFAULT_CONTENT } from '../content/theoathModernContent.defaults'
import { isLandingPageKey, resolveLandingPage } from '../../../registry'

describe('resolveTheoathModernContent', () => {
  it('returns the full designed defaults for an empty / invalid blob', () => {
    for (const raw of [undefined, null, {}, 'nonsense', { hero: 'bad' }]) {
      const resolved = resolveTheoathModernContent(raw)
      expect(resolved.hero.heading).toBe(TM_DEFAULT_CONTENT.hero.heading)
      expect(resolved.collection.heroProductSlug).toBe('compression-tee')
      expect(resolved.benefits.items.length).toBeGreaterThan(0)
    }
  })

  it('overrides individual fields and keeps defaults for the rest', () => {
    const resolved = resolveTheoathModernContent({
      hero: { heading: 'BUILT DIFFERENT', highlightWords: ['DIFFERENT'] },
    })
    expect(resolved.hero.heading).toBe('BUILT DIFFERENT')
    expect(resolved.hero.highlightWords).toEqual(['DIFFERENT'])
    // Untouched fields fall back to defaults.
    expect(resolved.hero.description).toBe(TM_DEFAULT_CONTENT.hero.description)
  })

  it('treats blank/whitespace values as "not set" (restores defaults)', () => {
    const resolved = resolveTheoathModernContent({
      hero: { heading: '   ', eyebrow: '' },
    })
    expect(resolved.hero.heading).toBe(TM_DEFAULT_CONTENT.hero.heading)
    expect(resolved.hero.eyebrow).toBe(TM_DEFAULT_CONTENT.hero.eyebrow)
  })

  it('clamps hero settings and keeps designed defaults when omitted', () => {
    const resolved = resolveTheoathModernContent({ hero: {} })
    expect(resolved.hero.settings.enable3d).toBe(true)
    expect(resolved.hero.settings.particleIntensity).toBeGreaterThanOrEqual(0)
  })
})

describe('theoath-modern in the landing registry', () => {
  it('is a registered, available page that keeps the-oath intact', () => {
    expect(isLandingPageKey('theoath-modern')).toBe(true)
    expect(resolveLandingPage('theoath-modern').key).toBe('theoath-modern')
    expect(resolveLandingPage('theoath-modern').isAvailable).toBe(true)
    // The original page is untouched.
    expect(resolveLandingPage('the-oath').key).toBe('the-oath')
  })
})
