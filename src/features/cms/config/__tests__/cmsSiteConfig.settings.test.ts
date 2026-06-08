/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from 'vitest'
import {
  FONT_CONFIG_STORAGE_KEY,
  readFontLibraryFromStorage,
  readThemeLibraryFromStorage,
  THEME_CONFIG_STORAGE_KEY,
  writeFontLibraryToStorage,
  writeThemeLibraryToStorage,
} from '@/features/cms/config/cmsSiteConfig.settings'
import { DEFAULT_FONT_LIBRARY_CONFIG } from '@/features/cms/config/fontLibrary'
import { DEFAULT_THEME_LIBRARY } from '@/features/cms/config/themeLibrary'

describe('cmsSiteConfig.settings snapshots', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('returns a stable theme library reference until storage changes', () => {
    writeThemeLibraryToStorage(DEFAULT_THEME_LIBRARY)

    const first = readThemeLibraryFromStorage()
    const second = readThemeLibraryFromStorage()

    expect(first).toBe(second)
  })

  it('returns a stable font library reference until storage changes', () => {
    writeFontLibraryToStorage(DEFAULT_FONT_LIBRARY_CONFIG)

    const first = readFontLibraryFromStorage()
    const second = readFontLibraryFromStorage()

    expect(first).toBe(second)
  })

  it('refreshes the cached theme library after a write', () => {
    writeThemeLibraryToStorage(DEFAULT_THEME_LIBRARY)
    const before = readThemeLibraryFromStorage()

    writeThemeLibraryToStorage({
      ...DEFAULT_THEME_LIBRARY,
      activeThemeId: 'bone-light-default',
    })
    const after = readThemeLibraryFromStorage()

    expect(before).not.toBe(after)
    expect(after.activeThemeId).toBe('bone-light-default')
  })

  it('refreshes cached reads when localStorage is updated directly', () => {
    writeThemeLibraryToStorage(DEFAULT_THEME_LIBRARY)
    const before = readThemeLibraryFromStorage()

    window.localStorage.setItem(
      THEME_CONFIG_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_THEME_LIBRARY,
        activeThemeId: 'bone-light-default',
      }),
    )

    const after = readThemeLibraryFromStorage()
    expect(before).not.toBe(after)
    expect(after.activeThemeId).toBe('bone-light-default')
  })

  it('keeps font cache independent from theme cache', () => {
    writeThemeLibraryToStorage(DEFAULT_THEME_LIBRARY)
    writeFontLibraryToStorage(DEFAULT_FONT_LIBRARY_CONFIG)

    const themeA = readThemeLibraryFromStorage()
    readFontLibraryFromStorage()
    const themeB = readThemeLibraryFromStorage()

    expect(themeA).toBe(themeB)
    expect(window.localStorage.getItem(FONT_CONFIG_STORAGE_KEY)).toBeTruthy()
  })
})
