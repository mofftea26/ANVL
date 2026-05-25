import { describe, expect, it } from 'vitest'

import { createDefaultTheOathDrop } from '@/features/admin/drops/drops.defaults'
import {
  parseRemoteDropRecord,
  resolveRemoteClientDropId,
} from '@/features/admin/cmsRemote/adminCmsDropRemoteParse'

describe('adminCmsDropRemoteParse', () => {
  it('resolves client id from column when body fails strict parse', () => {
    const oath = createDefaultTheOathDrop()
    const incompleteBody = {
      id: oath.id,
      slug: oath.slug,
      title: oath.title,
      name: oath.name,
    }

    const id = resolveRemoteClientDropId(incompleteBody, {
      client_drop_id: 'client-from-column',
    })
    expect(id).toBe('client-from-column')
  })

  it('builds a merged drop when body is missing newer required fields', () => {
    const oath = createDefaultTheOathDrop()
    const incompleteBody = {
      id: oath.id,
      slug: oath.slug,
      title: 'Legacy Drop',
      name: 'Legacy Drop',
      dropNumber: '01',
      status: 'active',
      isActive: true,
      createdAt: oath.createdAt,
      updatedAt: oath.updatedAt,
      productIds: [],
    }

    const drop = parseRemoteDropRecord(incompleteBody, {
      slug: oath.slug,
      status: 'active',
      client_drop_id: oath.id,
    })

    expect(drop?.id).toBe(oath.id)
    expect(drop?.title).toBe('Legacy Drop')
    expect(drop?.status).toBe('active')
    expect(drop?.landingContent.hero.title.length).toBeGreaterThan(0)
  })
})
