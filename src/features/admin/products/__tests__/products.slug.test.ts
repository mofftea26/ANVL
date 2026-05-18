import { describe, expect, it } from 'vitest'
import { uniqueProductSlug, slugifyProductHandle } from '@/features/admin/products/products.slug'
import type { AdminProduct } from '@/features/admin/products/products.types'

describe('products.slug', () => {
  it('slugifies handles', () => {
    expect(slugifyProductHandle('  Hello World!!  ')).toBe('hello-world')
    expect(slugifyProductHandle('___')).toBe('piece')
  })

  it('resolves collisions', () => {
    const catalog = [{ slug: 'test-piece' }, { slug: 'test-piece-2' }] as AdminProduct[]
    expect(uniqueProductSlug('Test Piece', catalog)).toBe('test-piece-3')
  })
})
