import { z } from 'zod'
import { bestForeground, mix, withAlpha } from '@/shared/lib/color'

export const themeModeSchema = z.enum(['oath-dark', 'bone-light'])

/**
 * Theme palette — the single serialized source of truth that flows from the
 * CMS through `storefront_publication` to first-paint CSS variables.
 *
 * This is a small, conventional design-system palette (background / foreground,
 * card + foreground, muted + foreground, border, primary + foreground, accent +
 * foreground, ring, and a minimal destructive/success/warning set). Every other
 * effect color the storefront + landing page need (brand tokens, surface
 * elevation, chips, hero glows, particles, scrollbars, status foregrounds) is
 * **derived deterministically** from these tokens in `themeConfigToCssVars`, so
 * the CMS editor only ever exposes this normal palette and the storefront,
 * admin, and WebGL landing page can never diverge from it.
 */
export const THEME_PALETTE_KEYS = [
  'background',
  'foreground',
  'card',
  'cardForeground',
  'muted',
  'mutedForeground',
  'border',
  'primary',
  'primaryForeground',
  'accent',
  'accentForeground',
  'ring',
  'destructive',
  'success',
  'warning',
] as const

export type ThemePaletteKey = (typeof THEME_PALETTE_KEYS)[number]

/**
 * Legacy palette key → normalized key. Palettes persisted before the
 * consolidation (Supabase `theme_config`, local CMS drafts) used a sprawling,
 * ANVL-specific token set. Map the meaningful ones onto the normalized palette
 * so saved themes keep their colors instead of resetting to defaults. Keys not
 * listed here (derived effect/foreground/particle/scrollbar tokens) are dropped
 * — they are recomputed from the normalized palette.
 */
const LEGACY_TO_NORMALIZED: Record<string, ThemePaletteKey> = {
  colorBg: 'background',
  colorText: 'foreground',
  colorSurface: 'card',
  colorOnSurface: 'cardForeground',
  colorSurfaceSoft: 'muted',
  colorTextMuted: 'mutedForeground',
  colorLine: 'border',
  colorAccent: 'primary',
  colorOnAccent: 'primaryForeground',
  colorHighlight: 'accent',
  colorOnHighlight: 'accentForeground',
  colorFocusRing: 'ring',
  colorDanger: 'destructive',
  colorSuccess: 'success',
  colorWarning: 'warning',
}

/**
 * Pre-rename compatibility: palettes persisted before the `ember`→`highlight`
 * rename stored `colorEmber*` / `colorOnEmber*` keys. Map any legacy keys onto
 * the current names so saved CMS themes keep their custom colors. Runs before
 * the legacy→normalized remap below so `colorEmber` ultimately becomes `accent`.
 */
export function remapLegacyPaletteKeys(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw
  const o = { ...(raw as Record<string, unknown>) }
  const legacy: Record<string, string> = {
    colorEmber: 'colorHighlight',
    colorEmberBright: 'colorHighlightBright',
    colorEmberSoft: 'colorHighlightSoft',
    colorOnEmber: 'colorOnHighlight',
    colorOnEmberBright: 'colorOnHighlightBright',
  }
  let touched = false
  for (const [oldKey, newKey] of Object.entries(legacy)) {
    if (oldKey in o) {
      const current = o[newKey]
      if (current === undefined || current === '') o[newKey] = o[oldKey]
      delete o[oldKey]
      touched = true
    }
  }
  return touched ? o : raw
}

function isNonBlank(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

/**
 * Collect the explicitly-provided palette colors from any stored shape (current,
 * pre-consolidation, or pre-ember-rename), mapped onto the normalized keys. Only
 * keys actually present (non-blank) are returned — callers decide how to fill the
 * rest, which lets `finalizeThemePalette` derive appearance-aware defaults.
 */
export function collectPaletteOverrides(
  raw: unknown,
): Partial<Record<ThemePaletteKey, string>> {
  const overrides: Partial<Record<ThemePaletteKey, string>> = {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return overrides
  const o = remapLegacyPaletteKeys(raw) as Record<string, unknown>
  // Legacy ANVL-specific keys map onto the normalized palette first.
  for (const [legacyKey, normKey] of Object.entries(LEGACY_TO_NORMALIZED)) {
    if (isNonBlank(o[legacyKey])) overrides[normKey] = o[legacyKey]
  }
  // Explicit normalized keys always win over any mapped legacy value.
  for (const key of THEME_PALETTE_KEYS) {
    if (isNonBlank(o[key])) overrides[key] = o[key]
  }
  return overrides
}

/**
 * Normalize any stored palette into the 15-field normalized shape. Always
 * returns a complete object so the schema parses without crashing on historical
 * data; gaps fall back to the dark identity and unknown keys are dropped.
 */
function migrateThemePalette(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw
  return { ...NORMALIZED_DARK_PALETTE, ...collectPaletteOverrides(raw) }
}

const themePaletteObjectSchema = z.object({
  /** Page background. */
  background: z.string(),
  /** Default body text + headings. */
  foreground: z.string(),
  /** Cards, panels, the storefront chrome surface. */
  card: z.string(),
  /** Text on `card`. */
  cardForeground: z.string(),
  /** Muted / secondary surface (soft fills, inactive states). */
  muted: z.string(),
  /** Muted / secondary text. */
  mutedForeground: z.string(),
  /** Borders, dividers, inputs (may carry alpha). */
  border: z.string(),
  /** Primary brand action color (champagne for Drop 01). */
  primary: z.string(),
  /** Text on `primary`. */
  primaryForeground: z.string(),
  /** Secondary brand accent / highlight (forge copper for Drop 01). */
  accent: z.string(),
  /** Text on `accent`. */
  accentForeground: z.string(),
  /** Focus ring. */
  ring: z.string(),
  /** Destructive / error. */
  destructive: z.string(),
  /** Success / positive. */
  success: z.string(),
  /** Warning / caution. */
  warning: z.string(),
})

export const themePaletteSchema = z.preprocess(migrateThemePalette, themePaletteObjectSchema)

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
  /** Per-landing-page slot assignments, keyed by landing page key. */
  drops: z.record(z.string(), z.record(z.string(), z.string())),
  /** Per-storefront-page slot assignments, keyed by storefront page key. */
  pages: z.record(z.string(), z.record(z.string(), z.string())).default({}),
})

export type ThemeMode = z.infer<typeof themeModeSchema>
export type ThemePalette = z.infer<typeof themePaletteSchema>
export type ThemeConfig = z.infer<typeof themeConfigSchema>
export type FontConfig = z.infer<typeof fontConfigSchema>
export type AssetConfig = z.infer<typeof assetConfigSchema>

/**
 * Normalized dark palette — the live `oath-dark` identity. Used as the offline
 * fallback and as the completeness base for migrating historical palettes.
 * Declared as a plain record so it can seed the schema preprocess above before
 * `ThemePalette` exists.
 */
const NORMALIZED_DARK_PALETTE: Record<ThemePaletteKey, string> = {
  background: '#0b0b0c',
  foreground: '#f5f4f2',
  card: '#121315',
  cardForeground: '#f5f4f2',
  muted: '#161820',
  mutedForeground: '#bab8b3',
  border: 'rgba(231, 228, 223, 0.14)',
  primary: '#c7c2b8',
  primaryForeground: '#141414',
  accent: '#c2703d',
  accentForeground: '#ffffff',
  ring: '#c7c2b8',
  destructive: '#cf5a4e',
  success: '#5f9e6b',
  warning: '#d8a657',
}

const NORMALIZED_BONE_LIGHT_PALETTE: Record<ThemePaletteKey, string> = {
  background: '#f5f2ec',
  foreground: '#151618',
  card: '#ffffff',
  cardForeground: '#151618',
  muted: '#f0ece6',
  mutedForeground: '#474a4e',
  border: 'rgba(11, 11, 12, 0.2)',
  primary: '#2f3135',
  primaryForeground: '#f5f2ec',
  accent: '#9a4f24',
  accentForeground: '#ffffff',
  ring: '#2f3135',
  destructive: '#b23b30',
  success: '#2f7d4f',
  warning: '#9a6b1f',
}

export const DEFAULT_THEME_PALETTE: ThemePalette = { ...NORMALIZED_DARK_PALETTE }
export const DEFAULT_BONE_LIGHT_PALETTE: ThemePalette = { ...NORMALIZED_BONE_LIGHT_PALETTE }

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
  pages: {},
}

export function parseThemeConfig(raw: unknown): ThemeConfig {
  const r = themeConfigSchema.safeParse(raw)
  if (r.success) return r.data
  if (raw && typeof raw === 'object' && 'dataTheme' in raw) {
    const partial = raw as { dataTheme?: string; palette?: unknown }
    const mode = themeModeSchema.safeParse(partial.dataTheme)
    const palette = themePaletteSchema.safeParse(partial.palette ?? {})
    if (mode.success && palette.success) {
      return { dataTheme: mode.data, palette: palette.data }
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
    return { general: raw as Record<string, string>, drops: {}, pages: {} }
  }
  return DEFAULT_ASSET_CONFIG
}

/**
 * Constant motion tokens (§18). Theme-independent today, but emitted alongside
 * the palette so every component reads one coherent token set and we never ship
 * a global `* { transition }`.
 */
export const MOTION_CSS_VARS: Record<string, string> = {
  '--motion-duration-fast': '140ms',
  '--motion-duration-normal': '220ms',
  '--motion-duration-slow': '320ms',
  '--motion-ease-standard': 'cubic-bezier(0.22, 1, 0.36, 1)',
  '--motion-ease-emphasized': 'cubic-bezier(0.16, 1, 0.3, 1)',
  '--motion-ease-exit': 'cubic-bezier(0.4, 0, 1, 1)',
}

const WHITE = '#ffffff'

/**
 * CSS custom properties injected on :root from a ThemeConfig.
 *
 * The 15 normalized palette fields are the only editable source of truth. Every
 * other token the storefront / admin / landing page consume is derived here
 * deterministically — brand tokens (`--anvl-*`), surface elevation, chips, hero
 * glows, particles, scrollbars, and status foregrounds — so editing the small
 * palette updates the entire system at once. The SSR first-paint inline payload
 * reuses this same map, guaranteeing no divergence between CMS and storefront.
 */
export function themeConfigToCssVars(theme: ThemeConfig): Record<string, string> {
  const p = theme.palette
  const highlightBright = mix(p.accent, WHITE, 0.24)
  const surfaceElevated = mix(p.card, p.foreground, 0.05)
  const heroGlow = withAlpha(p.primary, 0.08)
  const highlightSoft = withAlpha(p.accent, 0.16)
  const overlay = withAlpha(p.background, 0.72)
  return {
    // Brand tokens — derived from the palette so brand graphics + the WebGL
    // landing scene follow the active theme (kept as aliases for back-compat).
    '--anvl-black': p.background,
    '--anvl-dark-steel-grey': p.card,
    '--anvl-washed-charcoal': surfaceElevated,
    '--anvl-graphite': p.mutedForeground,
    '--anvl-bone': p.foreground,
    '--anvl-signature': p.primary,
    '--color-graphite': p.mutedForeground,
    // Foundation.
    '--color-bg': p.background,
    '--color-surface': p.card,
    '--color-surface-soft': p.muted,
    '--color-surface-elevated': surfaceElevated,
    '--color-line': p.border,
    '--color-text': p.foreground,
    '--color-fg': p.foreground,
    '--color-text-muted': p.mutedForeground,
    '--color-heading': p.foreground,
    '--color-accent': p.primary,
    '--color-chip': withAlpha(mix(p.card, p.primary, 0.12), 0.9),
    '--color-hero-glow': heroGlow,
    '--color-highlight': p.accent,
    '--color-highlight-bright': highlightBright,
    '--color-highlight-soft': highlightSoft,
    // Foregrounds for colored surfaces.
    '--color-on-accent': p.primaryForeground,
    '--color-on-highlight': p.accentForeground,
    '--color-on-highlight-bright': bestForeground(highlightBright),
    '--color-on-surface': p.cardForeground,
    // Status.
    '--color-success': p.success,
    '--color-warning': p.warning,
    '--color-danger': p.destructive,
    '--color-info': mix(p.mutedForeground, p.foreground, 0.4),
    '--color-focus-ring': p.ring,
    '--color-disabled': p.mutedForeground,
    '--color-overlay': overlay,
    // Status foregrounds (derived).
    '--color-on-success': bestForeground(p.success),
    '--color-on-warning': bestForeground(p.warning),
    '--color-on-danger': bestForeground(p.destructive),
    // Hero (§10) — layered glows + content-safe readability gradient.
    '--hero-background': p.background,
    '--hero-accent-glow': heroGlow,
    '--hero-highlight-glow': highlightSoft,
    '--hero-glow': heroGlow,
    '--hero-overlay': overlay,
    '--hero-vignette': withAlpha(p.background, 0.78),
    '--hero-text-shadow': '0 1px 28px rgba(0, 0, 0, 0.55)',
    // Sticky-nav scrim — the theme background at near-opacity (§22).
    '--nav-scrim': withAlpha(p.background, 0.92),
    // Particles (§9) — derived from the brand accent/primary.
    '--particle-primary': p.accent,
    '--particle-secondary': p.primary,
    '--particle-highlight': highlightBright,
    '--particle-glow': withAlpha(p.accent, 0.2),
    // Scrollbars (§11) — derived from surfaces/primary.
    '--scrollbar-track': mix(p.card, p.background, 0.12),
    '--scrollbar-thumb': mix(p.primary, p.foreground, 0.44),
    '--scrollbar-thumb-hover': mix(p.primary, p.foreground, 0.32),
    '--scrollbar-thumb-active': p.primary,
    // Experience surfaces — glass chrome, strong/technical hairlines, and the
    // page-transition overlay. Derived for every theme so experience variants
    // (e.g. Theoath Modern) read the same source of truth as the storefront.
    '--glass-surface': withAlpha(p.background, 0.78),
    '--border-strong': withAlpha(p.foreground, 0.2),
    '--tech-line': withAlpha(p.foreground, 0.12),
    '--transition-overlay': p.background,
    ...MOTION_CSS_VARS,
  }
}

export function fontConfigToCssVars(fonts: FontConfig): Record<string, string> {
  return {
    '--font-sans': `"${fonts.sans}", ui-sans-serif, system-ui, sans-serif`,
    '--font-heading': `"${fonts.heading}", "Oswald", "Impact", sans-serif`,
    '--font-display': `"${fonts.display}", "Trajan Pro", "Anton", serif`,
  }
}
