import type { CSSProperties } from 'react'
import type { DropThemePalette } from '@/features/drops/theme/dropThemePalette.types'

export const ACTIVE_DROP_THEME_STYLE_ID = 'anvl-active-drop-theme'

/** Matches `<html data-theme>` on the public storefront shell (`__root.tsx`). */
export const STOREFRONT_ROOT_DATA_THEME = 'oath-dark'

/** Strip risky tokens from CMS-provided CSS values before injecting into `style`. */
export function sanitizeCssValue(value: string, fallback: string): string {
  const t = value.trim()
  if (!t || t.length > 240) return fallback
  if (/[{}<>]|expression\s*\(|javascript:|@import/i.test(t)) return fallback
  return t
}

export function dropPaletteToCssVarsRecord(
  palette: DropThemePalette,
): Record<string, string> {
  const c = palette.colors
  const bg = sanitizeCssValue(c.background, '#0B0B0C')
  const surface = sanitizeCssValue(c.surface, '#1D1F21')
  const surfaceSoft = sanitizeCssValue(c.surfaceSoft, '#34373A')
  const line = sanitizeCssValue(c.line, '#34373A')
  const text = sanitizeCssValue(c.text, '#E7E4DF')
  const mutedText = sanitizeCssValue(c.mutedText, '#5B5E61')
  const heading = sanitizeCssValue(c.heading, '#E7E4DF')
  const accent = sanitizeCssValue(c.accent, '#E7E4DF')
  const accentSoft = sanitizeCssValue(c.accentSoft, '#34373A')
  const heroGlow = sanitizeCssValue(c.heroGlow, '#34373A')
  const record: Record<string, string> = {
    '--color-bg': bg,
    '--color-surface': surface,
    '--color-surface-soft': surfaceSoft,
    '--color-surface-muted': surfaceSoft,
    '--color-surface-elevated': surfaceSoft,
    '--color-line': line,
    '--color-border': line,
    '--color-text': text,
    '--color-text-muted': mutedText,
    '--color-heading': heading,
    '--color-accent': accent,
    '--color-chip': accentSoft,
    '--color-hero-glow': heroGlow,
  }
  if (c.danger) record['--color-danger'] = sanitizeCssValue(c.danger, '#ef4444')
  if (c.success) record['--color-success'] = sanitizeCssValue(c.success, '#22c55e')
  return record
}

export function dropPaletteToCssProperties(
  palette: DropThemePalette,
): CSSProperties {
  return dropPaletteToCssVarsRecord(palette) as CSSProperties
}

export function serializeDropPaletteForRootStyle(
  palette: DropThemePalette,
): string {
  const rec = dropPaletteToCssVarsRecord(palette)
  const inner = Object.entries(rec)
    .map(([k, v]) => `${k}: ${v};`)
    .join('')
  // Same specificity as `styles.css` `:root[data-theme="oath-dark"]`; injected
  // later in the document so published drop palettes win over static defaults.
  return `:root[data-theme="${STOREFRONT_ROOT_DATA_THEME}"] { ${inner} }`
}

export function syncActiveDropThemeStyleTag(palette: DropThemePalette | null) {
  if (typeof document === 'undefined') return
  const existing = document.getElementById(
    ACTIVE_DROP_THEME_STYLE_ID,
  ) as HTMLStyleElement | null

  if (!palette) {
    existing?.remove()
    return
  }

  const css = serializeDropPaletteForRootStyle(palette)
  if (existing) {
    existing.textContent = css
    return
  }
  const style = document.createElement('style')
  style.id = ACTIVE_DROP_THEME_STYLE_ID
  style.textContent = css
  document.head.appendChild(style)
}
