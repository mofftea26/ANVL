import { afterEach, describe, expect, it } from 'vitest'
import {
  ACTIVE_LANDING_PAGE_STORAGE_KEY,
  DEFAULT_ACTIVE_LANDING_PAGE,
  parseActiveLandingPageUnknown,
  readActiveLandingPageFromStorage,
  setActiveLandingPageKey,
} from '../landingPageActiveKey.settings'
import { DEFAULT_LANDING_PAGE_KEY } from '@/features/landingPages/registry'

afterEach(() => {
  window.localStorage.removeItem(ACTIVE_LANDING_PAGE_STORAGE_KEY)
})

describe('landingPageActiveKey settings', () => {
  it('defaults to the registry default key', () => {
    expect(DEFAULT_ACTIVE_LANDING_PAGE.key).toBe(DEFAULT_LANDING_PAGE_KEY)
    expect(readActiveLandingPageFromStorage().key).toBe(DEFAULT_LANDING_PAGE_KEY)
  })

  it('clamps an unknown stored key to the default', () => {
    const parsed = parseActiveLandingPageUnknown({
      key: 'totally-unknown',
      updatedAt: '2026-06-26T00:00:00.000Z',
    })
    expect(parsed.key).toBe(DEFAULT_LANDING_PAGE_KEY)
  })

  it('round-trips a valid key through storage', () => {
    setActiveLandingPageKey('the-oath')
    expect(readActiveLandingPageFromStorage().key).toBe('the-oath')
  })

  it('rejects malformed persisted JSON shape', () => {
    expect(parseActiveLandingPageUnknown(null).key).toBe(DEFAULT_LANDING_PAGE_KEY)
    expect(parseActiveLandingPageUnknown({ nope: true }).key).toBe(
      DEFAULT_LANDING_PAGE_KEY,
    )
  })
})
