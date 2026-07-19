import {
  themeConfigToCssVars,
  type ThemeConfig,
} from '@/features/cms/config/cmsSiteConfig.zod'
import {
  DEFAULT_FONT_LIBRARY_CONFIG,
  fontLibraryToCssVars,
} from '@/features/cms/config/fontLibrary'

/**
 * THE ANVL STUDIO THEME — the admin's own visual identity.
 *
 * The CMS deliberately does NOT wear the storefront's theme: the Studio is a
 * dark graphite "forge control room" — warmer and one step lighter than the
 * storefront's near-black stage, with bone text, molten-copper actions, and
 * machined hairlines. Fixed and code-owned (never CMS-editable); the
 * storefront palette appears in the admin only inside the theme editor's
 * scoped preview.
 *
 * Built through `themeConfigToCssVars`, the same machinery the storefront
 * uses, so every derived var the shared components read (`--color-*`,
 * `--shop-*`, scrollbars, glass) exists — full coverage, no drift.
 */
const STUDIO_THEME: ThemeConfig = {
  dataTheme: 'oath-dark',
  palette: {
    background: '#15171A', // graphite control-room (warmer + lighter than the storefront's near-black)
    foreground: '#E3E0D8', // bone text
    card: '#1D2024', // raised steel plate
    cardForeground: '#EAE7DF',
    muted: '#24282D', // recessed panel
    mutedForeground: '#989CA1',
    border: '#363B41', // machined hairline
    // NOTE the derivation mapping: palette.primary → --color-accent (the
    // visible action color), palette.accent → --color-highlight.
    primary: '#D96C2C', // molten copper — actions, rings, active ticks
    primaryForeground: '#1A0F07',
    accent: '#B8814A', // ember bronze — highlight gradients, tab pills
    accentForeground: '#16100A',
    ring: '#D96C2C',
    destructive: '#E0564A',
    success: '#5CA36E',
    warning: '#D9A13B',
  },
}

/** Complete CSS-var set for the Studio (palette + the default ANVL typefaces). */
export const ADMIN_STUDIO_CSS_VARS: Record<string, string> = {
  ...themeConfigToCssVars(STUDIO_THEME),
  ...fontLibraryToCssVars(DEFAULT_FONT_LIBRARY_CONFIG),
}

export const ADMIN_STUDIO_DATA_THEME = STUDIO_THEME.dataTheme
