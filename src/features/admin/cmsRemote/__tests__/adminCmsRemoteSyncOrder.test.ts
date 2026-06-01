import { describe, expect, it } from 'vitest'
import type { Drop } from '@/features/admin/drops/drops.types'
import { createDefaultTheOathDrop } from '@/features/admin/drops/drops.defaults'
import {
  activeDropRowIdsToDemote,
  clampLocalDropsForSync,
  orderDropsForRemoteSync,
  resolveIntendedActiveClientIdForSync,
  shouldDemoteRemoteActiveRows,
} from '@/features/admin/cmsRemote/adminCmsRemoteSyncOrder'

function makeDrop(id: string, status: Drop['status'], isActive: boolean): Drop {
  return {
    ...createDefaultTheOathDrop(),
    id,
    slug: id,
    title: id,
    name: id,
    status,
    isActive,
  }
}

describe('orderDropsForRemoteSync', () => {
  it('places the intended active drop last', () => {
    const a = makeDrop('drop-a', 'inactive', false)
    const b = makeDrop('drop-b', 'active', true)
    const ordered = orderDropsForRemoteSync([b, a], 'drop-b')
    expect(ordered.map((d) => d.id)).toEqual(['drop-a', 'drop-b'])
  })

  it('clamps extra local actives before ordering', () => {
    const a = makeDrop('drop-a', 'active', true)
    const b = makeDrop('drop-b', 'active', true)
    const ordered = orderDropsForRemoteSync([a, b], 'drop-b')
    expect(ordered.find((d) => d.id === 'drop-a')?.status).toBe('inactive')
    expect(ordered.at(-1)?.id).toBe('drop-b')
    expect(ordered.at(-1)?.status).toBe('active')
  })
})

describe('clampLocalDropsForSync', () => {
  it('leaves only the selected client id active', () => {
    const a = makeDrop('drop-a', 'active', true)
    const b = makeDrop('drop-b', 'inactive', false)
    const out = clampLocalDropsForSync([a, b], 'drop-b')
    expect(out.find((d) => d.id === 'drop-a')?.status).toBe('inactive')
  })
})

describe('resolveIntendedActiveClientIdForSync', () => {
  it('returns the clamped active client id', () => {
    const a = makeDrop('drop-a', 'active', true)
    const b = makeDrop('drop-b', 'active', true)
    expect(resolveIntendedActiveClientIdForSync([a, b], 'drop-b')).toBe('drop-b')
  })

  it('returns null when no drop should be active', () => {
    const a = makeDrop('drop-a', 'inactive', false)
    expect(resolveIntendedActiveClientIdForSync([a], null)).toBeNull()
  })
})

describe('shouldDemoteRemoteActiveRows', () => {
  it('is false when remote has no active rows', () => {
    const scheduled = makeDrop('drop-a', 'scheduled', false)
    expect(shouldDemoteRemoteActiveRows([scheduled], null, [])).toBe(false)
  })

  it('is true when remote active differs from intended local active', () => {
    const active = makeDrop('drop-b', 'active', true)
    const scheduled = makeDrop('drop-a', 'scheduled', false)
    expect(
      shouldDemoteRemoteActiveRows(
        [active, scheduled],
        'drop-b',
        [{ id: 'db-a', client_drop_id: 'drop-a' }],
      ),
    ).toBe(true)
  })

  it('is false when remote active already matches intended', () => {
    const active = makeDrop('drop-b', 'active', true)
    expect(
      shouldDemoteRemoteActiveRows(
        [active],
        'drop-b',
        [{ id: 'db-b', client_drop_id: 'drop-b' }],
      ),
    ).toBe(false)
  })

  it('is true when local has no active but remote still has one', () => {
    const inactive = makeDrop('drop-a', 'inactive', false)
    expect(
      shouldDemoteRemoteActiveRows(
        [inactive],
        null,
        [{ id: 'db-a', client_drop_id: 'drop-a' }],
      ),
    ).toBe(true)
  })
})

describe('activeDropRowIdsToDemote', () => {
  it('keeps the row matching the intended active client id', () => {
    const ids = activeDropRowIdsToDemote(
      [
        { id: 'db-a', client_drop_id: 'drop-a' },
        { id: 'db-b', client_drop_id: 'drop-b' },
      ],
      'drop-b',
    )
    expect(ids).toEqual(['db-a'])
  })
})
