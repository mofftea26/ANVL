import { describe, expect, it } from 'vitest'
import { formatMoney } from '@/shared/lib/money'

/**
 * Every customer-visible price goes through this. Assertions use `en-US`
 * explicitly so they do not depend on the runtime's locale.
 */
describe('formatMoney', () => {
  it('formats the currency the adapter actually returned', () => {
    expect(formatMoney(85, 'USD', 'en-US')).toBe('$85')
    expect(formatMoney(85, 'EUR', 'en-US')).toBe('€85')
    expect(formatMoney(85, 'GBP', 'en-US')).toBe('£85')
  })

  it('renders cents only when the price has them', () => {
    expect(formatMoney(85, 'USD', 'en-US')).toBe('$85')
    expect(formatMoney(85.5, 'USD', 'en-US')).toBe('$85.50')
    expect(formatMoney(85.99, 'USD', 'en-US')).toBe('$85.99')
  })

  it('groups thousands', () => {
    expect(formatMoney(1250, 'USD', 'en-US')).toBe('$1,250')
  })

  it('defaults to USD when no currency is supplied', () => {
    // Covers carts persisted before CartLine carried a currency.
    expect(formatMoney(40, undefined, 'en-US')).toBe('$40')
    expect(formatMoney(40, '', 'en-US')).toBe('$40')
    expect(formatMoney(40, '   ', 'en-US')).toBe('$40')
  })

  it('falls back rather than throwing on a malformed ISO code', () => {
    // Intl throws on a bad code; a bad value from a CMS/adapter must never
    // blank out or crash a price.
    expect(formatMoney(40, 'NOT_A_CODE', 'en-US')).toBe('$40')
  })

  it('returns an empty string for a non-numeric amount instead of NaN', () => {
    expect(formatMoney(null, 'USD', 'en-US')).toBe('')
    expect(formatMoney(undefined, 'USD', 'en-US')).toBe('')
    expect(formatMoney(Number.NaN, 'USD', 'en-US')).toBe('')
    expect(formatMoney(Number.POSITIVE_INFINITY, 'USD', 'en-US')).toBe('')
  })

  it('handles zero', () => {
    expect(formatMoney(0, 'USD', 'en-US')).toBe('$0')
  })
})
