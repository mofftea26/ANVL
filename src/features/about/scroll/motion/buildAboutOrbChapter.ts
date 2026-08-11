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
 *   clears, scale settles from deep, a slight upward drift) while the whole
 *   content frame ARRIVES dimensionally — a perspective tilt (rotationX)
 *   easing flat as it rises — and the copy forges in: the title's words
 *   mask-reveal, the `[data-orb-reveal]` blocks rise staggered, numeric
 *   stats count up with the scrub.
 * - HOLD — the chapter owns the frame; the backdrop and frame drift almost
 *   imperceptibly so nothing ever freezes into a screenshot.
 * - DISSOLVE — the chapter releases PAST the camera: scale pushes on beyond
 *   1, blur returns, the frame tips away and the copy lifts out. Scrolling
 *   feels like moving through the chapter, not past it.
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
  const frame = q('[data-chapter-frame]')
  const reveals = q('[data-orb-reveal]')
  const ghost = q('[data-chapter-num]')

  const tl = gsap.timeline({
    scrollTrigger: {
      id: `about-orb-pin-${index}`,
      trigger: section,
      start: 'top top',
      end: `+=${ABOUT_SCROLL.chapterPinPct}%`,
      pin: true,
      scrub: ABOUT_SCROLL.scrubSmoothing,
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
    { opacity: 0, scale: 1.18, yPercent: 4, filter: 'blur(18px)' },
    {
      opacity: 1,
      scale: 1,
      yPercent: 0,
      filter: 'blur(0px)',
      ease: 'power3.out',
      duration: materializeEnd,
    },
    0,
  )
  // The whole content frame arrives DIMENSIONALLY — tipped back in
  // perspective and below its seat, easing flat as it rises. This one
  // transform is what reads as "the chapter turns to face you" rather than
  // "a div faded in".
  if (frame.length) {
    tl.fromTo(
      frame,
      {
        rotationX: 6,
        yPercent: 4,
        scale: 0.965,
        transformPerspective: 1200,
        transformOrigin: '50% 85%',
      },
      {
        rotationX: 0,
        yPercent: 0,
        scale: 1,
        ease: 'power3.out',
        duration: materializeEnd,
      },
      0,
    )
  }
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
      { opacity: 0 },
      { opacity: 0.5, ease: 'power2.out', duration: materializeEnd },
      0,
    )
    // The numeral travels the WHOLE pin on its own slow lane — foreground
    // set-dressing moving against the backdrop is a constant depth cue.
    tl.fromTo(ghost, { xPercent: 7 }, { xPercent: -7, ease: 'none', duration: 1 }, 0)
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
  const hold = holdEnd - materializeEnd
  tl.to(media, { scale: 1.045, ease: 'none', duration: hold }, materializeEnd)
  if (frame.length) {
    tl.to(frame, { yPercent: -1.8, ease: 'none', duration: hold }, materializeEnd)
  }

  // — DISSOLVE (holdEnd → 1): release past the camera — the frame tips away
  //   the opposite direction it arrived from, so the pass-through reads as
  //   one continuous rotation the reader scrolled through.
  const dissolve = 1 - holdEnd
  tl.to(
    media,
    {
      opacity: 0,
      scale: 1.2,
      yPercent: -3,
      filter: 'blur(12px)',
      ease: 'power2.in',
      duration: dissolve,
    },
    holdEnd,
  )
  if (frame.length) {
    tl.to(
      frame,
      { rotationX: -5, yPercent: -5, scale: 1.03, ease: 'power2.in', duration: dissolve },
      holdEnd,
    )
  }
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
