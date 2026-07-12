import type { ThemeAppearance } from './themeLibrary'
import type { ThemePalette } from './cmsSiteConfig.zod'

/**
 * Brand-authored theme presets.
 *
 * Each entry carries only the normalized palette colors; `finalizeThemePalette`
 * in `themeLibrary.ts` fills the muted surface, foregrounds, ring, and status
 * colors, and `themeConfigToCssVars` derives every effect token (brand aliases,
 * surface elevation, chips, hero glows, particles, scrollbars) from them. Keys
 * are stable identifiers (never the label) so CMS assignments survive renames.
 *
 * 2026-07-12 — consolidated to a single house preset. The previous exploration
 * set (Oath Obsidian, Blackened Champagne, Oxblood Covenant, Burnished Bronze,
 * Cold Forged Steel, Ashen Olive, Midnight Cobalt, Blackened Teal, Iron Violet,
 * Bone Relic, Tech Forge, Forged Ceremonial) is retired — their ids live in
 * `RETIRED_THEME_IDS` (`themeLibrary.ts`) so stored copies are dropped on parse.
 */
export type RawThemePreset = {
  key: string
  label: string
  appearance: ThemeAppearance
  /** The normalized palette colors; everything else is derived. */
  palette: Partial<ThemePalette>
  description?: string
  recommendedFor?: string[]
  /** Marks the recommended launch theme. */
  recommended?: boolean
}

/**
 * The ANVL house theme — deep graphite surfaces, bone type, and one muted
 * champagne metal for the commerce vow. Champagne is kept desaturated and warm
 * (forged foil, not gold); graphite carries every surface and hairline so the
 * champagne only ever appears where it must convert or crown.
 */
export const ANVL_THEME_PRESETS: RawThemePreset[] = [
  {
    key: 'graphite-champagne',
    label: 'Graphite & Champagne',
    appearance: 'dark',
    recommended: true,
    description:
      'The ANVL house theme — near-black graphite, bone type, muted champagne. Premium, disciplined, forged under pressure.',
    recommendedFor: ['Whole site', 'Drop 01 landing', 'Ecommerce', 'Checkout'],
    palette: {
      // Graphite ladder: void → panel. Cool, ashen, never blue.
      background: '#0A0B0C',
      card: '#15171A',
      border: 'rgba(231, 228, 221, 0.13)',
      // Bone type on graphite (brand --anvl-bone family).
      foreground: '#EAE7E0',
      mutedForeground: '#A7A39A',
      // Muted champagne — the single warm metal. Desaturated foil, not gold.
      // Foregrounds are intentionally omitted: `finalizeThemePalette` contrast-
      // chooses them (`bestForeground`), which guarantees the WCAG gate.
      primary: '#C4AE86',
      // Deep champagne-bronze for storytelling highlights; reads as the
      // primary's shadowed sibling, so the site stays a two-metal system.
      accent: '#8E7A57',
      // Muted status colors in the same ashen register.
      success: '#5E8C6A',
      warning: '#C7A24B',
      destructive: '#B8574B',
    },
  },
]
