/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from 'vitest'

import { createEmptyDrop } from '@/features/admin/drops/drops.defaults'
import {
  persistDropsState,
  readDropsArray,
  resetDropSystemHydrationGate,
  saveDrop,
  setActiveDrop,
} from '@/features/admin/drops/drops.service'
import { readActiveDropIdRaw, readDropsRaw } from '@/features/admin/drops/drops.storage'

describe('drop schedule persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    resetDropSystemHydrationGate()
  })

  it('keeps scheduled status after activation time until cron promotes', () => {
    const drop = createEmptyDrop()
    const past = new Date(Date.now() - 60_000).toISOString()
    const scheduled = {
      ...drop,
      status: 'scheduled' as const,
      scheduledActivationAt: past,
      isActive: false,
    }

    persistDropsState([scheduled], null)

    const [saved] = (JSON.parse(readDropsRaw()!) as { drops: typeof scheduled[] }).drops
    expect(saved.status).toBe('scheduled')
    expect(saved.scheduledActivationAt).toBe(past)
    expect(saved.isActive).toBe(false)
  })

  it('preserves active status after remote promotion', () => {
    const drop = createEmptyDrop()
    const active = {
      ...drop,
      status: 'active' as const,
      isActive: true,
    }

    persistDropsState([active], null)

    const [saved] = readDropsArray()
    expect(saved.status).toBe('active')
    expect(saved.isActive).toBe(true)
    expect(saved.scheduledActivationAt).toBeUndefined()
  })

  it('keeps schedule when saving on the active pointer drop', () => {
    const drop = createEmptyDrop()
    saveDrop(drop)
    setActiveDrop(drop.id)

    expect(readActiveDropIdRaw()).toBe(drop.id)

    const future = new Date(Date.now() + 60 * 60_000).toISOString()
    saveDrop({
      ...readDropsArray()[0],
      scheduledActivationAt: future,
      releaseDate: future,
    })

    const [saved] = readDropsArray()
    expect(saved.status).toBe('scheduled')
    expect(saved.scheduledActivationAt).toBe(future)
    expect(saved.isActive).toBe(false)
  })

  it('normalizes multiple local actives to a single active drop', () => {
    const a = createEmptyDrop()
    const b = createEmptyDrop()
    const activeA = { ...a, status: 'active' as const, isActive: true }
    const activeB = { ...b, status: 'active' as const, isActive: true }

    persistDropsState([activeA, activeB], b.id)

    const body = JSON.parse(readDropsRaw()!) as { drops: typeof activeA[] }
    expect(body.drops.find((d) => d.id === a.id)?.status).toBe('inactive')
    expect(body.drops.find((d) => d.id === b.id)?.status).toBe('active')
    expect(readActiveDropIdRaw()).toBe(b.id)
  })

  it('clears schedule when activating on save', () => {
    const drop = createEmptyDrop()
    const future = new Date(Date.now() + 60 * 60_000).toISOString()
    saveDrop({
      ...drop,
      scheduledActivationAt: future,
      releaseDate: future,
    })

    saveDrop(
      {
        ...readDropsArray()[0],
        scheduledActivationAt: future,
        releaseDate: future,
      },
      { makeActive: true },
    )

    const [saved] = readDropsArray()
    expect(saved.status).toBe('active')
    expect(saved.isActive).toBe(true)
    expect(saved.scheduledActivationAt).toBeUndefined()
  })
})
