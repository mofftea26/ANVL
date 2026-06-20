import { describe, expect, it } from 'vitest'
import { toOathContentSlice, toOathFormValues } from '../landingContentForm'

describe('landingContentForm conversions', () => {
  it('maps an empty slice to all-blank form values', () => {
    const values = toOathFormValues(undefined)
    expect(values.hero.headline).toBe('')
    expect(values.manifesto.linesText).toBe('')
    expect(values.tenets.items).toHaveLength(4)
    expect(values.tenets.items[0]).toEqual({ title: '', line: '', marker: '' })
    expect(values.products.taglines).toEqual([])
  })

  it('drops blank fields so the stored blob only carries overrides', () => {
    const values = toOathFormValues(undefined)
    values.hero.headline = 'STRUCK FROM STEEL'
    values.finale.primaryCtaHref = '/shop'
    const slice = toOathContentSlice(values)
    expect(slice).toEqual({
      hero: { headline: 'STRUCK FROM STEEL' },
      finale: { primaryCta: { href: '/shop' } },
    })
  })

  it('round-trips a populated slice through form values', () => {
    const original = {
      hero: {
        headline: 'FORGED',
        primaryCta: { label: 'Go', href: '#products' },
      },
      manifesto: { lines: ['One.', 'Two.'] },
      tenets: { items: [{ title: 'First' }, {}, {}, {}] },
      products: { taglines: { 'a-piece': 'A line.' } },
    }
    const values = toOathFormValues(original)
    expect(values.manifesto.linesText).toBe('One.\nTwo.')
    expect(values.products.taglines).toEqual([{ slug: 'a-piece', line: 'A line.' }])

    const slice = toOathContentSlice(values)
    expect(slice.hero?.headline).toBe('FORGED')
    expect(slice.hero?.primaryCta).toEqual({ label: 'Go', href: '#products' })
    expect(slice.manifesto?.lines).toEqual(['One.', 'Two.'])
    expect(slice.tenets?.items?.[0]).toEqual({ title: 'First' })
    expect(slice.products?.taglines).toEqual({ 'a-piece': 'A line.' })
  })

  it('clamps manifesto lines to six and skips incomplete taglines', () => {
    const values = toOathFormValues(undefined)
    values.manifesto.linesText = ['1', '2', '3', '4', '5', '6', '7'].join('\n')
    values.products.taglines = [
      { slug: 'only-slug', line: '' },
      { slug: '', line: 'only line' },
      { slug: 'good', line: 'Good line.' },
    ]
    const slice = toOathContentSlice(values)
    expect(slice.manifesto?.lines).toHaveLength(6)
    expect(slice.products?.taglines).toEqual({ good: 'Good line.' })
  })
})
