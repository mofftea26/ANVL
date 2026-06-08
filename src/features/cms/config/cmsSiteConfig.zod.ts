import { z } from 'zod'

export const themeModeSchema = z.enum(['oath-dark', 'bone-light'])

export const themePaletteSchema = z.object({
  anvlBlack: z.string(),
  anvlDarkSteelGrey: z.string(),
  anvlWashedCharcoal: z.string(),
  anvlGraphite: z.string(),
  anvlBone: z.string(),
  colorBg: z.string(),
  colorSurface: z.string(),
  colorSurfaceSoft: z.string(),
  colorSurfaceElevated: z.string(),
  colorLine: z.string(),
  colorText: z.string(),
  colorTextMuted: z.string(),
  colorHeading: z.string(),
  colorAccent: z.string(),
  colorChip: z.string(),
  colorHeroGlow: z.string(),
  colorEmber: z.string(),
  colorEmberBright: z.string(),
  colorEmberSoft: z.string(),
})

export const themeConfigSchema = z.object({
  dataTheme: themeModeSchema,
  palette: themePaletteSchema,
})

export const fontConfigSchema = z.object({
  sans: z.string(),
  heading: z.string(),
  display: z.string(),
})

export const assetConfigSchema = z.object({
  general: z.record(z.string(), z.string()),
  drops: z.record(z.string(), z.record(z.string(), z.string())),
})

export type ThemeMode = z.infer<typeof themeModeSchema>
export type ThemePalette = z.infer<typeof themePaletteSchema>
export type ThemeConfig = z.infer<typeof themeConfigSchema>
export type FontConfig = z.infer<typeof fontConfigSchema>
export type AssetConfig = z.infer<typeof assetConfigSchema>

/** Offline / empty-Supabase fallback — live values come from `storefront_publication`. */
export const DEFAULT_THEME_PALETTE: ThemePalette = {
  anvlBlack: '#0b0b0c',
  anvlDarkSteelGrey: '#1d1f21',
  anvlWashedCharcoal: '#34373a',
  anvlGraphite: '#5b5e61',
  anvlBone: '#e7e4df',
  colorBg: '#0b0b0c',
  colorSurface: '#121315',
  colorSurfaceSoft: '#161820',
  colorSurfaceElevated: '#1a1c1f',
  colorLine: 'rgba(231, 228, 223, 0.14)',
  colorText: '#f5f4f2',
  colorTextMuted: '#bab8b3',
  colorHeading: '#e7e4df',
  colorAccent: '#c7c2b8',
  colorChip: 'rgba(52, 55, 58, 0.9)',
  colorHeroGlow: 'rgba(231, 228, 223, 0.08)',
  colorEmber: '#c2703d',
  colorEmberBright: '#e08a4a',
  colorEmberSoft: 'rgba(194, 112, 61, 0.16)',
}

export const DEFAULT_BONE_LIGHT_PALETTE: ThemePalette = {
  ...DEFAULT_THEME_PALETTE,
  colorBg: '#f5f2ec',
  colorSurface: '#ffffff',
  colorSurfaceSoft: '#f0ece6',
  colorSurfaceElevated: '#f0ece6',
  colorLine: 'rgba(11, 11, 12, 0.2)',
  colorText: '#151618',
  colorTextMuted: '#474a4e',
  colorHeading: '#111214',
  colorAccent: '#2f3135',
  colorChip: 'rgba(29, 31, 33, 0.08)',
  colorHeroGlow: 'rgba(29, 31, 33, 0.08)',
  colorEmber: '#9a4f24',
  colorEmberBright: '#b8642f',
  colorEmberSoft: 'rgba(154, 79, 36, 0.14)',
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  dataTheme: 'oath-dark',
  palette: DEFAULT_THEME_PALETTE,
}

/** Legacy v1 font fallback when `font_config` is missing or invalid. */
export const DEFAULT_FONT_CONFIG: FontConfig = {
  sans: 'Sora',
  heading: 'Anton',
  display: 'Cinzel',
}

export const DEFAULT_ASSET_CONFIG: AssetConfig = {
  general: {},
  drops: {},
}

export function parseThemeConfig(raw: unknown): ThemeConfig {
  const r = themeConfigSchema.safeParse(raw)
  if (r.success) return r.data
  if (raw && typeof raw === 'object' && 'dataTheme' in raw) {
    const partial = raw as { dataTheme?: string; palette?: Partial<ThemePalette> }
    const mode = themeModeSchema.safeParse(partial.dataTheme)
    const palette = { ...DEFAULT_THEME_PALETTE, ...partial.palette }
    if (mode.success) {
      return { dataTheme: mode.data, palette }
    }
  }
  return DEFAULT_THEME_CONFIG
}

export function parseFontConfig(raw: unknown): FontConfig {
  const r = fontConfigSchema.safeParse(raw)
  if (r.success) return r.data
  return DEFAULT_FONT_CONFIG
}

export function parseAssetConfig(raw: unknown): AssetConfig {
  const r = assetConfigSchema.safeParse(raw)
  if (r.success) return r.data
  if (raw && typeof raw === 'object' && !('general' in raw)) {
    return { general: raw as Record<string, string>, drops: {} }
  }
  return DEFAULT_ASSET_CONFIG
}

/** CSS custom properties injected on :root from a ThemeConfig. */
export function themeConfigToCssVars(theme: ThemeConfig): Record<string, string> {
  const p = theme.palette
  return {
    '--anvl-black': p.anvlBlack,
    '--anvl-dark-steel-grey': p.anvlDarkSteelGrey,
    '--anvl-washed-charcoal': p.anvlWashedCharcoal,
    '--anvl-graphite': p.anvlGraphite,
    '--anvl-bone': p.anvlBone,
    '--color-bg': p.colorBg,
    '--color-surface': p.colorSurface,
    '--color-surface-soft': p.colorSurfaceSoft,
    '--color-surface-elevated': p.colorSurfaceElevated,
    '--color-line': p.colorLine,
    '--color-text': p.colorText,
    '--color-text-muted': p.colorTextMuted,
    '--color-heading': p.colorHeading,
    '--color-accent': p.colorAccent,
    '--color-chip': p.colorChip,
    '--color-hero-glow': p.colorHeroGlow,
    '--color-ember': p.colorEmber,
    '--color-ember-bright': p.colorEmberBright,
    '--color-ember-soft': p.colorEmberSoft,
  }
}

export function fontConfigToCssVars(fonts: FontConfig): Record<string, string> {
  return {
    '--font-sans': `"${fonts.sans}", ui-sans-serif, system-ui, sans-serif`,
    '--font-heading': `"${fonts.heading}", "Oswald", "Impact", sans-serif`,
    '--font-display': `"${fonts.display}", "Trajan Pro", "Anton", serif`,
  }
}
