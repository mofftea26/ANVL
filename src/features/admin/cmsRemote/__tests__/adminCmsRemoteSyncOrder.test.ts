import { describe, expect, it } from 'vitest'
import type { Drop } from '@/features/admin/drops/drops.types'
import { createDefaultTheOathDrop } from '@/features/admin/drops/drops.defaults'
import {
  activeDropRowIdsToDemote,
  clampLocalDropsForSync,
  orderDropsForRemoteSync,
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

describe('shouldDemoteRemoteActiveRows', () => {
  it('is false when local has no intentional active drop to push', () => {
    const scheduled = makeDrop('drop-a', 'scheduled', false)
    expect(shouldDemoteRemoteActiveRows([scheduled], null)).toBe(false)
    expect(shouldDemoteRemoteActiveRows([scheduled], 'drop-a')).toBe(false)
  })

  it('is true only when the local active pointer targets an active drop', () => {
    const active = makeDrop('drop-b', 'active', true)
    const scheduled = makeDrop('drop-a', 'scheduled', false)
    expect(shouldDemoteRemoteActiveRows([active, scheduled], 'drop-b')).toBe(true)
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
