import { useEffect, useMemo, useRef } from 'react'
import type { AboutResolvedContent } from '../content/aboutContent.defaults'
import { orbImage } from '../content/resolveAboutContent'
import type { AboutPageAssets } from '../index'
import { createAltarState } from '../altar/altarState'
import { useAltarStrike } from '../altar/useAltarStrike'
import {
  AboutScrollMotionContext,
  createAboutScrollMotion,
  type AboutScrollMotion,
} from './motion/aboutMotionState'
import { useAboutScrollTimeline } from './hooks/useAboutScrollTimeline'
import { useAboutOrbScrollTo } from './hooks/useAboutOrbScrollTo'
import { AboutScrollCanvasGate } from './webgl/AboutScrollCanvasGate'
import { AboutHeroSection } from './sections/AboutHeroSection'
import { AboutOrbSection } from './sections/AboutOrbSection'
import { AboutMarqueeSection } from './sections/AboutMarqueeSection'
import { AboutAltarSection } from './sections/AboutAltarSection'

/**
 * The About film — desktop ≥1280px, no reduced motion. One continuous
 * scrollytelling journey over the fixed void: the hero cold open, one
 * full-screen chapter per CMS orb (materialize → hold → dissolve, per-section
 * pins in normal flow), the marquee ribbon, and the interactive Forge Altar
 * finale — where striking an orb scrolls the film back up to its chapter.
 *
 * Sections carry markup + `data-*` hooks only; every scrubbed move lives in
 * `motion/build*.ts` builders against the `aboutScrollTiming` clock, and the
 * WebGL depth canvas reads the one mutable {@link AboutScrollMotion} bridge.
 */
export default function AboutScrollExperience({
  content,
  assets,
}: {
  content: AboutResolvedContent
  assets: AboutPageAssets
}) {
  const root = useRef<HTMLDivElement | null>(null)
  const altarSectionRef = useRef<HTMLElement | null>(null)
  const motionRef = useRef<AboutScrollMotion | null>(null)
  if (motionRef.current === null || motionRef.current.chapterCount !== content.orbs.length) {
    motionRef.current = createAboutScrollMotion(content.orbs.length)
  }
  const motion = motionRef.current
  const orbIds = useMemo(() => content.orbs.map((orb) => orb.id), [content.orbs])
  // The altar stage's own state — the journey carries the film, this carries
  // the forge. One instance shared by the strike ceremony (DOM side) and the
  // in-canvas stage.
  const altarState = useMemo(() => createAltarState(content.orbs.length), [content.orbs.length])

  useAboutScrollTimeline(root, motion, orbIds)
  const scrollToChapter = useAboutOrbScrollTo()
  const { strike } = useAltarStrike({
    state: altarState,
    root: altarSectionRef,
    onOrbStruck: scrollToChapter,
  })

  // Pointer → depth-rig parallax + the stage's idle tilt (one passive
  // listener feeding both mutable bridges).
  useEffect(() => {
    let lastX = 0
    let lastY = 0
    let lastT = 0
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1
      const ny = (e.clientY / window.innerHeight) * 2 - 1
      const now = e.timeStamp
      if (lastT > 0) {
        const dt = Math.max(8, now - lastT) / 1000
        motion.pointerVX = (nx - lastX) / dt
        motion.pointerVY = (ny - lastY) / dt
        altarState.pointerVX = motion.pointerVX
        altarState.pointerVY = motion.pointerVY
      }
      motion.pointerX = nx
      motion.pointerY = ny
      altarState.pointerX = nx
      altarState.pointerY = ny
      lastX = nx
      lastY = ny
      lastT = now
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [motion, altarState])

  return (
    <AboutScrollMotionContext.Provider value={motion}>
      <div ref={root} data-about-scroll className="relative">
        <AboutScrollCanvasGate
          root={root}
          motion={motion}
          altar={{
            state: altarState,
            orbs: content.orbs,
            anvilUrl: assets.anvilModel,
            hammerUrl: assets.hammerModel,
            onSelect: strike,
          }}
          chapters={{
            heroImage: assets.heroImage,
            images: content.orbs.map((orb) => orbImage(orb, assets)),
            colors: content.orbs.map((orb) => orb.color),
          }}
        />
        <AboutHeroSection hero={content.hero} image={assets.heroImage} />
        {content.orbs.map((orb, index) => (
          <AboutOrbSection key={orb.id} orb={orb} image={orbImage(orb, assets)} index={index} />
        ))}
        <AboutMarqueeSection text={content.marquee.text} />
        <AboutAltarSection
          orbs={content.orbs}
          forgeBackdrop={assets.forgeBackdrop}
          sectionRef={altarSectionRef}
          onPick={strike}
        />
      </div>
    </AboutScrollMotionContext.Provider>
  )
}
