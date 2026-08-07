import { describe, expect, it } from 'vitest'
import { resolveCartVariantId } from '@/features/products/lib/resolveCartVariantId'

/**
 * This lookup decides whether a cart line can go through Shopify's hosted
 * checkout. A miss makes `createShopifyCheckout` refuse the cart, so the
 * fallback-key behaviour below is money-critical and was previously duplicated
 * across three call sites with no test anywhere.
 */
const product = (map?: Record<string, Record<string, string>>) =>
  ({ shop: map ? { variantIdByColorAndSize: map } : undefined }) as Parameters<
    typeof resolveCartVariantId
  >[0]

describe('resolveCartVariantId', () => {
  it('resolves a named colour + size', () => {
    const p = product({ Black: { M: 'gid://shopify/ProductVariant/1' } })
    expect(resolveCartVariantId(p, 'Black', 'M')).toBe('gid://shopify/ProductVariant/1')
  })

  it('falls back to the Default colour key when no colour is chosen', () => {
    // How the Shopify mapper keys a product with no real colourway option.
    const p = product({ Default: { L: 'gid://2' } })
    expect(resolveCartVariantId(p, '', 'L')).toBe('gid://2')
    expect(resolveCartVariantId(p, undefined, 'L')).toBe('gid://2')
  })

  it('falls back to the One Size key when no size is chosen', () => {
    const p = product({ Black: { 'One Size': 'gid://3' } })
    expect(resolveCartVariantId(p, 'Black', '')).toBe('gid://3')
    expect(resolveCartVariantId(p, 'Black', undefined)).toBe('gid://3')
  })

  it('falls back on both axes at once', () => {
    const p = product({ Default: { 'One Size': 'gid://4' } })
    expect(resolveCartVariantId(p, '', '')).toBe('gid://4')
  })

  it('returns undefined for an unknown colour or size rather than a wrong variant', () => {
    const p = product({ Black: { M: 'gid://5' } })
    expect(resolveCartVariantId(p, 'Bone', 'M')).toBeUndefined()
    expect(resolveCartVariantId(p, 'Black', 'XXL')).toBeUndefined()
  })

  it('returns undefined when the product carries no Shopify meta (seed/local catalog)', () => {
    expect(resolveCartVariantId(product(), 'Black', 'M')).toBeUndefined()
  })

  it('does not confuse a real colour named Default with the fallback', () => {
    const p = product({ Default: { M: 'gid://6' }, Black: { M: 'gid://7' } })
    expect(resolveCartVariantId(p, 'Default', 'M')).toBe('gid://6')
    expect(resolveCartVariantId(p, 'Black', 'M')).toBe('gid://7')
  })
})
