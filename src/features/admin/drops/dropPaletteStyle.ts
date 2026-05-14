import type { DropThemePalette } from './drops.types'

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
  return {
    '--color-bg': bg,
    '--color-surface': surface,
    '--color-surface-soft': surfaceSoft,
    '--color-surface-elevated': surfaceSoft,
    '--color-line': line,
    '--color-text': text,
    '--color-text-muted': mutedText,
    '--color-heading': heading,
    '--color-accent': accent,
    '--color-chip': accentSoft,
    '--color-hero-glow': heroGlow,
  }
}

/** Inline `:root { … }` for SSR `<style>` injection. */
export function serializeDropPaletteForRootStyle(palette: DropThemePalette): string {
  const vars = dropPaletteToCssVarsRecord(palette)
  const body = Object.entries(vars)
    .map(([k, v]) => `${k}: ${v};`)
    .join('')
  return `:root { ${body} }`
}
