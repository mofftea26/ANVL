/**
 * @vitest-environment jsdom
 *
 * Integration test for the SEC-07 tamper guard in products.service.ts.
 * Writes raw payloads to localStorage and asserts that getAdminProducts
 * returns the safe seed fallback instead of trusting the bad data.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { ADMIN_STORAGE_KEYS } from '@/features/admin/storageKeys'
import { getAdminProducts } from '@/features/admin/products/products.service'

const KEY = ADMIN_STORAGE_KEYS.products

beforeEach(() => {
  window.localStorage.clear()
})

describe('getAdminProducts (SEC-07 / Phase C2 tamper guard)', () => {
  it('returns seed defaults when storage is empty', () => {
    const products = getAdminProducts()
    expect(products.length).toBeGreaterThan(0)
    for (const p of products) {
      expect(typeof p.id).toBe('string')
      expect(typeof p.slug).toBe('string')
    }
  })

  it('returns seed defaults when the JSON is malformed', () => {
    window.localStorage.setItem(KEY, '{not-json')
    const products = getAdminProducts()
    expect(products.length).toBeGreaterThan(0)
  })

  it('returns seed defaults when the payload has the wrong wrapper shape', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ items: [] }))
    expect(getAdminProducts().length).toBeGreaterThan(0)
  })

  it('drops malformed rows but keeps valid neighbors', () => {
    // Seed first, then poison the array with a partial row.
    const seed = getAdminProducts()
    const tampered = {
      products: [
        seed[0],
        // Missing required `status`, `colors`, etc. — should be dropped.
        { id: 'evil', slug: 'evil', name: '<script>x</script>' },
      ],
    }
    window.localStorage.setItem(KEY, JSON.stringify(tampered))
    const reread = getAdminProducts()
    expect(reread.length).toBe(1)
    expect(reread[0]?.id).toBe(seed[0]?.id)
  })

  it('falls back to seed defaults when every row is malformed', () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ products: [{ id: 'x', whatever: true }] }),
    )
    const products = getAdminProducts()
    // Seed length is > 1 so we know it's not the lone bad row.
    expect(products.length).toBeGreaterThan(1)
    expect(products.find((p) => p.id === 'x')).toBeUndefined()
  })
})
