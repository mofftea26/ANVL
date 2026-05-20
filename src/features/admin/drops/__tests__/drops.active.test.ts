/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { createEmptyDrop } from '@/features/admin/drops/drops.defaults'
import {
  deactivateDrop,
  readDropsArray,
  resetAllLocalCmsKeys,
  saveDrop,
  setActiveDrop,
} from '@/features/admin/drops/drops.service'
import { readActiveDropIdRaw } from '@/features/admin/drops/drops.storage'

describe('drops.service active campaign', () => {
  beforeEach(() => {
    resetAllLocalCmsKeys()
  })

  it('deactivateDrop clears active id when the drop is currently active', () => {
    const drop = createEmptyDrop()
    saveDrop(drop)
    setActiveDrop(drop.id)

    expect(readActiveDropIdRaw()).toBe(drop.id)
    expect(readDropsArray().find((d) => d.id === drop.id)?.isActive).toBe(true)

    deactivateDrop(drop.id)

    expect(readActiveDropIdRaw()).toBeNull()
    expect(readDropsArray().find((d) => d.id === drop.id)?.isActive).toBe(false)
  })

  it('deactivateDrop is a no-op when another drop is active', () => {
    const a = createEmptyDrop()
    const b = createEmptyDrop()
    saveDrop(a)
    saveDrop(b)
    setActiveDrop(b.id)

    deactivateDrop(a.id)

    expect(readActiveDropIdRaw()).toBe(b.id)
    expect(readDropsArray().find((d) => d.id === b.id)?.isActive).toBe(true)
  })
})
