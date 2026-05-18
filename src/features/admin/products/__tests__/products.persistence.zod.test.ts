import { describe, expect, it } from 'vitest'
import {
  persistedProductSchema,
  productsPersistedPayloadSchema,
} from '@/features/admin/products/products.persistence.zod'
import { createSeedAdminProductsFromMock } from '@/features/admin/products/products.defaults'

const seed = createSeedAdminProductsFromMock('2026-05-17T00:00:00.000Z')

describe('persistedProductSchema (SEC-07 / Phase C2)', () => {
  it('accepts a seed admin product', () => {
    const result = persistedProductSchema.safeParse(seed[0])
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.format(), null, 2))
    }
    expect(result.success).toBe(true)
  })

  it('rejects when status is unknown', () => {
    expect(
      persistedProductSchema.safeParse({ ...seed[0], status: 'super-active' })
        .success,
    ).toBe(false)
  })

  it('rejects when price is not a number', () => {
    expect(
      persistedProductSchema.safeParse({ ...seed[0], price: 'free' }).success,
    ).toBe(false)
  })

  it('rejects when sourceType is not in the enum', () => {
    expect(
      persistedProductSchema.safeParse({
        ...seed[0],
        sourceType: 'bundle',
      }).success,
    ).toBe(false)
  })

  it('rejects when dropIds is not an array', () => {
    expect(
      persistedProductSchema.safeParse({
        ...seed[0],
        dropIds: 'oath',
      }).success,
    ).toBe(false)
  })

  it('rejects when a required field is missing', () => {
    const { slug: _slug, ...incomplete } = seed[0]!
    expect(persistedProductSchema.safeParse(incomplete).success).toBe(false)
  })

  it('rejects when availability.stockQuantity is not a number', () => {
    const brokenAvail = seed[0]!.availability.map((a, i) =>
      i === 0 ? { ...a, stockQuantity: '12' as unknown as number } : a,
    )
    expect(
      persistedProductSchema.safeParse({
        ...seed[0],
        availability: brokenAvail,
      }).success,
    ).toBe(false)
  })
})

describe('productsPersistedPayloadSchema', () => {
  it('accepts a payload with one valid product', () => {
    expect(
      productsPersistedPayloadSchema.safeParse({ products: seed }).success,
    ).toBe(true)
  })

  it('accepts an empty products array (service falls back to seeds)', () => {
    expect(
      productsPersistedPayloadSchema.safeParse({ products: [] }).success,
    ).toBe(true)
  })

  it('rejects a payload missing the products key', () => {
    expect(
      productsPersistedPayloadSchema.safeParse({ items: [] }).success,
    ).toBe(false)
  })
})
