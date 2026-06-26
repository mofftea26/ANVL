import { useMemo, useRef } from 'react'
import { useLandingEntry } from '@/features/landingPages/LandingEntryContext'
import type { LandingPageComponentProps } from '../../types'
import { resolveOathModernContent } from './content/resolveOathModernContent'
import {
  OathModernMotionContext,
  createOathModernMotionState,
} from './motion/oathModernMotionState'
import { useOathModernTimeline } from './hooks/useOathModernTimeline'
import { useOathModernPointerMotion } from './hooks/useOathModernPointerMotion'
import { OathModernCanvasGate } from './webgl/OathModernCanvasGate'
import { OmThreshold } from './components/OmThreshold'

/** Bundled defaults served from `public/` — all CMS-overridable via asset slots. */
const OATH_MODERN_HERO_MODEL = '/models/oath-titan-sweep.glb'
const OATH_MODERN_PLATES = {
  heroBackground: '/images/oath-modern/hero-forge.webp',
  oathBackdrop: '/images/oath-modern/oath-relief.webp',
  atmospherePlate: '/images/oath-modern/atmosphere.webp',
} as const
import { OmPressure } from './components/OmPressure'
import { OmFormation } from './components/OmFormation'
import { OmOath } from './components/OmOath'
import { OmArmory } from './components/OmArmory'
import { OmConversion } from './components/OmConversion'

/**
 * The Oath Modern — the continuous-3D ceremonial flagship for Drop 01
 * (key `theoath-modern`).
 *
 * Six chapters tell one evolving world: Threshold → Pressure → Formation →
 * The Oath → The Armory → The Vow. This module owns *composition only* — each
 * chapter owns its markup and `data-om-*` motion hooks. The persistent WebGL
 * canvas (M3) and the single-progress GSAP choreography (M4) attach over this
 * SSR-first DOM; on mobile / tablet / reduced-motion / no-WebGL the composed
 * static layout below is the experience. Copy + assets are CMS-editable and every
 * field falls back to designed code defaults.
 */
export function OathModern({
  products,
  assets,
  landingContent,
}: LandingPageComponentProps) {
  const content = useMemo(
    () => resolveOathModernContent(landingContent),
    [landingContent],
  )

  const heroProduct = useMemo(
    () =>
      products.find((p) => p.slug === content.threshold.heroProductSlug) ??
      products[0],
    [products, content.threshold.heroProductSlug],
  )

  const heroProductPng = assets.heroProductPng ?? null
  const heroBackground = assets.heroBackground ?? OATH_MODERN_PLATES.heroBackground
  // The Titan Sweep compression shirt as a 3D mesh (generated from the studio
  // concept render). CMS-overridable via the `heroProductModel` slot; the bundled
  // model is the designed default so the journey orbits the real garment.
  const heroProductModel = assets.heroProductModel ?? OATH_MODERN_HERO_MODEL
  const materialsMacro = assets.materialsMacro ?? null
  const oathBackdrop = assets.oathBackdrop ?? OATH_MODERN_PLATES.oathBackdrop
  const atmospherePlate = assets.atmospherePlate ?? OATH_MODERN_PLATES.atmospherePlate

  const root = useRef<HTMLDivElement | null>(null)
  const motionRef = useRef(createOathModernMotionState())
  const { homeEntryComplete } = useLandingEntry()
  useOathModernTimeline(root, homeEntryComplete, motionRef.current)
  useOathModernPointerMotion(root, motionRef.current)

  return (
    <OathModernMotionContext.Provider value={motionRef.current}>
      <div
        ref={root}
        data-oath-modern-root
        className="relative isolate min-h-full bg-[var(--color-bg)] text-[color:var(--color-text)]"
      >
        {/* Persistent forged WebGL world (desktop + WebGL + no-reduced-motion).
            Behind all content; the static hero stage hands off via CSS. */}
        <OathModernCanvasGate root={root} motion={motionRef.current} modelUrl={heroProductModel} />

        <OmThreshold
          content={content}
          heroProduct={heroProduct}
          heroProductPng={heroProductPng}
          heroBackground={heroBackground}
        />
        <OmPressure content={content} />
        <OmFormation content={content} materialsMacro={materialsMacro} />
        <OmOath content={content} oathBackdrop={oathBackdrop} />
        <OmArmory content={content} products={products} />
        <OmConversion content={content} atmospherePlate={atmospherePlate} />
      </div>
    </OathModernMotionContext.Provider>
  )
}

export default OathModern
