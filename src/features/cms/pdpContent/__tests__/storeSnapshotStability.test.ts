import { describe, expect, it } from 'vitest'
import { readPdpContentFromStorage } from '@/features/cms/pdpContent/pdpContent.settings'
import { readShopConfigFromStorage } from '@/features/cms/shop/shopExperience.settings'

/**
 * Both stores feed `useSyncExternalStore` directly, which requires getSnapshot
 * to return a STABLE reference until the underlying value changes — otherwise
 * the admin editors re-render every tick and crash with "Maximum update depth
 * exceeded". These guard against regressing to a fresh-object-per-call read.
 */
describe('CMS store snapshots are stable (useSyncExternalStore contract)', () => {
  it('readPdpContentFromStorage returns the same reference across calls', () => {
    expect(readPdpContentFromStorage()).toBe(readPdpContentFromStorage())
  })

  it('readShopConfigFromStorage returns the same reference across calls', () => {
    expect(readShopConfigFromStorage()).toBe(readShopConfigFromStorage())
  })
})
