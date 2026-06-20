import { describe, expect, it } from 'vitest'
import {
  STOREFRONT_PAGE_REGISTRY,
  getStorefrontPageSlots,
  isStorefrontPageKey,
  listStorefrontPages,
} from '../storefrontPageSlots'

describe('storefront page asset registry', () => {
  it('has unique page keys', () => {
    const keys = STOREFRONT_PAGE_REGISTRY.map((p) => p.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('defines well-formed slots with unique keys per page', () => {
    for (const page of STOREFRONT_PAGE_REGISTRY) {
      expect(page.name.length).toBeGreaterThan(0)
      expect(page.route.startsWith('/')).toBe(true)
      expect(page.slots.length).toBeGreaterThan(0)
      const slotKeys = page.slots.map((s) => s.key)
      expect(new Set(slotKeys).size).toBe(slotKeys.length)
      for (const slot of page.slots) {
        expect(slot.key.length).toBeGreaterThan(0)
        expect(slot.label.length).toBeGreaterThan(0)
      }
    }
  })

  it('recognizes registered keys and rejects unknown ones', () => {
    expect(isStorefrontPageKey('shop')).toBe(true)
    expect(isStorefrontPageKey('the-oath')).toBe(false)
    expect(isStorefrontPageKey('nope')).toBe(false)
  })

  it('returns slots by key and an empty list for unknown pages', () => {
    expect(getStorefrontPageSlots('shop').length).toBeGreaterThan(0)
    expect(getStorefrontPageSlots('nope')).toEqual([])
  })

  it('lists picker metadata without slot bodies', () => {
    const pages = listStorefrontPages()
    expect(pages.length).toBe(STOREFRONT_PAGE_REGISTRY.length)
    for (const page of pages) {
      expect(page).not.toHaveProperty('slots')
      expect(typeof page.name).toBe('string')
    }
  })
})
