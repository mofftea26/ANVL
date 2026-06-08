import { z } from 'zod'
import {
  DEFAULT_BONE_LIGHT_PALETTE,
  DEFAULT_THEME_PALETTE,
  themeModeSchema,
  themePaletteSchema,
  type ThemeConfig,
  type ThemeMode,
  type ThemePalette,
} from './cmsSiteConfig.zod'

export const themeAppearanceSchema = z.enum(['dark', 'light'])

export const themePresetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  appearance: themeAppearanceSchema,
  palette: themePaletteSchema,
})

export const themeLibraryConfigSchema = z.object({
  activeThemeId: z.string().min(1),
  themes: z.array(themePresetSchema).min(1),
})

export type ThemeAppearance = z.infer<typeof themeAppearanceSchema>
export type ThemePreset = z.infer<typeof themePresetSchema>
export type ThemeLibraryConfig = z.infer<typeof themeLibraryConfigSchema>

export const DEFAULT_THEME_PRESET_ID = 'oath-dark-default'

/** Offline / empty-Supabase fallback — live values come from `storefront_publication.theme_config`. */
export const DEFAULT_THEME_LIBRARY: ThemeLibraryConfig = {
  activeThemeId: DEFAULT_THEME_PRESET_ID,
  themes: [
    {
      id: DEFAULT_THEME_PRESET_ID,
      name: 'Oath dark',
      appearance: 'dark',
      palette: DEFAULT_THEME_PALETTE,
    },
    {
      id: 'bone-light-default',
      name: 'Bone light',
      appearance: 'light',
      palette: DEFAULT_BONE_LIGHT_PALETTE,
    },
  ],
}

/** Semantic color fields shown in the CMS theme editor. */
export const THEME_EDITOR_COLOR_FIELDS: {
  key: keyof ThemePalette
  label: string
  input: 'color' | 'text'
}[] = [
  { key: 'colorBg', label: 'Background', input: 'color' },
  { key: 'colorSurface', label: 'Surface', input: 'color' },
  { key: 'colorSurfaceElevated', label: 'Elevated surface', input: 'color' },
  { key: 'colorLine', label: 'Borders & dividers', input: 'text' },
  { key: 'colorText', label: 'Body text', input: 'color' },
  { key: 'colorTextMuted', label: 'Muted text', input: 'color' },
  { key: 'colorHeading', label: 'Headings', input: 'color' },
  { key: 'colorAccent', label: 'Accent', input: 'color' },
  { key: 'colorEmber', label: 'Highlight', input: 'color' },
  { key: 'colorEmberBright', label: 'Highlight bright', input: 'color' },
]

export function appearanceToDataTheme(appearance: ThemeAppearance): ThemeMode {
  return appearance === 'light' ? 'bone-light' : 'oath-dark'
}

/** Keep brand tokens in sync when editors change semantic colors. */
export function finalizeThemePalette(
  palette: ThemePalette,
  appearance: ThemeAppearance,
): ThemePalette {
  const isLight = appearance === 'light'
  return {
    ...palette,
    anvlBlack: palette.colorBg,
    anvlDarkSteelGrey: palette.colorSurface,
    anvlWashedCharcoal: palette.colorSurfaceElevated,
    anvlGraphite: palette.colorTextMuted,
    anvlBone: palette.colorHeading,
    colorSurfaceSoft: palette.colorSurface,
    colorChip: isLight ? 'rgba(29, 31, 33, 0.08)' : 'rgba(52, 55, 58, 0.9)',
    colorHeroGlow: isLight ? 'rgba(29, 31, 33, 0.08)' : 'rgba(231, 228, 223, 0.08)',
    colorEmberSoft: isLight ? 'rgba(154, 79, 36, 0.14)' : 'rgba(194, 112, 61, 0.16)',
  }
}

export function resolveThemeConfig(library: ThemeLibraryConfig): ThemeConfig {
  const active =
    library.themes.find((t) => t.id === library.activeThemeId) ?? library.themes[0]
  return {
    dataTheme: appearanceToDataTheme(active.appearance),
    palette: active.palette,
  }
}

export function parseThemeLibrary(raw: unknown): ThemeLibraryConfig {
  const parsed = themeLibraryConfigSchema.safeParse(raw)
  if (parsed.success) return parsed.data

  if (raw && typeof raw === 'object' && 'themes' in raw && 'activeThemeId' in raw) {
    const loose = raw as ThemeLibraryConfig
    if (Array.isArray(loose.themes) && loose.themes.length > 0) {
      return {
        activeThemeId: loose.activeThemeId || loose.themes[0].id,
        themes: loose.themes.map((t) => ({
          id: t.id,
          name: t.name,
          appearance: t.appearance === 'light' ? 'light' : 'dark',
          palette: finalizeThemePalette(
            { ...DEFAULT_THEME_PALETTE, ...t.palette },
            t.appearance === 'light' ? 'light' : 'dark',
          ),
        })),
      }
    }
  }

  const legacyMode = themeModeSchema.safeParse(
    raw && typeof raw === 'object' && 'dataTheme' in raw
      ? (raw as { dataTheme?: string }).dataTheme
      : undefined,
  )
  const legacyPalette =
    raw && typeof raw === 'object' && 'palette' in raw
      ? (raw as { palette?: Partial<ThemePalette> }).palette
      : undefined

  if (legacyMode.success) {
    const appearance: ThemeAppearance =
      legacyMode.data === 'bone-light' ? 'light' : 'dark'
    const palette = finalizeThemePalette(
      { ...DEFAULT_THEME_PALETTE, ...legacyPalette },
      appearance,
    )
    const id =
      legacyMode.data === 'bone-light' ? 'bone-light-default' : DEFAULT_THEME_PRESET_ID
    return {
      activeThemeId: id,
      themes: [
        {
          id,
          name: legacyMode.data === 'bone-light' ? 'Bone light' : 'Oath dark',
          appearance,
          palette,
        },
      ],
    }
  }

  return DEFAULT_THEME_LIBRARY
}

export function createThemePreset(name: string, appearance: ThemeAppearance): ThemePreset {
  const palette = finalizeThemePalette(
    appearance === 'light' ? DEFAULT_BONE_LIGHT_PALETTE : DEFAULT_THEME_PALETTE,
    appearance,
  )
  return {
    id: `theme-${Date.now()}`,
    name,
    appearance,
    palette,
  }
}

export function parseThemeConfigFromLibraryRaw(raw: unknown): ThemeConfig {
  if (raw && typeof raw === 'object' && !('themes' in raw)) {
    const r = z
      .object({ dataTheme: themeModeSchema, palette: themePaletteSchema })
      .safeParse(raw)
    if (r.success) return r.data
  }
  return resolveThemeConfig(parseThemeLibrary(raw))
}
