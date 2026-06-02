import type { LandingAct } from '@/features/cms/landing/landingActs.types'
import type { CmsMetaItem, LandingPageCmsContent } from '@/features/cms/landing/landingPageCms.types'
import { readActStr } from '@/features/cms/landing/landingActPreviewOverlay'

function readMetaItems(content: Record<string, unknown> | undefined): CmsMetaItem[] {
  if (!content || !Array.isArray(content.metaItems)) return []
  return content.metaItems
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null
      const o = item as Record<string, unknown>
      const label = typeof o.label === 'string' ? o.label.trim() : ''
      const value = typeof o.value === 'string' ? o.value.trim() : ''
      if (!label && !value) return null
      const id =
        typeof o.id === 'string' && o.id.trim()
          ? o.id.trim()
          : `hero-meta-${index}`
      return { id, label, value }
    })
    .filter(Boolean) as CmsMetaItem[]
}

/** Resolve cinematic hero media from act content with optional `act.media` fallback. */
export function previewCinematicHeroMedia(
  landing: LandingPageCmsContent['hero'],
  row: LandingAct | undefined,
): {
  backgroundVideoUrl: string
  backgroundImageUrl: string
  playVideoOnMobile: boolean
  emblemWatermarkSrc: string
  meta: CmsMetaItem[]
} {
  const c = (row?.content ?? {}) as Record<string, unknown>
  const media = row?.media

  const backgroundVideoUrl =
    readActStr(c, 'backgroundVideoUrl').trim() ||
    (typeof media?.videoUrl === 'string' ? media.videoUrl.trim() : '')

  const backgroundImageUrl =
    readActStr(c, 'backgroundImageUrl').trim() ||
    (typeof media?.imageUrl === 'string' ? media.imageUrl.trim() : '')

  const playVideoOnMobile = c.playVideoOnMobile === true

  const emblemWatermarkSrc = readActStr(c, 'emblemWatermarkSrc').trim()

  const metaFromAct = readMetaItems(c)
  const meta = metaFromAct.length > 0 ? metaFromAct : landing.meta ?? []

  return {
    backgroundVideoUrl,
    backgroundImageUrl,
    playVideoOnMobile,
    emblemWatermarkSrc,
    meta,
  }
}
