import type { Drop } from '@/features/drops/drop.types'
import { sanitizeCssValue } from '@/features/cms/theme/dropPaletteStyle'
import type { DropThemePalette } from '@/features/drops/theme/dropThemePalette.types'

export function emblemUrlFromDropVisuals(emblemImageUrl?: string): string | undefined {
  const url = emblemImageUrl?.trim()
  return url ? url : undefined
}

export function themeAccentFromDropTheme(theme: DropThemePalette): string | undefined {
  const raw = theme?.colors?.accent?.trim()
  if (!raw) return undefined
  const accent = sanitizeCssValue(raw, '')
  return accent || undefined
}

export function adminDropListVisualsFromDrop(d: Drop) {
  return {
    emblemImageUrl: emblemUrlFromDropVisuals(d.visuals.emblemImageUrl),
    themeAccent: themeAccentFromDropTheme(d.theme),
  }
}

export function adminDropListVisualsFromPersistedBody(body: {
  visuals: { emblemImageUrl: string }
  theme: DropThemePalette
}) {
  return {
    emblemImageUrl: emblemUrlFromDropVisuals(body.visuals.emblemImageUrl),
    themeAccent: themeAccentFromDropTheme(body.theme),
  }
}
