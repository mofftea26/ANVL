import { describe, expect, it } from 'vitest'
import { parseSiteHomepageSettings } from '@/features/cms/siteHomepage.settings'

describe('parseSiteHomepageSettings', () => {
  it('migrates legacy default mode to custom', () => {
    const parsed = parseSiteHomepageSettings({
      mode: 'default',
      updatedAt: '2026-05-01T00:00:00.000Z',
    })
    expect(parsed.mode).toBe('custom')
    expect(parsed.updatedAt).toBe('2026-05-01T00:00:00.000Z')
  })
})
