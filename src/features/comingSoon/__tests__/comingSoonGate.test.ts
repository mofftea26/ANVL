import { beforeEach, describe, expect, it } from 'vitest'
import {
  COMING_SOON_PREVIEW_STORAGE_KEY,
  isComingSoonExemptPath,
  readComingSoonPreviewBypass,
} from '@/features/comingSoon/lib/comingSoonGate'

describe('isComingSoonExemptPath', () => {
  it('exempts the admin tree only', () => {
    expect(isComingSoonExemptPath('/admin')).toBe(true)
    expect(isComingSoonExemptPath('/admin/coming-soon')).toBe(true)
    expect(isComingSoonExemptPath('/admin/theme')).toBe(true)
  })

  it('gates every public route', () => {
    for (const path of ['/', '/shop', '/shop/oath-tee', '/about', '/story', '/cart', '/auth/sign-in', '/account']) {
      expect(isComingSoonExemptPath(path)).toBe(false)
    }
  })

  it('does not exempt lookalike prefixes', () => {
    expect(isComingSoonExemptPath('/administration')).toBe(false)
  })
})

describe('readComingSoonPreviewBypass', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    window.history.replaceState({}, '', '/')
  })

  it('is off by default', () => {
    expect(readComingSoonPreviewBypass()).toBe(false)
  })

  it('arms via ?anvl-preview=live and persists for the session', () => {
    window.history.replaceState({}, '', '/?anvl-preview=live')
    expect(readComingSoonPreviewBypass()).toBe(true)
    window.history.replaceState({}, '', '/shop')
    expect(readComingSoonPreviewBypass()).toBe(true)
    expect(window.sessionStorage.getItem(COMING_SOON_PREVIEW_STORAGE_KEY)).toBe('1')
  })

  it('clears via ?anvl-preview=off', () => {
    window.sessionStorage.setItem(COMING_SOON_PREVIEW_STORAGE_KEY, '1')
    window.history.replaceState({}, '', '/?anvl-preview=off')
    expect(readComingSoonPreviewBypass()).toBe(false)
    expect(window.sessionStorage.getItem(COMING_SOON_PREVIEW_STORAGE_KEY)).toBeNull()
  })
})
