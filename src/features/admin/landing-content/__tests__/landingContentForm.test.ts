import { describe, expect, it } from 'vitest'
import { toOathContentSlice, toOathFormValues } from '../landingContentForm'

describe('landingContentForm conversions', () => {
  it('maps an empty slice to all-blank form values', () => {
    const values = toOathFormValues(undefined)
    expect(values.hero.headline).toBe('')
    expect(values.manifesto.linesText).toBe('')
    expect(values.tenets.items).toHaveLength(3)
    expect(values.tenets.items[0].title).toBe('')
    expect(values.tenets.items[0].subtitle).toBe('')
    expect(values.tenets.items[0].modelId).toBe('')
    expect(values.tenets.items[0].hotspots.length).toBeGreaterThan(0)
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

  it('persists flexible tenet count and media ids', () => {
    const values = toOathFormValues(undefined)
    values.tenets.items[0].title = 'One'
    values.tenets.items[0].mediaId = 'img-1'
    values.tenets.items[1].title = 'Two'
    values.tenets.items[2].title = 'Three'
    const slice = toOathContentSlice(values)
    expect(slice.tenets?.items).toHaveLength(3)
    expect(slice.tenets?.items?.[0]).toEqual({ title: 'One', mediaId: 'img-1' })
  })

  it('persists explicit mediaId clears against the previous slice', () => {
    const previous = {
      tenets: {
        items: [{ mediaId: 'img-1' }, { mediaId: 'img-2' }, {}, {}],
      },
    }
    const values = toOathFormValues(previous)
    values.tenets.items[0].mediaId = ''
    values.tenets.items[1].mediaId = 'img-2'

    const slice = toOathContentSlice(values, previous)
    expect(slice.tenets?.items?.[0]).toEqual({ mediaId: '' })
    expect(slice.tenets?.items?.[1]).toEqual({ mediaId: 'img-2' })
  })

  it('persists removed tenets as a shorter items array', () => {
    const previous = {
      tenets: {
        items: [{ title: 'One', mediaId: 'img-1' }, { title: 'Two' }, { title: 'Three' }],
      },
    }
    const values = toOathFormValues(previous)
    values.tenets.items.splice(1, 1)

    const slice = toOathContentSlice(values, previous)
    expect(slice.tenets?.items).toHaveLength(2)
    expect(slice.tenets?.items?.[0]).toEqual({ title: 'One', mediaId: 'img-1' })
    expect(slice.tenets?.items?.[1]).toEqual({ title: 'Three' })
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
