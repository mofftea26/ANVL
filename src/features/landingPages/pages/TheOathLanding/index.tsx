import { useRef } from 'react'
import { ForgeAtmosphere } from '@/shared/components/premium/ForgeAtmosphere'
import type { LandingPageComponentProps } from '../../types'
import { LandingPreloader } from './components/LandingPreloader'
import { CinematicHero } from './components/CinematicHero'
import { ManifestoScene } from './components/ManifestoScene'
import { ChapterGallery } from './components/ChapterGallery'
import { ProductRevealSequence } from './components/ProductRevealSequence'
import { FinalDropCTA } from './components/FinalDropCTA'
import { useTheOathScrollTimeline } from './hooks/useTheOathScrollTimeline'
import { usePreloadLandingAssets } from './hooks/usePreloadLandingAssets'

/**
 * Drop 01 — The Oath.
 *
 * A scroll-driven cinematic brand film (full-bleed media planes, parallax,
 * pinned + scrubbed scenes, a cross-dissolving chapter gallery), not a stack of
 * fade-in sections. Composition only — every scene owns its markup + `data-*`
 * hooks; all motion lives in {@link useTheOathScrollTimeline}. Media falls back
 * to duotone + Drop-logo placeholders (`theOathAssets.ts`). After the final
 * scene releases, normal page scroll (the footer) continues — never trapped.
 *
 * Code-owned content; the CMS only chooses that this page is active.
 * See `docs/landing-pages.md`.
 */
export function TheOathLanding({ products }: LandingPageComponentProps) {
  const root = useRef<HTMLDivElement | null>(null)
  useTheOathScrollTimeline(root)
  usePreloadLandingAssets()

  return (
    <div ref={root} className="relative bg-[var(--color-bg)]">
      {/* One persistent forge environment behind every scene — transparent
          scenes bleed through it so the page reads as a single continuous film
          rather than stacked sections. */}
      <ForgeAtmosphere className="fixed" />
      <LandingPreloader />
      <CinematicHero />
      <ManifestoScene />
      <ChapterGallery />
      <ProductRevealSequence products={products} />
      <FinalDropCTA />
    </div>
  )
}

export default TheOathLanding
