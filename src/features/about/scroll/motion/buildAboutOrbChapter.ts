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

  // DIRECTION SCHEME — the WHOLE section (backdrop + content frame) travels
  // one axis per chapter, and the exit CONTINUES that motion: what arrives
  // from the left leaves to the right; what rises from the depth leaves PAST
  // the lens (huge, soft); what lands from the front recedes back into the
  // depth; diagonals cross corner-to-corner. Six schemes cycling by index,
  // so consecutive chapters never repeat an axis — the film reads as
  // movement through a space, never a page scrolling upward. The frame's
  // depth legs ride real perspective z (`transformPerspective` is set once
  // below); the media uses scale for the same read at full-bleed safety.
  interface TravelScheme {
    mediaIn: gsap.TweenVars
    mediaOut: gsap.TweenVars
    frameIn: gsap.TweenVars
    frameOut: gsap.TweenVars
  }
  const SCHEMES: TravelScheme[] = [
    {
      // Swing in from the LEFT → carry on out the RIGHT.
      mediaIn: { xPercent: -14, scale: 1.14, filter: 'blur(14px)' },
      mediaOut: { xPercent: 13, scale: 1.1, filter: 'blur(12px)' },
      frameIn: { xPercent: -26, rotationY: 16, scale: 0.96, transformOrigin: '10% 50%' },
      frameOut: { xPercent: 24, rotationY: -14, scale: 0.99, transformOrigin: '90% 50%' },
    },
    {
      // Rise from the DEPTH (far and small) → leave PAST the lens.
      mediaIn: { scale: 0.74, filter: 'blur(16px)' },
      mediaOut: { scale: 1.5, filter: 'blur(16px)' },
      frameIn: { z: -700, yPercent: 3 },
      frameOut: { z: 460, yPercent: -2 },
    },
    {
      // Swing in from the RIGHT → carry on out the LEFT.
      mediaIn: { xPercent: 14, scale: 1.14, filter: 'blur(14px)' },
      mediaOut: { xPercent: -13, scale: 1.1, filter: 'blur(12px)' },
      frameIn: { xPercent: 26, rotationY: -16, scale: 0.96, transformOrigin: '90% 50%' },
      frameOut: { xPercent: -24, rotationY: 14, scale: 0.99, transformOrigin: '10% 50%' },
    },
    {
      // Land from the FRONT (past the lens) → recede into the DEPTH.
      mediaIn: { scale: 1.42, filter: 'blur(20px)' },
      mediaOut: { scale: 0.72, filter: 'blur(14px)' },
      frameIn: { z: 470, yPercent: -3 },
      frameOut: { z: -640, yPercent: 2 },
    },
    {
      // Diagonal: in from the BOTTOM-RIGHT → out the TOP-LEFT.
      mediaIn: { xPercent: 10, yPercent: 8, scale: 1.16, filter: 'blur(14px)' },
      mediaOut: { xPercent: -9, yPercent: -8, scale: 1.1, filter: 'blur(12px)' },
      frameIn: { xPercent: 18, yPercent: 14, rotationY: -10, rotationX: 5, scale: 0.97 },
      frameOut: { xPercent: -16, yPercent: -13, rotationY: 8, rotationX: -4, scale: 1.01 },
    },
    {
      // Diagonal: in from the TOP-LEFT → out the BOTTOM-RIGHT.
      mediaIn: { xPercent: -10, yPercent: -8, scale: 1.16, filter: 'blur(14px)' },
      mediaOut: { xPercent: 9, yPercent: 8, scale: 1.1, filter: 'blur(12px)' },
      frameIn: { xPercent: -18, yPercent: -14, rotationY: 10, rotationX: -5, scale: 0.97 },
      frameOut: { xPercent: 16, yPercent: 13, rotationY: -8, rotationX: 4, scale: 1.01 },
    },
  ]
  const scheme = SCHEMES[index % SCHEMES.length]
  const NEUTRAL: gsap.TweenVars = {
    xPercent: 0,
    yPercent: 0,
    z: 0,
    rotationX: 0,
    rotationY: 0,
    scale: 1,
  }
  if (frame.length) gsap.set(frame, { transformPerspective: 1400 })

  // — MATERIALIZE (0 → materializeEnd)
  tl.fromTo(
    media,
    { opacity: 0, ...scheme.mediaIn },
    {
      opacity: 1,
      ...NEUTRAL,
      filter: 'blur(0px)',
      ease: 'power3.out',
      duration: materializeEnd,
    },
    0,
  )
  if (frame.length) {
    tl.fromTo(frame, scheme.frameIn, {
      ...NEUTRAL,
      ease: 'power3.out',
      duration: materializeEnd,
    }, 0)
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
  // THE REVEAL CASCADE — every element type earns its own entrance, staged
  // one after another through the materialize window (fractions of M):
  // typewriter eyebrow → masked title words → plate-reveal display lines →
  // blur-clearing body → sliding detail/points → popping stats → CTAs →
  // the tagline's tracking settle. Variety, not a uniform curtain-rise.
  const role = (name: string) => q(`[data-orb-reveal="${name}"]`)
  const M = materializeEnd
  // Sliding elements enter from the copy column's OUTSIDE edge (sections
  // alternate alignment per index), so the cascade always pushes inward.
  const edge = index % 2 === 1 ? 26 : -26

  const eyebrow = role('eyebrow')
  if (eyebrow.length) {
    // Typewriter: a chunky stepped clip wipe — text appears in keystrokes.
    tl.fromTo(
      eyebrow,
      { clipPath: 'inset(0% 100% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', ease: 'steps(14)', duration: M * 0.3 },
      M * 0.06,
    )
  }
  const lines = role('line')
  if (lines.length) {
    // Forged plates: each display line slides up out of its own clip seam.
    tl.fromTo(
      lines,
      { yPercent: 90, clipPath: 'inset(0% 0% 100% 0%)', opacity: 1 },
      {
        yPercent: 0,
        clipPath: 'inset(-8% 0% 0% 0%)',
        ease: 'power4.out',
        duration: M * 0.38,
        stagger: M * 0.11,
      },
      M * 0.26,
    )
  }
  const body = role('body')
  if (body.length) {
    tl.fromTo(
      body,
      { opacity: 0, y: 20, filter: 'blur(8px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', ease: 'power2.out', duration: M * 0.3 },
      M * 0.4,
    )
  }
  const detail = role('detail')
  if (detail.length) {
    tl.fromTo(
      detail,
      { opacity: 0, x: edge * 0.7 },
      { opacity: 1, x: 0, ease: 'power3.out', duration: M * 0.25 },
      M * 0.52,
    )
  }
  const points = role('point')
  if (points.length) {
    tl.fromTo(
      points,
      { opacity: 0, x: edge },
      { opacity: 1, x: 0, ease: 'power3.out', duration: M * 0.3, stagger: M * 0.07 },
      M * 0.46,
    )
  }
  const stats = role('stat')
  if (stats.length) {
    // Stats POP — a back-eased scale so the numerals land with weight.
    tl.fromTo(
      stats,
      { opacity: 0, scale: 0.82, y: 18 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        ease: 'back.out(1.6)',
        duration: M * 0.32,
        stagger: M * 0.08,
      },
      M * 0.5,
    )
  }
  const blocks = role('block')
  if (blocks.length) {
    tl.fromTo(
      blocks,
      { opacity: 0, scale: 0.96, y: 24 },
      { opacity: 1, scale: 1, y: 0, ease: 'power3.out', duration: M * 0.35 },
      M * 0.45,
    )
  }
  const ctas = role('cta')
  if (ctas.length) {
    tl.fromTo(
      ctas,
      { opacity: 0, y: 16, scale: 0.94 },
      { opacity: 1, y: 0, scale: 1, ease: 'back.out(1.4)', duration: M * 0.28 },
      M * 0.66,
    )
  }
  const tagline = role('tagline')
  if (tagline.length) {
    // The sign-off settles in from expanded tracking — a letterpress landing.
    tl.fromTo(
      tagline,
      { opacity: 0, letterSpacing: '0.55em' },
      { opacity: 1, letterSpacing: '0.3em', ease: 'power2.out', duration: M * 0.3 },
      M * 0.72,
    )
  }
  // Anything unroled (the static page's band, future markers) keeps the
  // classic rise so nothing ever mounts invisible.
  const generic = reveals.filter((el) => {
    const value = el.getAttribute('data-orb-reveal') ?? ''
    return value === '' || value === 'band'
  })
  if (generic.length) {
    tl.fromTo(
      generic,
      { opacity: 0, y: 34 },
      { opacity: 1, y: 0, ease: 'power3.out', duration: M * 0.45, stagger: M * 0.08 },
      M * 0.3,
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

  // Numeric stats count up with the scrub (and back down when scrubbed
  // back), riding in with the stat blocks' pop.
  for (const stat of q('[data-orb-stat-value]')) {
    const target = Number(stat.getAttribute('data-stat-target'))
    if (!Number.isFinite(target)) continue
    const proxy = { v: 0 }
    tl.to(
      proxy,
      {
        v: target,
        ease: 'power1.out',
        duration: materializeEnd * 0.45,
        onUpdate: () => {
          stat.textContent = String(Math.round(proxy.v))
        },
      },
      materializeEnd * 0.5,
    )
  }

  // — HOLD (materializeEnd → holdEnd): near-still drift, never a freeze.
  const hold = holdEnd - materializeEnd
  tl.to(media, { scale: 1.045, ease: 'none', duration: hold }, materializeEnd)
  if (frame.length) {
    tl.to(frame, { yPercent: -1.8, ease: 'none', duration: hold }, materializeEnd)
  }

  // — DISSOLVE (holdEnd → 1): the exit CONTINUES the arrival's travel — the
  //   section passes the reader on its scheme's axis and is gone.
  const dissolve = 1 - holdEnd
  tl.to(
    media,
    { opacity: 0, ...scheme.mediaOut, ease: 'power2.in', duration: dissolve },
    holdEnd,
  )
  if (frame.length) {
    tl.to(frame, { ...scheme.frameOut, ease: 'power2.in', duration: dissolve }, holdEnd)
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
