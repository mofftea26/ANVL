import { useEffect, useMemo, useRef } from 'react'
import type { AboutResolvedContent } from '../content/aboutContent.defaults'
import { orbImage } from '../content/resolveAboutContent'
import type { AboutPageAssets } from '../index'
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
  const motionRef = useRef<AboutScrollMotion | null>(null)
  if (motionRef.current === null || motionRef.current.chapterCount !== content.orbs.length) {
    motionRef.current = createAboutScrollMotion(content.orbs.length)
  }
  const motion = motionRef.current
  const orbIds = useMemo(() => content.orbs.map((orb) => orb.id), [content.orbs])

  useAboutScrollTimeline(root, motion, orbIds)
  const scrollToChapter = useAboutOrbScrollTo()

  // Pointer → depth-rig parallax (one passive listener; the altar keeps its
  // own for the stage's camera drift).
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
      }
      motion.pointerX = nx
      motion.pointerY = ny
      lastX = nx
      lastY = ny
      lastT = now
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [motion])

  return (
    <AboutScrollMotionContext.Provider value={motion}>
      <div ref={root} data-about-scroll className="relative">
        <AboutScrollCanvasGate root={root} motion={motion} />
        <AboutHeroSection hero={content.hero} image={assets.heroImage} />
        {content.orbs.map((orb, index) => (
          <AboutOrbSection key={orb.id} orb={orb} image={orbImage(orb, assets)} index={index} />
        ))}
        <AboutMarqueeSection text={content.marquee.text} />
        <AboutAltarSection content={content} assets={assets} onOrbStruck={scrollToChapter} />
      </div>
    </AboutScrollMotionContext.Provider>
  )
}
