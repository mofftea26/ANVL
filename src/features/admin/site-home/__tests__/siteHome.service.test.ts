import { beforeEach, describe, expect, it } from 'vitest'
import {
  getSiteHomeExtrasContent,
  saveSiteHomeExtrasContent,
} from '@/features/admin/site-home/siteHome.service'
import { readSiteHomeExtrasRaw } from '@/features/admin/site-home/siteHome.storage'

describe('siteHome.service', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('seeds defaults when storage is empty', () => {
    const content = getSiteHomeExtrasContent()
    expect(content.campaigns.length).toBeGreaterThan(0)
    expect(content.lookbook.length).toBeGreaterThan(0)
  })

  it('persists campaigns and lookbook rows', () => {
    saveSiteHomeExtrasContent({
      campaigns: [{ id: 'c1', title: 'Summer', description: 'Heat' }],
      lookbook: [{ id: 'l1', alt: 'Look', src: '/look.webp' }],
      updatedAt: new Date().toISOString(),
    })

    const raw = readSiteHomeExtrasRaw()
    expect(raw).toBeTruthy()
    const parsed = getSiteHomeExtrasContent()
    expect(parsed.campaigns).toEqual([
      { id: 'c1', title: 'Summer', description: 'Heat' },
    ])
    expect(parsed.lookbook).toEqual([{ id: 'l1', alt: 'Look', src: '/look.webp' }])
  })

  it('drops empty campaign titles and blank lookbook src on save', () => {
    saveSiteHomeExtrasContent({
      campaigns: [{ id: 'c1', title: '   ', description: 'x' }],
      lookbook: [{ id: 'l1', alt: 'x', src: '' }],
      updatedAt: new Date().toISOString(),
    })

    const parsed = getSiteHomeExtrasContent()
    expect(parsed.campaigns).toEqual([])
    expect(parsed.lookbook).toEqual([])
  })
})
