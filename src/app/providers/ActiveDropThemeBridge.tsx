import type { CSSProperties, ReactNode } from 'react'
import { DEFAULT_EMBLEM_URL, getGlobalBrandSettings } from '@/features/cms/read/themeBrandDefaults'
import type { GlobalBrandSettings } from '@/features/admin/global-brand/globalBrand.types'
import type { DropThemePalette } from '@/features/drops/theme/dropThemePalette.types'
import { dropPaletteToCssProperties } from '@/features/cms/theme/dropPaletteStyle'

const PREVIEW_ATTR = 'data-anvl-drop-preview-scope'

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
    ...dropPaletteToCssProperties(palette),
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

export function previewLoadingSrc(
  drop?: {
    visuals: { loadingEmblemUrl?: string; emblemImageUrl: string }
  },
  /** When set (e.g. from published Supabase projection), matches SSR without reading localStorage. */
  publishedGlobalBrand?: GlobalBrandSettings | null,
): string {
  const fromDrop =
    drop?.visuals.loadingEmblemUrl?.trim() ||
    drop?.visuals.emblemImageUrl?.trim()
  if (fromDrop) return fromDrop
  const g = publishedGlobalBrand ?? getGlobalBrandSettings()
  return (
    g.loadingEmblemFallbackUrl.trim() ||
    g.emblemFallbackUrl.trim() ||
    DEFAULT_EMBLEM_URL
  )
}
