import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import type { MediaIndexEntry } from '@/features/cms/media/mediaIndex.types'
import { resolveAboutContent } from './content/resolveAboutContent'
import { ABOUT_CINEMATIC_MQ } from './aboutBreakpoints'
import { AboutStaticPage } from './static/AboutStaticPage'

const AboutScrollExperience = lazy(() => import('./scroll/AboutScrollExperience'))

export type AboutPageAssets = Record<string, string | undefined>

/**
 * The About page — one story, two renditions behind one CMS contract:
 *
 * - **The film** (desktop ≥1280px, no reduced motion): a continuous
 *   scrollytelling journey — hero cold open, one full-screen chapter per orb,
 *   the marquee ribbon, and the interactive Forge Altar finale whose strikes
 *   scroll the film back to a chapter.
 * - **The static page** (mobile/tablet, reduced motion, and SSR): a clean
 *   scrolling About page with the same CMS content and imagery — no pins, no
 *   WebGL.
 *
 * SSR + the first client paint always render the static page (full content in
 * the DOM for SEO/AT); the film swaps in after hydration when its gate
 * passes. WebGL availability is deliberately not part of this gate — the DOM
 * film stands alone, and only the canvas layers check for WebGL themselves.
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
  const [cinematic, setCinematic] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(ABOUT_CINEMATIC_MQ)
    const update = () => setCinematic(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

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

      {cinematic ? (
        <Suspense fallback={<AboutStaticPage content={content} assets={assets} />}>
          <AboutScrollExperience content={content} assets={assets} />
        </Suspense>
      ) : (
        <AboutStaticPage content={content} assets={assets} />
      )}
    </div>
  )
}

export default AboutExperience
