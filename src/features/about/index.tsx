import { useMemo } from 'react'
import type { MediaIndexEntry } from '@/features/cms/media/mediaIndex.types'
import { resolveAboutContent } from './content/resolveAboutContent'
import { AboutMobilePage } from './mobile/AboutMobilePage'

export type AboutPageAssets = Record<string, string | undefined>

/**
 * The About page. Interim state while the scrollytelling redesign lands: the
 * normal scrolling page serves every device (the old two-experience split —
 * non-scrollable desktop Forge Altar vs. mobile page — was retired with the
 * strike modal and the view toggle). The desktop cinematic scroll experience
 * mounts here behind its capability gate in the next phase.
 *
 * Copy is CMS-editable (`/admin/about`), imagery + the anvil/hammer GLBs
 * CMS-assigned (`/admin/assets` → Page — About); every field falls back to a
 * designed code default.
 */
export function AboutExperience({
  landingContent,
  assets,
  mediaIndex,
}: {
  landingContent: unknown
  assets: AboutPageAssets
  mediaIndex?: MediaIndexEntry[]
}) {
  const content = useMemo(
    () => resolveAboutContent(landingContent, { mediaIndex }),
    [landingContent, mediaIndex],
  )

  return (
    <div data-about-root className="relative isolate min-h-full">
      {/* Fixed themed void behind everything. */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-30"
        style={{
          background:
            'radial-gradient(ellipse 115% 78% at 50% 50%, var(--color-surface, #0e0f11) 0%, var(--color-bg, #0B0B0C) 56%)',
        }}
      />
      {/* Header scrim — the transparent fixed nav always reads over the scene. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-[5] h-32"
        style={{
          background:
            'linear-gradient(to bottom, color-mix(in srgb, var(--color-bg) 80%, transparent), color-mix(in srgb, var(--color-bg) 40%, transparent), transparent)',
        }}
      />

      <AboutMobilePage content={content} assets={assets} />
    </div>
  )
}

export default AboutExperience
