import { describe, expect, it } from 'vitest'
import { resolveOathModernContent } from '../resolveOathModernContent'
import { OM_DEFAULT_CONTENT } from '../oathModernContent.defaults'

describe('resolveOathModernContent', () => {
  it('renders the full designed page from an empty/blank blob', () => {
    for (const raw of [undefined, null, {}, 'garbage', 42]) {
      const c = resolveOathModernContent(raw)
      expect(c.threshold.heading).toBe(OM_DEFAULT_CONTENT.threshold.heading)
      expect(c.oath.lines).toEqual(OM_DEFAULT_CONTENT.oath.lines)
      expect(c.collection.viewAllHref).toBe('/shop')
      expect(c.conversion.tagline).toBe('Forged Under Pressure')
    }
  })

  it('merges overrides and falls back per-field on blank strings', () => {
    const c = resolveOathModernContent({
      threshold: { heading: 'New Heading', body: '   ' },
      conversion: { primaryCta: { label: 'Buy now', href: '/shop/compression-tee' } },
    })
    // Overridden.
    expect(c.threshold.heading).toBe('New Heading')
    expect(c.conversion.primaryCta.label).toBe('Buy now')
    expect(c.conversion.primaryCta.href).toBe('/shop/compression-tee')
    // Whitespace counts as "not set" → designed default restored.
    expect(c.threshold.body).toBe(OM_DEFAULT_CONTENT.threshold.body)
    // Untouched sections keep defaults.
    expect(c.pressure.vows).toEqual(OM_DEFAULT_CONTENT.pressure.vows)
  })

  it('degrades a foreign/legacy blob to defaults (strict schema, no crash)', () => {
    // The retired Theoath Modern shape (hero/techKnit/...) is rejected by the
    // strict schema, so the page renders its designed defaults rather than throwing.
    const c = resolveOathModernContent({ hero: { heading: 'stale' }, techKnit: {} })
    expect(c.threshold.heading).toBe(OM_DEFAULT_CONTENT.threshold.heading)
  })

  it('keeps vow ids stable when overriding label/line index-wise', () => {
    const c = resolveOathModernContent({
      pressure: { vows: [{ label: 'Load' }] },
    })
    expect(c.pressure.vows[0].id).toBe('pressure')
    expect(c.pressure.vows[0].label).toBe('Load')
    // Blank line fell back to the designed default for that vow.
    expect(c.pressure.vows[0].line).toBe(OM_DEFAULT_CONTENT.pressure.vows[0].line)
  })
})
