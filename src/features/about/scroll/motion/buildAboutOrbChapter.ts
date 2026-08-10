import { gsap } from '@/shared/lib/gsap'
import type { AboutScrollMotion } from './aboutMotionState'
import { ABOUT_SCROLL } from './aboutScrollTiming'
import { splitUnits } from './splitUnits'

/**
 * One orb chapter of the film — the SAME parameterized builder runs for every
 * orb section, so the choreography scales with the CMS orb count (up to 10).
 *
 * The pin scrubs three beats (fractions from `aboutScrollTiming`):
 *
 * - MATERIALIZE — the full-bleed backdrop condenses out of the depth (blur
 *   clears, scale settles from 1.1, the wash lifts) while the chapter copy
 *   forges in: the title's words mask-reveal, the `[data-orb-reveal]` blocks
 *   rise staggered, numeric stats count up with the scrub.
 * - HOLD — the chapter owns the frame; the backdrop drifts almost
 *   imperceptibly so it never freezes into a screenshot.
 * - DISSOLVE — the chapter releases PAST the camera: scale pushes on beyond
 *   1, blur returns, the copy lifts away. Scrolling feels like moving through
 *   the chapter, not past it.
 *
 * The trigger registers as `about-orb-pin-<index>` — the scroll-to lookup key
 * the altar's strike answer uses. Boundary crossings bump the motion state's
 * `boundaryBurst` for the WebGL ember field.
 */
export function buildAboutOrbChapter(
  section: HTMLElement,
  index: number,
  motion: AboutScrollMotion,
): () => void {
  const q = (sel: string) => gsap.utils.toArray<HTMLElement>(sel, section)
  const disposers: Array<() => void> = []
  const { materializeEnd, holdEnd } = ABOUT_SCROLL

  const title = section.querySelector('h2') as HTMLElement | null
  let titleUnits: HTMLElement[] = []
  if (title) {
    const { units, revert } = splitUnits(title, 'words')
    titleUnits = units
    disposers.push(revert)
  }

  const media = q('[data-chapter-media]')
  const reveals = q('[data-orb-reveal]')
  const ghost = q('[data-chapter-num]')

  const tl = gsap.timeline({
    scrollTrigger: {
      id: `about-orb-pin-${index}`,
      trigger: section,
      start: 'top top',
      end: `+=${ABOUT_SCROLL.chapterPinPct}%`,
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        motion.chapterIndex = index
        motion.chapterProgress = self.progress
      },
      onLeave: () => {
        motion.boundaryBurst += 1
        motion.boundaryFrom = index
        motion.boundaryTo = index + 1
      },
      onLeaveBack: () => {
        motion.boundaryBurst += 1
        motion.boundaryFrom = index
        motion.boundaryTo = index - 1
      },
    },
  })

  // — MATERIALIZE (0 → materializeEnd)
  tl.fromTo(
    media,
    { opacity: 0, scale: 1.1, filter: 'blur(14px)' },
    { opacity: 1, scale: 1, filter: 'blur(0px)', ease: 'power2.out', duration: materializeEnd },
    0,
  )
  if (titleUnits.length) {
    tl.fromTo(
      titleUnits,
      { yPercent: 120 },
      {
        yPercent: 0,
        ease: 'power3.out',
        duration: materializeEnd * 0.7,
        stagger: { each: (materializeEnd * 0.25) / Math.max(1, titleUnits.length), from: 'start' },
      },
      materializeEnd * 0.15,
    )
  }
  if (reveals.length) {
    tl.fromTo(
      reveals,
      { opacity: 0, y: 34 },
      {
        opacity: 1,
        y: 0,
        ease: 'power3.out',
        duration: materializeEnd * 0.6,
        stagger: (materializeEnd * 0.35) / Math.max(1, reveals.length),
      },
      materializeEnd * 0.25,
    )
  }
  if (ghost.length) {
    tl.fromTo(
      ghost,
      { opacity: 0, xPercent: 6 },
      { opacity: 0.5, xPercent: 0, ease: 'power2.out', duration: materializeEnd },
      0,
    )
  }

  // Numeric stats count up with the scrub (and back down when scrubbed back).
  for (const stat of q('[data-orb-stat-value]')) {
    const target = Number(stat.getAttribute('data-stat-target'))
    if (!Number.isFinite(target)) continue
    const proxy = { v: 0 }
    tl.to(
      proxy,
      {
        v: target,
        ease: 'power1.out',
        duration: materializeEnd * 0.8,
        onUpdate: () => {
          stat.textContent = String(Math.round(proxy.v))
        },
      },
      materializeEnd * 0.3,
    )
  }

  // — HOLD (materializeEnd → holdEnd): near-still drift, never a freeze.
  tl.to(media, { scale: 1.035, ease: 'none', duration: holdEnd - materializeEnd }, materializeEnd)

  // — DISSOLVE (holdEnd → 1): release past the camera.
  const dissolve = 1 - holdEnd
  tl.to(
    media,
    { opacity: 0, scale: 1.16, filter: 'blur(10px)', ease: 'power2.in', duration: dissolve },
    holdEnd,
  )
  if (reveals.length) {
    tl.to(reveals, { opacity: 0, y: -26, ease: 'power2.in', duration: dissolve * 0.8 }, holdEnd)
  }
  if (titleUnits.length) {
    tl.to(titleUnits, { yPercent: -120, ease: 'power2.in', duration: dissolve * 0.8 }, holdEnd + dissolve * 0.1)
  }
  if (ghost.length) {
    tl.to(ghost, { opacity: 0, ease: 'power2.in', duration: dissolve * 0.6 }, holdEnd)
  }

  return () => {
    for (const dispose of disposers) dispose()
  }
}
