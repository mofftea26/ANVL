import type { CSSProperties } from 'react'
import type { DropThemePalette } from '@/features/admin/drops/drops.types'

export const ACTIVE_DROP_THEME_STYLE_ID = 'anvl-active-drop-theme'

function sanitizeCssValue(value: string): string {
  return value.replace(/[\r\n{}]/g, '').trim()
}

export function dropPaletteToCssVarsRecord(
  palette: DropThemePalette,
): Record<string, string> {
  const c = palette.colors
  const record: Record<string, string> = {
    '--color-bg': c.background,
    '--color-surface': c.surface,
    '--color-surface-soft': c.surfaceSoft,
    '--color-surface-muted': c.surfaceSoft,
    '--color-surface-elevated': c.surfaceSoft,
    '--color-line': c.line,
    '--color-border': c.line,
    '--color-text': c.text,
    '--color-text-muted': c.mutedText,
    '--color-heading': c.heading,
    '--color-accent': c.accent,
    '--color-chip': c.accentSoft,
    '--color-hero-glow': c.heroGlow,
  }
  if (c.danger) record['--color-danger'] = c.danger
  if (c.success) record['--color-success'] = c.success
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
    .map(([k, v]) => `${k}: ${sanitizeCssValue(v)};`)
    .join('')
  return `:root {${inner}}`
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
