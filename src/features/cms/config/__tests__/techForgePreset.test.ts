import { describe, expect, it } from 'vitest'
import { ANVL_THEME_PRESETS } from '../themePresets'
import {
  ANVL_PRESETS,
  DEFAULT_THEME_LIBRARY,
  parseThemeLibrary,
} from '../themeLibrary'
import { THEME_PALETTE_KEYS } from '../cmsSiteConfig.zod'

const TECH_FORGE_ID = 'theoath-modern-tech-forge'

describe('Theoath Modern — Tech Forge preset', () => {
  it('is registered as a brand preset without removing existing ones', () => {
    const keys = ANVL_THEME_PRESETS.map((p) => p.key)
    expect(keys).toContain(TECH_FORGE_ID)
    // Existing presets remain.
    expect(keys).toContain('oath-obsidian')
    expect(keys).toContain('bone-relic')
  })

  it('finalizes into a complete 15-token palette', () => {
    const preset = ANVL_PRESETS.find((p) => p.id === TECH_FORGE_ID)
    expect(preset).toBeDefined()
    expect(preset?.appearance).toBe('dark')
    for (const key of THEME_PALETTE_KEYS) {
      expect(preset?.palette[key]).toBeTruthy()
    }
    expect(preset?.palette.background).toBe('#050607')
    expect(preset?.palette.primary).toBe('#B49772')
  })

  it('is guaranteed present after parsing any stored library', () => {
    const parsed = parseThemeLibrary(DEFAULT_THEME_LIBRARY)
    expect(parsed.themes.map((t) => t.id)).toContain(TECH_FORGE_ID)
  })
})
