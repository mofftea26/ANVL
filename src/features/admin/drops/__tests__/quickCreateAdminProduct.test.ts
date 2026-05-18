import { describe, expect, it } from 'vitest'
import {
  buildQuickCreateAdminProduct,
  buildSkuForVariant,
  parseQuickProductSizeLabels,
} from '@/features/admin/drops/quickCreateAdminProduct'
import { createEmptyAdminProduct } from '@/features/admin/products/products.defaults'
import type { AdminProduct } from '@/features/admin/products/products.types'

const empty = () => createEmptyAdminProduct('2026-05-18T00:00:00.000Z')

describe('parseQuickProductSizeLabels', () => {
  it('splits comma, semicolon, and newlines', () => {
    expect(parseQuickProductSizeLabels('S, M, L')).toEqual(['S', 'M', 'L'])
    expect(parseQuickProductSizeLabels('S;M\nXL')).toEqual(['S', 'M', 'XL'])
  })

  it('trims and drops empties', () => {
    expect(parseQuickProductSizeLabels(' S , , M ')).toEqual(['S', 'M'])
  })
})

describe('buildSkuForVariant', () => {
  it('returns undefined when base empty', () => {
    expect(buildSkuForVariant({ skuBase: '  ', colorName: 'Black', sizeLabel: 'M' })).toBeUndefined()
  })

  it('concatenates trimmed pieces', () => {
    expect(
      buildSkuForVariant({ skuBase: 'OATH', colorName: 'Graphite ', sizeLabel: ' L ' }),
    ).toBe('OATH-Graphite-L')
  })
})

describe('buildQuickCreateAdminProduct', () => {
  it('assigns quantity as stockQuantity on each variant row', () => {
    const catalog = [{ slug: 'other' }] as AdminProduct[]
    const prepared = buildQuickCreateAdminProduct({
      catalog,
      linkToDropId: 'drop-1',
      name: 'Test Tee',
      explicitSlug: '',
      price: 49,
      currency: 'USD',
      category: 'Apparel',
      shortDescription: 'Short',
      description: 'Long',
      status: 'draft',
      isActive: false,
      sourceType: 'drop',
      tags: ['limited'],
      primaryImageUrl: '',
      colorName: 'Black',
      colorHex: '#000',
      sizesRaw: 'S, M',
      skuBase: 'TT',
      quantity: 42,
      details: { fit: '', fabric: '', gsm: '' },
      template: empty(),
    })

    expect(prepared.availability).toHaveLength(2)
    expect(prepared.availability.every((r) => r.stockQuantity === 42)).toBe(true)
    expect(prepared.availability.every((r) => r.reservedQuantity === 0)).toBe(true)
    expect(prepared.dropIds).toEqual(['drop-1'])
  })

  it('unique slug avoids catalog collisions', () => {
    const catalog = [{ slug: 'my-piece' }, { slug: 'my-piece-2' }] as AdminProduct[]
    const a = buildQuickCreateAdminProduct({
      catalog,
      linkToDropId: null,
      name: 'My Piece',
      explicitSlug: 'my-piece',
      price: 0,
      currency: 'USD',
      category: 'X',
      shortDescription: '',
      description: '',
      status: 'draft',
      isActive: false,
      sourceType: 'individual',
      tags: [],
      primaryImageUrl: '',
      colorName: 'C',
      colorHex: '#fff',
      sizesRaw: 'M',
      skuBase: '',
      quantity: 0,
      details: { fit: '', fabric: '', gsm: '' },
      template: empty(),
    })
    expect(a.slug).toBe('my-piece-3')
  })
})
