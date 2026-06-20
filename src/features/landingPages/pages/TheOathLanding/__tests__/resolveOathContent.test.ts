import { describe, expect, it } from 'vitest'
import { resolveOathContent } from '../content/resolveOathContent'
import { OATH_DEFAULT_CONTENT } from '../content/oathContent.defaults'

describe('resolveOathContent', () => {
  it('returns full code defaults for empty/undefined CMS input', () => {
    expect(resolveOathContent(undefined)).toEqual(OATH_DEFAULT_CONTENT)
    expect(resolveOathContent({})).toEqual(OATH_DEFAULT_CONTENT)
  })

  it('degrades malformed input to defaults instead of throwing', () => {
    expect(resolveOathContent('not-an-object')).toEqual(OATH_DEFAULT_CONTENT)
    expect(resolveOathContent(42)).toEqual(OATH_DEFAULT_CONTENT)
  })

  it('overrides individual fields while keeping the rest as defaults', () => {
    const out = resolveOathContent({
      hero: { headline: 'CARVE THE VOW' },
    })
    expect(out.hero.headline).toBe('CARVE THE VOW')
    expect(out.hero.eyebrow).toBe(OATH_DEFAULT_CONTENT.hero.eyebrow)
    expect(out.manifesto.lines).toEqual(OATH_DEFAULT_CONTENT.manifesto.lines)
  })

  it('treats blank/whitespace values as "not set" and restores the default', () => {
    const out = resolveOathContent({
      hero: { headline: '   ', subhead: '' },
    })
    expect(out.hero.headline).toBe(OATH_DEFAULT_CONTENT.hero.headline)
    expect(out.hero.subhead).toBe(OATH_DEFAULT_CONTENT.hero.subhead)
  })

  it('merges CTA label/href independently and falls back per-field', () => {
    const out = resolveOathContent({
      hero: { primaryCta: { label: 'Enter' } },
    })
    expect(out.hero.primaryCta.label).toBe('Enter')
    expect(out.hero.primaryCta.href).toBe(
      OATH_DEFAULT_CONTENT.hero.primaryCta.href,
    )
  })

  it('keeps only non-empty manifesto lines, else falls back', () => {
    expect(resolveOathContent({ manifesto: { lines: ['One.', '  ', ''] } }).manifesto.lines).toEqual([
      'One.',
    ])
    expect(
      resolveOathContent({ manifesto: { lines: ['  ', ''] } }).manifesto.lines,
    ).toEqual(OATH_DEFAULT_CONTENT.manifesto.lines)
  })

  it('overlays tenet copy positionally without dropping designed tone/id', () => {
    const out = resolveOathContent({
      tenets: { items: [{ title: 'NEW TITLE' }] },
    })
    expect(out.tenets.items).toHaveLength(OATH_DEFAULT_CONTENT.tenets.items.length)
    expect(out.tenets.items[0].title).toBe('NEW TITLE')
    expect(out.tenets.items[0].id).toBe(OATH_DEFAULT_CONTENT.tenets.items[0].id)
    expect(out.tenets.items[0].tone).toBe(
      OATH_DEFAULT_CONTENT.tenets.items[0].tone,
    )
    expect(out.tenets.items[1].title).toBe(
      OATH_DEFAULT_CONTENT.tenets.items[1].title,
    )
  })

  it('merges product taglines by slug over the defaults', () => {
    const out = resolveOathContent({
      products: { taglines: { 'the-oath-stringer': 'Cut for war.' } },
    })
    expect(out.products.taglines['the-oath-stringer']).toBe('Cut for war.')
    expect(out.products.taglines['the-oath-oversized-tee']).toBe(
      OATH_DEFAULT_CONTENT.products.taglines['the-oath-oversized-tee'],
    )
  })
})
