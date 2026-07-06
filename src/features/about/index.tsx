import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import type { MediaIndexEntry } from '@/features/cms/media/mediaIndex.types'
import { isWebglAvailable } from '@/shared/webgl/isWebglAvailable'
import { resolveAboutContent } from './content/resolveAboutContent'
import { ABOUT_ALTAR_MQ } from './aboutBreakpoints'
import { useAboutViewMode } from './hooks/useAboutViewMode'
import { AboutHeader } from './components/AboutHeader'
import { AboutMobilePage } from './mobile/AboutMobilePage'

const AboutAltar = lazy(() => import('./altar/AboutAltar'))

export type AboutPageAssets = Record<string, string | undefined>

/**
 * The About page — two experiences behind one CMS contract:
 *
 * - **The Forge Altar** (desktop ≥1280px, no reduced motion, WebGL): a
 *   non-scrollable 100svh stage — 3D anvil under an aurora, six content orbs
 *   in orbit; picking one summons the hammer, and the strike forges open a
 *   modal with that section's content. GSAP + three.js drive everything.
 * - **The normal page** (mobile/tablet, reduced motion, no WebGL, and SSR):
 *   a clean scrolling About page with the same CMS content and imagery.
 *
 * SSR + the first client paint always render the normal page (full content in
 * the DOM for SEO/AT); the altar swaps in after hydration when its gate
 * passes and fades in from the void. On altar-capable devices a small header
 * (`AboutHeader`) carries a view switch so a reader can move between the two
 * at will — their choice is remembered for next time
 * (`useAboutViewMode`). Copy is CMS-editable (`/admin/about`), imagery + the
 * anvil/hammer GLBs CMS-assigned (`/admin/assets` → Page — About); every
 * field falls back to a designed code default.
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
  const [capable, setCapable] = useState(false)
  const [viewMode, setViewMode] = useAboutViewMode(capable)

  useEffect(() => {
    const media = window.matchMedia(ABOUT_ALTAR_MQ)
    const update = () => setCapable(media.matches && isWebglAvailable())
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  const showAltar = capable && viewMode === 'altar'

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

      {capable ? <AboutHeader mode={viewMode} onChange={setViewMode} /> : null}

      {showAltar ? (
        <Suspense fallback={<div className="h-[100svh] w-full" aria-hidden="true" />}>
          <AboutAltar content={content} assets={assets} />
        </Suspense>
      ) : (
        <AboutMobilePage content={content} assets={assets} />
      )}
    </div>
  )
}

export default AboutExperience
