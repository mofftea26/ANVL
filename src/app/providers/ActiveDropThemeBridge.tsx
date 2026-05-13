import { useEffect } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { subscribeDropsChange } from '@/features/admin/drops/drops.storage'
import {
  DEFAULT_EMBLEM_URL,
} from '@/features/admin/drops/drops.defaults'
import { getGlobalBrandSettings } from '@/features/admin/global-brand/globalBrand.service'
import { getActiveDrop } from '@/features/admin/drops/drops.service'
import type { DropThemePalette } from '@/features/admin/drops/drops.types'

const PREVIEW_ATTR = 'data-anvl-drop-preview-scope'

function paletteToCssVars(palette: DropThemePalette): Record<string, string> {
  const c = palette.colors
  return {
    '--color-bg': c.background,
    '--color-surface': c.surface,
    '--color-surface-soft': c.surfaceSoft,
    '--color-surface-elevated': c.surfaceSoft,
    '--color-line': c.line,
    '--color-text': c.text,
    '--color-text-muted': c.mutedText,
    '--color-heading': c.heading,
    '--color-accent': c.accent,
    '--color-chip': c.accentSoft,
    '--color-hero-glow': c.heroGlow,
  }
}

/** Applies active drop palette to `:root` on the public site. */
export function ActiveDropThemeBridge() {
  useEffect(() => {
    const apply = () => {
      const drop = getActiveDrop()
      const palette = drop?.theme
      const root = document.documentElement
      if (!palette) return
      const vars = paletteToCssVars(palette)
      Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
    }

    apply()
    return subscribeDropsChange(apply)
  }, [])

  return null
}

/** Scoped palette for admin preview containers only. */
export function DropPreviewThemeScope({
  palette,
  emblemUrl,
  children,
}: {
  palette: DropThemePalette
  emblemUrl?: string
  children: ReactNode
}) {
  const style = {
    ...paletteToCssVars(palette),
    ...(emblemUrl
      ? ({
          '--anvl-preview-emblem': `url("${emblemUrl}")`,
        } as CSSProperties)
      : {}),
  } as CSSProperties

  return (
    <div
      {...{ [PREVIEW_ATTR]: '' }}
      style={style}
      className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] text-[var(--color-text)]"
    >
      {children}
    </div>
  )
}

export function previewLoadingSrc(drop?: {
  visuals: { loadingEmblemUrl?: string; emblemImageUrl: string }
}): string {
  const fromDrop =
    drop?.visuals.loadingEmblemUrl?.trim() ||
    drop?.visuals.emblemImageUrl?.trim()
  if (fromDrop) return fromDrop
  const g = getGlobalBrandSettings()
  return (
    g.loadingEmblemFallbackUrl.trim() ||
    g.emblemFallbackUrl.trim() ||
    DEFAULT_EMBLEM_URL
  )
}
