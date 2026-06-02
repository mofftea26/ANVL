import type { LandingAct } from '@/features/cms/landing/landingActs.types'
import { readActStr } from '@/features/cms/landing/landingActPreviewOverlay'
import { resolvePresetAlias } from '@/features/marketing/act-presets/actPresetAliases'

/**
 * Layered hero media model (productHero, standardHero only):
 * - `row.media` → background (atmospheric backdrop)
 * - `row.content.foregroundImageUrl` / `foregroundVideoUrl` → foreground focal
 * Each layer accepts image OR video, mutually exclusive within the layer.
 */
export const HERO_LAYERED_MEDIA_PRESETS = ['productHero', 'standardHero'] as const

export type HeroLayeredMediaPreset = (typeof HERO_LAYERED_MEDIA_PRESETS)[number]
export type ActMediaLayer = 'background' | 'foreground'

export type ActLayerMediaSources = {
  imageUrl?: string
  videoUrl?: string
  alt?: string
}

export function isLayeredHeroPreset(preset?: string): preset is HeroLayeredMediaPreset {
  const resolved = resolvePresetAlias(preset) ?? preset
  return HERO_LAYERED_MEDIA_PRESETS.includes(resolved as HeroLayeredMediaPreset)
}

export function resolveActLayerMedia(
  row?: LandingAct,
  layer: ActMediaLayer = 'background',
): ActLayerMediaSources {
  if (layer === 'background') {
    return {
      imageUrl: row?.media?.imageUrl?.trim() || undefined,
      videoUrl: row?.media?.videoUrl?.trim() || undefined,
      alt: row?.media?.alt?.trim() || undefined,
    }
  }

  const content = row?.content as Record<string, unknown> | undefined
  return {
    imageUrl: readActStr(content, 'foregroundImageUrl') || undefined,
    videoUrl: readActStr(content, 'foregroundVideoUrl') || undefined,
    alt: row?.media?.alt?.trim() || undefined,
  }
}

export function hasActLayerMedia(row?: LandingAct, layer: ActMediaLayer = 'background'): boolean {
  const { imageUrl, videoUrl } = resolveActLayerMedia(row, layer)
  return Boolean(imageUrl || videoUrl)
}

export function hasActForegroundMedia(row?: LandingAct): boolean {
  return hasActLayerMedia(row, 'foreground')
}
