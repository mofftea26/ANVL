/**
 * @vitest-environment jsdom
 *
 * E4/E6 regression — "theme reverts to Graphite & Champagne after reload".
 * Root cause was a silent no-op Supabase write + hydration revert; the save
 * layer now throws on a failed write. These tests pin the local half of the
 * contract: a successful save persists the new `activeThemeId` in a way that
 * survives a fresh `readThemeLibraryFromStorage()` re-read, and a failed
 * remote sync rejects (so the editor toasts instead of pretending success).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const afterLocalCmsMutation = vi.fn()

vi.mock('@/features/admin/cmsRemote/cmsWriteThrough', () => ({
  afterLocalCmsMutation: (...args: unknown[]) => afterLocalCmsMutation(...args),
}))

import {
  readThemeLibraryFromStorage,
  saveThemeConfigAsync,
} from '@/features/cms/config/cmsSiteConfig.settings'
import {
  createThemePreset,
  DEFAULT_THEME_LIBRARY,
  DEFAULT_THEME_PRESET_ID,
} from '@/features/cms/config/themeLibrary'

describe('theme library persistence (E4/E6)', () => {
  beforeEach(() => {
    window.localStorage.clear()
    afterLocalCmsMutation.mockReset()
  })

  it('persists a newly-created live theme across a storage re-read', async () => {
    afterLocalCmsMutation.mockResolvedValue({ ok: true })

    const preset = createThemePreset('Midnight Bronze', 'dark')
    const library = {
      activeThemeId: preset.id,
      themes: [...DEFAULT_THEME_LIBRARY.themes, preset],
    }

    await saveThemeConfigAsync(library)

    const reread = readThemeLibraryFromStorage()
    expect(reread.activeThemeId).toBe(preset.id)
    expect(reread.themes.some((t) => t.id === preset.id)).toBe(true)
    expect(reread.themes.find((t) => t.id === preset.id)?.name).toBe(
      'Midnight Bronze',
    )
  })

  it('remaps a dangling activeThemeId back to the house preset on read', () => {
    // Sanity: the parser is the layer that would "revert" a broken id — a
    // valid saved id must NOT be remapped (previous test), only missing ones.
    window.localStorage.setItem(
      'anvl.themeConfig.v1',
      JSON.stringify({
        activeThemeId: 'theme-does-not-exist',
        themes: DEFAULT_THEME_LIBRARY.themes,
      }),
    )
    expect(readThemeLibraryFromStorage().activeThemeId).toBe(DEFAULT_THEME_PRESET_ID)
  })

  it('rejects when the remote sync fails so the editor can toast the error', async () => {
    afterLocalCmsMutation.mockResolvedValue({
      ok: false,
      error: 'Not saved to Supabase — your session may have expired.',
    })

    await expect(saveThemeConfigAsync(DEFAULT_THEME_LIBRARY)).rejects.toThrow(
      'Not saved to Supabase — your session may have expired.',
    )
  })
})
