import { useMemo, useRef } from 'react'
import { resolveAboutContent } from './content/resolveAboutContent'
import { AboutMotionContext, createAboutMotionState } from './motion/aboutMotionState'
import { useAboutScrollTimeline } from './hooks/useAboutScrollTimeline'
import { AboutCanvasGate } from './webgl/AboutCanvasGate'
import { AboutHero } from './components/AboutHero'
import { AboutPhilosophy } from './components/AboutPhilosophy'
import { AboutMaterials } from './components/AboutMaterials'
import { AboutConstruction } from './components/AboutConstruction'
import { AboutTesting } from './components/AboutTesting'
import { AboutFinale } from './components/AboutFinale'

export type AboutPageAssets = Record<string, string | undefined>

/**
 * The About page — one continuous cinematic scroll film: hero/origin →
 * philosophy → the forge process (materials → construction → testing/fun
 * facts) → finale. A single persistent 3D monolith (CMS-uploaded GLB) drifts
 * through the whole page, receding through the process scenes and returning
 * enlarged at the finale (`hooks/useAboutScrollTimeline` + `webgl/AboutMonolith`).
 *
 * Composition only — scenes own markup + `data-*` hooks; motion lives in
 * `hooks/useAboutScrollTimeline`. Copy is CMS-editable (`/admin/about`),
 * imagery is CMS-assigned (`/admin/assets` → Page — About); every field falls
 * back to a designed code default so the page is never blank.
 */
export function AboutExperience({
  landingContent,
  assets,
}: {
  landingContent: unknown
  assets: AboutPageAssets
}) {
  const content = useMemo(() => resolveAboutContent(landingContent), [landingContent])

  const root = useRef<HTMLDivElement | null>(null)
  const motionRef = useRef(createAboutMotionState())
  useAboutScrollTimeline(root, motionRef.current)

  const [materialsStep, constructionStep, testingStep] = content.process.steps

  return (
    <AboutMotionContext.Provider value={motionRef.current}>
      <div ref={root} data-about-root className="group/about relative isolate min-h-full">
        <div
          aria-hidden="true"
          className="fixed inset-0 -z-30"
          style={{
            background:
              'radial-gradient(ellipse 115% 78% at 50% 50%, var(--color-surface, #0e0f11) 0%, var(--color-bg, #0B0B0C) 56%)',
          }}
        />
        <AboutCanvasGate root={root} modelUrl={assets.monolithModel} motion={motionRef.current} />

        <AboutHero hero={content.hero} heroImage={assets.heroImage} />
        <AboutPhilosophy philosophy={content.philosophy} />
        {materialsStep ? (
          <AboutMaterials
            step={materialsStep}
            image1={assets.materialsImage1}
            image2={assets.materialsImage2}
          />
        ) : null}
        {constructionStep ? (
          <AboutConstruction
            step={constructionStep}
            image1={assets.constructionImage1}
            image2={assets.constructionImage2}
          />
        ) : null}
        {testingStep ? (
          <AboutTesting step={testingStep} stats={content.stats} testingImage={assets.testingImage} />
        ) : null}
        <AboutFinale finale={content.finale} finaleImage={assets.finaleBackdrop} />
      </div>
    </AboutMotionContext.Provider>
  )
}

export default AboutExperience
