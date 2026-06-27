import { gsap } from '@/shared/lib/gsap'
import type { OathMotionState } from './oathMotionState'
import { type Selector } from './oathMotionHelpers'
import { splitUnits } from './splitTextReveal'

/**
 * Scene 01 — Hero (desktop/tablet).
 *
 * Entry: a Ken-Burns push on the film, the headline forges in word-by-word
 * through masks with a blur-rise, the ember underline ignites, supporting copy
 * rises. Pin: scroll scrubs the hero film frame-by-frame; the right-anchored
 * base panel (`[data-hero-media]`) drifts from the right toward centre while
 * `heroProgress` drifts the 3D monolith to centre (same small size — it does not
 * enlarge until the finale; read in WebGL `useFrame`) — together a single
 * right→centre composite. The title card parallaxes up and the film fades out at
 * the very end so the page hands over to the void + monolith for the creed. The
 * headline entrance is gated to play once after the entry overlay releases
 * (caller passes the already-released host).
 */
export function buildOathHero(
  host: HTMLElement,
  q: Selector,
  intensity: number,
  motion: OathMotionState,
): () => void {
  const hero = host.querySelector('[data-scene="hero"]')
  if (!hero) return () => {}

  const video = host.querySelector(
    '[data-hero-video-desktop]',
  ) as HTMLVideoElement | null
  const headline = hero.querySelector('[data-hero-headline]') as HTMLElement | null
  const disposers: Array<() => void> = []

  // — Entry choreography (plays once; the entry overlay has already released).
  gsap.set(q('[data-hero-underline]'), { scaleX: 0 })
  gsap.set(q('[data-hero-fade]'), { opacity: 0, y: 24 })

  const intro = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.1 })

  if (headline) {
    const { units, revert } = splitUnits(headline, 'words')
    disposers.push(revert)
    gsap.set(units, { yPercent: 120, filter: 'blur(12px)' })
    intro.to(
      units,
      {
        yPercent: 0,
        filter: 'blur(0px)',
        duration: 1.1,
        stagger: { each: 0.09, from: 'start' },
      },
      0,
    )
  }
  // Ken Burns intro on the film — a slow settle from 1.12 → 1, distinct from
  // the scroll scrub (which only seeks the video; never scales it).
  const kenBurns = q('[data-hero-kenburns]')
  if (kenBurns.length) {
    gsap.fromTo(
      kenBurns,
      { scale: 1.12 },
      { scale: 1, duration: 2.4, ease: 'power2.out' },
    )
  }
  intro.to(q('[data-hero-underline]'), { scaleX: 1, duration: 0.9, ease: 'power3.inOut' }, 0.55)
  intro.to(q('[data-hero-fade]'), { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, 0.5)
  disposers.push(() => intro.kill())

  // Scroll cue idle pulse — cheap transform loop, killed on cleanup.
  const cue = hero.querySelector('[data-hero-scroll-cue]')
  if (cue) {
    const pulse = gsap.to(cue, {
      y: 5,
      repeat: -1,
      yoyo: true,
      duration: 0.9,
      ease: 'sine.inOut',
    })
    disposers.push(() => pulse.kill())
  }

  if (video) {
    // Prime for frame-accurate seeking (Safari needs a play() before scrubbing).
    video.muted = true
    const primed = video.play()
    if (primed && typeof primed.then === 'function') {
      primed.then(() => video.pause()).catch(() => {})
    } else {
      video.pause()
    }
  }

  // — Pinned scrub: drives the video frame, the monolith hero pose, the copy
  //   parallax, and the film fade-out hand-off.
  const proxy = { p: 0 }
  const tl = gsap.timeline({
    scrollTrigger: {
      id: 'oath-hero-pin',
      trigger: hero,
      start: 'top top',
      end: `+=${Math.round(180 * intensity)}%`,
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        motion.heroProgress = self.progress
      },
    },
  })

  if (video) {
    tl.to(
      proxy,
      {
        p: 1,
        ease: 'none',
        duration: 1,
        onUpdate: () => {
          const d = video.duration
          if (d && Number.isFinite(d)) {
            const t = proxy.p * d
            if (Math.abs(video.currentTime - t) > 0.033) {
              try {
                video.currentTime = t
              } catch {
                /* a seek is already in flight — skip this frame */
              }
            }
          }
        },
      },
      0,
    )
  }
  // Base film panel drifts from its right anchor toward centre across the pin
  // (transform only), tracking the monolith's right→centre move. Capped so it
  // lands near viewport centre on desktop without burying the left-aligned copy
  // (copy renders above on z-10).
  tl.to(q('[data-hero-media]'), { xPercent: -28 * intensity, ease: 'none', duration: 1 }, 0)
  tl.to(q('[data-hero-content]'), { yPercent: -14 * intensity, ease: 'none', duration: 1 }, 0)
  // Dim supporting copy with the scrub — never the CTA row (stays legible).
  tl.to(
    q('[data-hero-fade]:not([data-hero-cta-row])'),
    { opacity: 0.4, ease: 'none', duration: 0.5 },
    0.5,
  )
  // Film + spotlight reveal fade out as the hero ends — the void + monolith
  // take over for the creed.
  tl.to(q('[data-hero-film]'), { opacity: 0, ease: 'none', duration: 0.3 }, 0.7)

  return () => {
    for (const dispose of disposers) dispose()
  }
}
