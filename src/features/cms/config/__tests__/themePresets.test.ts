import { describe, expect, it } from 'vitest'
import { contrastRatio } from '@/shared/lib/color'
import {
  collectPaletteOverrides,
  DEFAULT_THEME_PALETTE,
  THEME_PALETTE_KEYS,
  themeConfigToCssVars,
  themePaletteSchema,
} from '../cmsSiteConfig.zod'
import {
  ANVL_PRESETS,
  appearanceToDataTheme,
  DEFAULT_THEME_LIBRARY,
  finalizeThemePalette,
  parseThemeLibrary,
  presetToThemeConfig,
  themePresetSchema,
} from '../themeLibrary'
import { ANVL_THEME_PRESETS } from '../themePresets'
import {
  finalizeThemeParticles,
  finalizeThemeScrollbar,
  THEME_EDITOR_SECTIONS,
} from '../themeTokens'

/** Every CSS var the storefront/components rely on must still be emitted. */
const REQUIRED_VARS = [
  '--anvl-black',
  '--anvl-bone',
  '--color-bg',
  '--color-surface',
  '--color-surface-soft',
  '--color-surface-elevated',
  '--color-text',
  '--color-heading',
  '--color-accent',
  '--color-highlight',
  '--color-highlight-bright',
  '--color-on-accent',
  '--color-on-highlight',
  '--color-on-surface',
  '--color-success',
  '--color-warning',
  '--color-danger',
  '--color-info',
  '--color-focus-ring',
  '--color-disabled',
  '--color-overlay',
  '--color-chip',
  '--particle-primary',
  '--particle-secondary',
  '--particle-highlight',
  '--scrollbar-track',
  '--scrollbar-thumb',
  '--scrollbar-thumb-hover',
  '--scrollbar-thumb-active',
  '--hero-background',
  '--hero-accent-glow',
  '--motion-duration-normal',
  '--motion-ease-standard',
]

describe('ANVL theme presets', () => {
  it('ships all twelve brand presets', () => {
    expect(ANVL_PRESETS).toHaveLength(12)
    expect(ANVL_PRESETS.map((p) => p.id)).toContain('oath-obsidian')
    expect(ANVL_PRESETS.map((p) => p.id)).toContain('bone-relic')
    expect(ANVL_PRESETS.map((p) => p.id)).toContain('theoath-modern-tech-forge')
    expect(ANVL_PRESETS.map((p) => p.id)).toContain('forged-ceremonial')
  })

  it('marks Oath Obsidian as the recommended Drop 01 theme but not the live default', () => {
    const obsidian = ANVL_PRESETS.find((p) => p.id === 'oath-obsidian')
    expect(obsidian?.recommended).toBe(true)
    // Decision 1: do not flip the live default.
    expect(DEFAULT_THEME_LIBRARY.activeThemeId).toBe('oath-dark-default')
  })

  for (const preset of ANVL_PRESETS) {
    describe(preset.id, () => {
      it('passes the preset schema', () => {
        expect(themePresetSchema.safeParse(preset).success).toBe(true)
      })

      it('has exactly the normalized palette keys, all non-blank', () => {
        expect(themePaletteSchema.safeParse(preset.palette).success).toBe(true)
        expect(Object.keys(preset.palette).sort()).toEqual([...THEME_PALETTE_KEYS].sort())
        for (const value of Object.values(preset.palette)) {
          expect(typeof value === 'string' && value.length > 0).toBe(true)
        }
      })

      it('maps appearance to the right data-theme', () => {
        const expected = preset.appearance === 'light' ? 'bone-light' : 'oath-dark'
        expect(appearanceToDataTheme(preset.appearance)).toBe(expected)
      })

      it('emits every required CSS variable', () => {
        const vars = themeConfigToCssVars(presetToThemeConfig(preset))
        for (const key of REQUIRED_VARS) {
          expect(vars[key], `${preset.id} missing ${key}`).toBeTruthy()
        }
      })

      it('has accessible foregrounds on primary and accent', () => {
        expect(
          contrastRatio(preset.palette.primaryForeground, preset.palette.primary),
        ).toBeGreaterThanOrEqual(4.5)
        expect(
          contrastRatio(preset.palette.accentForeground, preset.palette.accent),
        ).toBeGreaterThanOrEqual(4.5)
      })

      it('has readable body text on the background and card', () => {
        expect(
          contrastRatio(preset.palette.foreground, preset.palette.background),
        ).toBeGreaterThanOrEqual(4.5)
        expect(
          contrastRatio(preset.palette.cardForeground, preset.palette.card),
        ).toBeGreaterThanOrEqual(4.5)
      })

      it('generates particle and scrollbar tokens', () => {
        const particles = finalizeThemeParticles(preset.palette)
        expect(particles.primary).toBe(preset.palette.accent)
        expect(particles.density).toBeGreaterThan(0)
        const mobile = finalizeThemeParticles(preset.palette, { mobile: true })
        expect(mobile.density).toBeLessThan(particles.density)

        const scrollbar = finalizeThemeScrollbar(preset.palette)
        expect(scrollbar.track).toBeTruthy()
        expect(scrollbar.thumbActive).toBe(preset.palette.primary)
      })
    })
  }
})

describe('normalized palette token set', () => {
  it('exposes only the 15 normalized tokens in the editor sections', () => {
    const editorKeys = THEME_EDITOR_SECTIONS.flatMap((s) => s.fields.map((f) => f.key))
    expect(new Set(editorKeys)).toEqual(new Set(THEME_PALETTE_KEYS))
  })

  it('the default palette has exactly the normalized keys', () => {
    expect(Object.keys(DEFAULT_THEME_PALETTE).sort()).toEqual([...THEME_PALETTE_KEYS].sort())
  })
})

describe('legacy palette migration', () => {
  it('maps a fully legacy palette onto the normalized keys (back-compat)', () => {
    const legacy = {
      colorBg: '#010203',
      colorText: '#fefefe',
      colorSurface: '#101112',
      colorOnSurface: '#eeeeee',
      colorSurfaceSoft: '#161718',
      colorTextMuted: '#999999',
      colorLine: 'rgba(255,255,255,0.1)',
      colorAccent: '#c7b28e',
      colorOnAccent: '#111111',
      colorHighlight: '#a84f2b',
      colorOnHighlight: '#ffffff',
      colorFocusRing: '#c7b28e',
      colorDanger: '#cf5a4e',
      colorSuccess: '#5f9e6b',
      colorWarning: '#d8a657',
      // Derived/removed tokens are dropped, not preserved.
      particlePrimary: '#deadbe',
      scrollbarThumb: '#abcabc',
      anvlSignature: '#c7b28e',
    }
    const parsed = themePaletteSchema.parse(legacy)
    expect(parsed.background).toBe('#010203')
    expect(parsed.foreground).toBe('#fefefe')
    expect(parsed.card).toBe('#101112')
    expect(parsed.primary).toBe('#c7b28e')
    expect(parsed.accent).toBe('#a84f2b')
    expect(parsed.destructive).toBe('#cf5a4e')
    // Removed tokens are not present on the normalized palette.
    expect(Object.keys(parsed).sort()).toEqual([...THEME_PALETTE_KEYS].sort())
    expect((parsed as Record<string, unknown>).particlePrimary).toBeUndefined()
  })

  it('remaps pre-rename ember keys onto the accent token', () => {
    const overrides = collectPaletteOverrides({
      colorEmber: '#123456',
      colorOnEmber: '#fedcba',
    })
    expect(overrides.accent).toBe('#123456')
    expect(overrides.accentForeground).toBe('#fedcba')
  })

  it('fills gaps from the dark identity so partial data never crashes', () => {
    const parsed = themePaletteSchema.parse({ colorBg: '#000000' })
    expect(parsed.background).toBe('#000000')
    expect(parsed.foreground).toBe(DEFAULT_THEME_PALETTE.foreground)
    expect(parsed.primary).toBe(DEFAULT_THEME_PALETTE.primary)
  })

  it('rejects a non-object palette', () => {
    expect(themePaletteSchema.safeParse('nope').success).toBe(false)
    expect(themePaletteSchema.safeParse(42).success).toBe(false)
  })
})

describe('finalizeThemePalette derivations', () => {
  it('derives foregrounds, muted, and ring when not provided', () => {
    const p = finalizeThemePalette(
      { background: '#08090a', foreground: '#f4f1ea', card: '#111315', primary: '#c7b28e', accent: '#a84f2b' },
      'dark',
    )
    expect(p.cardForeground).toBe('#f4f1ea')
    expect(p.ring).toBe('#c7b28e')
    expect(p.muted).toBeTruthy()
    // Foregrounds are contrast-chosen.
    expect(contrastRatio(p.primaryForeground, p.primary)).toBeGreaterThanOrEqual(4.5)
  })

  it('keeps explicit values over derived ones', () => {
    const p = finalizeThemePalette(
      { primary: '#c7b28e', primaryForeground: '#abcdef', ring: '#010101' },
      'dark',
    )
    expect(p.primaryForeground).toBe('#abcdef')
    expect(p.ring).toBe('#010101')
  })
})

describe('parseThemeLibrary migration', () => {
  it('injects all built-in presets on top of a legacy two-theme library', () => {
    const legacy = {
      activeThemeId: 'oath-dark-default',
      landingPageThemes: {},
      themes: [
        {
          id: 'oath-dark-default',
          name: 'Oath dark',
          appearance: 'dark',
          // Legacy palette keys — simulating pre-consolidation data.
          palette: { colorBg: '#0b0b0c', colorAccent: '#c7c2b8' },
        },
      ],
    }
    const lib = parseThemeLibrary(legacy)
    const ids = lib.themes.map((t) => t.id)
    expect(ids).toContain('oath-obsidian')
    expect(ids).toContain('bone-relic')
    // Active default preserved.
    expect(lib.activeThemeId).toBe('oath-dark-default')
    // Legacy colors carried onto the normalized keys after migration.
    const restored = lib.themes.find((t) => t.id === 'oath-dark-default')!
    expect(restored.palette.background).toBe('#0b0b0c')
    expect(restored.palette.primary).toBe('#c7c2b8')
    expect(restored.palette.accentForeground).toBeTruthy()
  })

  it('falls back to the default library for unrecognized input', () => {
    const lib = parseThemeLibrary('garbage')
    expect(lib.themes.length).toBeGreaterThanOrEqual(10)
  })

  it('remaps pre-rename ember keys onto the accent token', () => {
    const legacy = {
      activeThemeId: 'custom-ember',
      themes: [
        {
          id: 'custom-ember',
          name: 'Custom Ember',
          appearance: 'dark',
          palette: {
            colorBg: '#0b0b0c',
            colorAccent: '#c7c2b8',
            colorEmber: '#123456',
            colorOnEmber: '#fefefe',
          },
        },
      ],
    }
    const lib = parseThemeLibrary(legacy)
    const restored = lib.themes.find((t) => t.id === 'custom-ember')!
    expect(restored.palette.accent).toBe('#123456')
    expect(restored.palette.accentForeground).toBe('#fefefe')
  })
})

describe('raw preset data', () => {
  it('every raw preset has a stable kebab key and label', () => {
    for (const raw of ANVL_THEME_PRESETS) {
      expect(raw.key).toMatch(/^[a-z0-9-]+$/)
      expect(raw.label.length).toBeGreaterThan(0)
    }
  })
})
