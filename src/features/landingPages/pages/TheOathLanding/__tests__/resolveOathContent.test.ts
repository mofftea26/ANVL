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

  it('overlays tenet copy on the default count when CMS stores a full row set', () => {
    const out = resolveOathContent({
      tenets: { items: [{ title: 'NEW TITLE' }, {}, {}, {}, {}] },
    })
    expect(out.tenets.items).toHaveLength(OATH_DEFAULT_CONTENT.tenets.items.length)
    expect(out.tenets.items[0].title).toBe('NEW TITLE')
    expect(out.tenets.items[0].id).toBe(OATH_DEFAULT_CONTENT.tenets.items[0].id)
    expect(out.tenets.items[1].title).toBe(
      OATH_DEFAULT_CONTENT.tenets.items[1].title,
    )
  })

  it('honours a shorter CMS tenet list', () => {
    const out = resolveOathContent({
      tenets: { items: [{ title: 'Only vow' }, { title: 'Second' }] },
    })
    expect(out.tenets.items).toHaveLength(2)
    expect(out.tenets.items[0].title).toBe('Only vow')
    expect(out.tenets.items[0].index).toBe('01')
    expect(out.tenets.items[1].index).toBe('02')
  })

  it('resolves tenet mediaId through mediaIndex', () => {
    const out = resolveOathContent(
      { tenets: { items: [{ mediaId: 'asset-1' }, {}, {}, {}] } },
      {
        mediaIndex: [
          {
            id: 'asset-1',
            path: 'cms-media/the-oath/hero.webp',
            alt: '',
            mime: 'image/webp',
            w: null,
            h: null,
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
    )
    expect(out.tenets.items[0].mediaUrl).toMatch(/hero\.webp/)
  })

  it('does not restore legacy slot media when CMS owns the tenet row', () => {
    const out = resolveOathContent(
      { tenets: { items: [{ mediaId: '' }, {}, {}, {}] } },
      {
        legacyAssets: { chapterMedia1: '/legacy/one.webp' },
      },
    )
    expect(out.tenets.items[0].mediaUrl).toBeUndefined()
  })

  it('treats missing mediaId on a CMS row as no image (no legacy fallback)', () => {
    const out = resolveOathContent(
      { tenets: { items: [{ title: 'Only copy' }] } },
      {
        legacyAssets: { chapterMedia1: '/legacy/one.webp' },
      },
    )
    expect(out.tenets.items[0].title).toBe('Only copy')
    expect(out.tenets.items[0].mediaUrl).toBeUndefined()
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
