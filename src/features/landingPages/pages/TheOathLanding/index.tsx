import { useMemo, useRef } from 'react'
import { useLandingEntry } from '@/features/landingPages/LandingEntryContext'
import type { LandingPageComponentProps } from '../../types'
import { bindOathCmsAssets, bindOathCmsThemedMarkups } from './theOathAssets'
import { resolveOathContent } from './content/resolveOathContent'
import { OathMotionContext, createOathMotionState } from './motion/oathMotionState'
import { OathHero } from './components/OathHero'
import { OathManifesto } from './components/OathManifesto'
import { OathTenets } from './components/OathTenets'
import { ProductRevealSequence } from './components/ProductRevealSequence'
import { OathFinale } from './components/OathFinale'
import { OathCursor } from './components/OathCursor'
import { OathProgressRail } from './components/OathProgressRail'
import { OathCanvasGate } from './webgl/OathCanvasGate'
import { useTheOathScrollTimeline } from './hooks/useTheOathScrollTimeline'
import { usePointerMotion } from './hooks/usePointerMotion'

/**
 * Drop 01 — The Oath.
 *
 * One cinematic landing film merging both Oath experiences: a scroll-scrubbed
 * video hero with a 3D monolith logo (the persistent WebGL layer) that drifts
 * to centre on scroll, a cursor spotlight reveal, a pinned creed, a horizontal
 * tenets panorama, a horizontally-assembling product reveal, and a forge-in
 * finale. A fixed transparent WebGL layer (monolith + dust) sits above the hero
 * film and behind all content; sections are transparent over the themed void so
 * the monolith shows through as it recedes.
 *
 * Composition only — scenes own markup + `data-*` hooks; motion lives in
 * `hooks/useTheOathScrollTimeline`; the shared motion state bridges
 * ScrollTrigger writes to WebGL uniform reads. WebGL + cursor mount via their
 * gates (≥1280px / `xl` fine-pointer desktop, WebGL-capable, no reduced motion).
 * Copy + assets are CMS-editable; every field falls back to code defaults.
 *
 * See `docs/landing-pages.md`.
 */
export function TheOathLanding({
  products,
  assets,
  themedMarkups,
  landingContent,
}: LandingPageComponentProps) {
  bindOathCmsAssets(assets)
  bindOathCmsThemedMarkups(themedMarkups ?? {})
  const content = useMemo(() => resolveOathContent(landingContent), [landingContent])

  const root = useRef<HTMLDivElement | null>(null)
  const motionRef = useRef(createOathMotionState())
  const { homeEntryComplete } = useLandingEntry()
  useTheOathScrollTimeline(root, homeEntryComplete, motionRef.current)
  usePointerMotion(root, motionRef.current)

  return (
    <OathMotionContext.Provider value={motionRef.current}>
      <div
        ref={root}
        data-oath-root
        className="group/oath relative isolate min-h-full"
      >
        {/* Fixed void backdrop — the themed near-black behind everything; the
            monolith canvas + hero film paint over it. */}
        <div
          aria-hidden="true"
          className="fixed inset-0 -z-30"
          style={{
            background:
              'radial-gradient(ellipse 120% 100% at 50% 30%, var(--color-surface, #0e0f11) 0%, var(--color-bg, #0B0B0C) 70%)',
          }}
        />
        {/* WebGL layer (monolith + dust) — above the hero film, below content. */}
        <OathCanvasGate root={root} motion={motionRef.current} />
        {/* Header scrim — the transparent fixed nav always reads over the scene. */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 z-[5] h-32"
          style={{
            background:
              'linear-gradient(to bottom, color-mix(in srgb, var(--color-bg) 80%, transparent), color-mix(in srgb, var(--color-bg) 40%, transparent), transparent)',
          }}
        />
        <OathCursor root={root} />
        <OathProgressRail />
        <OathHero hero={content.hero} />
        <OathManifesto manifesto={content.manifesto} />
        <OathTenets tenets={content.tenets} />
        <ProductRevealSequence products={products} content={content.products} />
        <OathFinale finale={content.finale} />
      </div>
    </OathMotionContext.Provider>
  )
}

export default TheOathLanding
