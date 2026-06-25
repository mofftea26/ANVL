import { useMemo, useRef } from 'react'
import { useLandingEntry } from '@/features/landingPages/LandingEntryContext'
import type { LandingPageComponentProps } from '../../types'
import { resolveTheoathModernContent } from './content/resolveTheoathModernContent'
import { TmMotionContext, createTmMotionState } from './motion/tmMotionState'
import { useTheoathModernTimeline } from './hooks/useTheoathModernTimeline'
import { useTmPointerMotion } from './hooks/useTmPointerMotion'
import { TmScrollProgress } from './components/TmScrollProgress'
import { TmCursor } from './components/TmCursor'
import { TmHero } from './components/TmHero'
import { TmTechKnitLab } from './components/TmTechKnitLab'
import { TmCollection } from './components/TmCollection'
import { TmPerformanceBenefits } from './components/TmPerformanceBenefits'
import { TmMaterialsEngineering } from './components/TmMaterialsEngineering'
import { TmConversion } from './components/TmConversion'

/**
 * Theoath Modern — a dark technical product-laboratory experience for Drop 01.
 *
 * Composition only: sections own their markup + `data-tm-*` motion hooks; the
 * GSAP choreography lives in `hooks/useTheoathModernTimeline` and writes into the
 * shared motion state that bridges to the lazy WebGL platform. Desktop (`≥1280px`,
 * no reduced motion) gets the cinematic hero entrance, scroll-linked depth,
 * section reveals, bleed transitions, magnetics, and the procedural Three.js
 * stage; mobile / tablet / reduced-motion get the static composed layout. Copy +
 * assets are CMS-editable; every field falls back to code defaults.
 */
export function TheoathModern({
  products,
  assets,
  landingContent,
  mediaIndex,
}: LandingPageComponentProps) {
  const content = useMemo(
    () => resolveTheoathModernContent(landingContent, { mediaIndex }),
    [landingContent, mediaIndex],
  )

  const heroProduct = useMemo(
    () =>
      products.find((p) => p.slug === content.hero.heroProductSlug) ?? products[0],
    [products, content.hero.heroProductSlug],
  )

  const root = useRef<HTMLDivElement | null>(null)
  const motionRef = useRef(createTmMotionState())
  const { homeEntryComplete } = useLandingEntry()
  useTheoathModernTimeline(root, homeEntryComplete, motionRef.current)
  useTmPointerMotion(root, motionRef.current)

  const heroProductPng = assets.heroProductPng ?? null
  const heroBackground = assets.heroBackground ?? null
  const knitMacro = assets.knitMacro ?? null
  const materialsMacro = assets.materialsMacro ?? null
  const fogPlate = assets.fogPlate ?? null

  return (
    <TmMotionContext.Provider value={motionRef.current}>
      <div
        ref={root}
        data-theoath-modern-root
        className="relative isolate min-h-full bg-[var(--color-bg)] text-[var(--color-text)]"
      >
        <TmScrollProgress />
        <TmCursor />
        {/* Lab atmosphere — themed fog wash + fine technical grid behind content. */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10"
          style={{
            background:
              'radial-gradient(ellipse 120% 90% at 70% 12%, color-mix(in srgb, var(--color-surface) 60%, transparent) 0%, var(--color-bg) 65%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(var(--color-line) 1px, transparent 1px), linear-gradient(90deg, var(--color-line) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        <TmHero
          root={root}
          content={content}
          heroProduct={heroProduct}
          heroProductPng={heroProductPng}
          heroBackground={heroBackground}
        />
        <TmTechKnitLab content={content} knitMacro={knitMacro} />
        <TmCollection content={content} products={products} />
        <TmPerformanceBenefits content={content} />
        <TmMaterialsEngineering content={content} materialsMacro={materialsMacro} />
        <TmConversion content={content} fogPlate={fogPlate} />
      </div>
    </TmMotionContext.Provider>
  )
}

export default TheoathModern
