import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LANDING_PAGE_KEY,
  isLandingPageKey,
  listLandingPages,
  resolveActiveLandingPageKey,
  resolveLandingPage,
} from '../registry'
import { getActiveLandingPageKey } from '../activeLandingPage'

describe('landing page registry', () => {
  it('exposes the default page', () => {
    expect(isLandingPageKey(DEFAULT_LANDING_PAGE_KEY)).toBe(true)
    expect(resolveLandingPage(DEFAULT_LANDING_PAGE_KEY).key).toBe(
      DEFAULT_LANDING_PAGE_KEY,
    )
  })

  it('falls back to the default page for unknown keys', () => {
    expect(resolveLandingPage('does-not-exist').key).toBe(
      DEFAULT_LANDING_PAGE_KEY,
    )
    expect(resolveLandingPage(null).key).toBe(DEFAULT_LANDING_PAGE_KEY)
    expect(resolveLandingPage(undefined).key).toBe(DEFAULT_LANDING_PAGE_KEY)
  })

  it('normalizes an arbitrary CMS value to a valid key', () => {
    expect(resolveActiveLandingPageKey('the-oath')).toBe('the-oath')
    expect(resolveActiveLandingPageKey('garbage')).toBe(DEFAULT_LANDING_PAGE_KEY)
  })

  it('collapses the retired the-oath-2 key to the single merged page', () => {
    expect(isLandingPageKey('the-oath-2')).toBe(false)
    expect(resolveLandingPage('the-oath-2').key).toBe('the-oath')
    expect(DEFAULT_LANDING_PAGE_KEY).toBe('the-oath')
  })

  it('resolves the active key through the CMS seam', () => {
    expect(getActiveLandingPageKey()).toBe(DEFAULT_LANDING_PAGE_KEY)
    expect(getActiveLandingPageKey('garbage')).toBe(DEFAULT_LANDING_PAGE_KEY)
  })

  it('only lists available pages with picker metadata', () => {
    const pages = listLandingPages()
    expect(pages.length).toBeGreaterThan(0)
    for (const page of pages) {
      expect(page.isAvailable).toBe(true)
      expect(page).not.toHaveProperty('component')
      expect(typeof page.name).toBe('string')
      expect(typeof page.description).toBe('string')
    }
  })
})
