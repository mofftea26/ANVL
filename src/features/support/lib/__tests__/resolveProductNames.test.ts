import { describe, expect, it } from 'vitest'
import { orderPerProduct } from '@/features/support/lib/resolveProductNames'

describe('orderPerProduct', () => {
  const names = [
    { slug: 'oath-tee', name: 'The Oath Tee' },
    { slug: 'oath-stringer', name: 'The Oath Stringer' },
  ]

  it('orders authored entries by catalog order and attaches display names', () => {
    const result = orderPerProduct(
      { 'oath-stringer': 1, 'oath-tee': 2 },
      names,
    )
    expect(result.map((r) => r.slug)).toEqual(['oath-tee', 'oath-stringer'])
    expect(result[0]).toMatchObject({ slug: 'oath-tee', name: 'The Oath Tee', entry: 2 })
  })

  it('appends authored slugs missing from the catalog, falling back to the slug', () => {
    const result = orderPerProduct({ 'ghost-piece': 9, 'oath-tee': 1 }, names)
    expect(result.map((r) => r.slug)).toEqual(['oath-tee', 'ghost-piece'])
    expect(result[1]).toMatchObject({ slug: 'ghost-piece', name: 'ghost-piece' })
  })

  it('returns an empty list when nothing is authored', () => {
    expect(orderPerProduct({}, names)).toEqual([])
  })
})
