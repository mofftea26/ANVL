/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from 'vitest'
import {
  createDefaultTheOathDrop,
  createEmptyDrop,
  DEFAULT_OATH_DROP_ID,
} from '@/features/admin/drops/drops.defaults'
import {
  ensureOnlyTheOathDrop,
  needsOnlyTheOathDrop,
  readDropsArray,
  resetAllLocalCmsKeys,
  saveDrop,
} from '@/features/admin/drops/drops.service'
import {
  readActiveDropIdRaw,
  readRemoteDropDeleteQueue,
} from '@/features/admin/drops/drops.storage'
import { readSiteHomepageFromStorage } from '@/features/cms/siteHomepage.settings'

describe('ensureOnlyTheOathDrop', () => {
  beforeEach(() => {
    resetAllLocalCmsKeys()
  })

  it('replaces extra drops with a single active Oath drop', () => {
    const extra = createEmptyDrop()
    saveDrop(extra)
    saveDrop(createDefaultTheOathDrop())

    expect(needsOnlyTheOathDrop()).toBe(true)

    const oath = ensureOnlyTheOathDrop()

    expect(oath.id).toBe(DEFAULT_OATH_DROP_ID)
    expect(oath.status).toBe('active')
    expect(oath.acts).toHaveLength(7)
    expect(readDropsArray()).toHaveLength(1)
    expect(readDropsArray()[0]?.id).toBe(DEFAULT_OATH_DROP_ID)
    expect(readActiveDropIdRaw()).toBe(DEFAULT_OATH_DROP_ID)
    expect(readRemoteDropDeleteQueue()).toContain(extra.id)
    expect(readSiteHomepageFromStorage().mode).toBe('custom')
    expect(needsOnlyTheOathDrop()).toBe(false)
  })

  it('is a no-op list shape when only Oath exists', () => {
    ensureOnlyTheOathDrop()
    expect(readDropsArray()).toHaveLength(1)
    expect(needsOnlyTheOathDrop()).toBe(false)
  })
})
