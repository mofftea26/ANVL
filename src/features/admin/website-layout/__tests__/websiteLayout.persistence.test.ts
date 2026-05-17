/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from 'vitest'
import {
  getWebsiteLayoutContent,
} from '@/features/admin/website-layout/websiteLayout.service'
import { createDefaultWebsiteLayout } from '@/features/admin/website-layout/websiteLayout.defaults'
import { persistedWebsiteLayoutSchema } from '@/features/admin/website-layout/websiteLayout.persistence.zod'
import { ADMIN_STORAGE_KEYS } from '@/features/admin/storageKeys'

const KEY = ADMIN_STORAGE_KEYS.websiteLayout

beforeEach(() => {
  window.localStorage.clear()
})

describe('persistedWebsiteLayoutSchema (SEC-07 / Phase C2)', () => {
  it('accepts the default website layout', () => {
    const layout = createDefaultWebsiteLayout()
    const result = persistedWebsiteLayoutSchema.safeParse(layout)
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.format(), null, 2))
    }
    expect(result.success).toBe(true)
  })

  it('rejects when announcement is missing', () => {
    const layout = createDefaultWebsiteLayout()
    const broken: Record<string, unknown> = { ...layout }
    broken.header = { ...layout.header, announcement: undefined }
    expect(persistedWebsiteLayoutSchema.safeParse(broken).success).toBe(false)
  })

  it('rejects when headerLinks is not an array', () => {
    const layout = createDefaultWebsiteLayout()
    expect(
      persistedWebsiteLayoutSchema.safeParse({
        ...layout,
        header: { ...layout.header, headerLinks: 'oops' },
      }).success,
    ).toBe(false)
  })

  it('rejects when version is not a number', () => {
    const layout = createDefaultWebsiteLayout()
    expect(
      persistedWebsiteLayoutSchema.safeParse({ ...layout, version: '1' })
        .success,
    ).toBe(false)
  })
})

describe('getWebsiteLayoutContent (Phase C2 tamper guard)', () => {
  it('returns the default layout when storage is empty', () => {
    const layout = getWebsiteLayoutContent()
    expect(layout.header.headerLinks.length).toBeGreaterThan(0)
  })

  it('returns the default layout when JSON is malformed', () => {
    window.localStorage.setItem(KEY, '{not-json')
    expect(getWebsiteLayoutContent().header.headerLinks.length).toBeGreaterThan(
      0,
    )
  })

  it('returns the default layout when the payload misses required keys', () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ version: 1, header: { cartVisible: true } }),
    )
    const layout = getWebsiteLayoutContent()
    // The defaults always include footer + announcement; tampered shape
    // should not bleed through.
    expect(layout.footer).toBeDefined()
    expect(layout.header.announcement).toBeDefined()
  })

  it('round-trips a valid persisted layout', () => {
    const layout = createDefaultWebsiteLayout()
    window.localStorage.setItem(KEY, JSON.stringify(layout))
    expect(getWebsiteLayoutContent().header.headerLinks.length).toBe(
      layout.header.headerLinks.length,
    )
  })
})
