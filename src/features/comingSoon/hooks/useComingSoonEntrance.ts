import { useRef } from 'react'
import { gsap, SplitText, useGSAP } from '@/shared/lib/gsap'

/** Longest we hold the pre-hide waiting on webfonts — the page must never
 *  stay blank if `document.fonts.ready` stalls. */
const FONT_WAIT_CAP_MS = 1500

/** Resolves when webfonts are ready (or the cap elapses / API is missing). */
function whenFontsReady(): Promise<unknown> {
  if (typeof document === 'undefined' || !('fonts' in document)) {
    return Promise.resolve()
  }
  return Promise.race([
    document.fonts.ready.catch(() => undefined),
    new Promise((resolve) => {
      setTimeout(resolve, FONT_WAIT_CAP_MS)
    }),
  ])
}

/**
 * Cinematic entrance for the Coming Soon page — timed to land while the
 * WebGL anvil is still forging itself out of embers, so type and particles
 * arrive as one choreography.
 *
 * - `≥768px + no-reduced-motion`: crest descends, hairline rules draw open,
 *   SplitText headline rises char-by-char, then countdown / email / socials /
 *   tagline stagger in.
 * - Mobile / reduced motion: everything snaps visible with a plain fade.
 *
 * Everything waits on `document.fonts.ready` (capped) with the CSS pre-hide
 * (`.cs-anim-pending`) still on: the headline is `leading-[0.96]`, tuned for
 * Anton — in the fallback font those lines overlap ("letters cramped on top
 * of each other"), and SplitText would measure the wrong glyph boxes. Nothing
 * becomes visible until the real font is in and the timeline owns visibility.
 *
 * Pointer parallax intentionally lives in the WebGL camera rig, not the DOM.
 * All state is created inside `gsap.matchMedia` and reverted on unmount.
 */
export function useComingSoonEntrance() {
  const scopeRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const scope = scopeRef.current
      if (!scope) return

      const mm = gsap.matchMedia()

      mm.add(
        {
          cinematic: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
          static: '(max-width: 767.98px), (prefers-reduced-motion: reduce)',
        },
        (ctx) => {
          const { cinematic } = ctx.conditions as {
            cinematic: boolean
            static: boolean
          }

          let alive = true

          void whenFontsReady().then(() => {
            if (!alive) return
            // Register async-created tweens/SplitText on the matchMedia
            // context so `mm.revert()` still cleans them up.
            ctx.add(() => {
              const reveals = gsap.utils.toArray<HTMLElement>('[data-cs-reveal]', scope)
              const rules = gsap.utils.toArray<HTMLElement>('[data-cs-rule]', scope)
              const headline = scope.querySelector<HTMLElement>('[data-cs-headline]')

              if (!cinematic) {
                gsap.set([...reveals, ...rules], { clearProps: 'all' })
                // Nothing animates per-element here, so reveal the content (the
                // CSS pre-hide is dropped) and fade the whole scope in as one.
                scope.classList.remove('cs-anim-pending')
                gsap.fromTo(
                  scope,
                  { autoAlpha: 0 },
                  { autoAlpha: 1, duration: 0.7, ease: 'power1.out' },
                )
                return
              }

              const split = headline
                ? new SplitText(headline, { type: 'chars', charsClass: 'cs-char' })
                : null

              const tl = gsap.timeline({
                defaults: { ease: 'power3.out' },
                onComplete: () => split?.revert(),
              })

              tl.fromTo(
                scope,
                { autoAlpha: 0 },
                { autoAlpha: 1, duration: 0.6, ease: 'power1.out' },
              )
                .from('[data-cs-reveal="crest"]', { y: -30, autoAlpha: 0, duration: 1.0 }, 0.2)
                .from(rules, { scaleX: 0, duration: 0.9, ease: 'power2.inOut' }, 0.45)
                .from(
                  '[data-cs-reveal="eyebrow"]',
                  { letterSpacing: '1.2em', autoAlpha: 0, duration: 1.1, ease: 'power2.out' },
                  0.5,
                )

              if (split) {
                tl.from(
                  split.chars,
                  {
                    yPercent: 115,
                    rotateX: -40,
                    autoAlpha: 0,
                    duration: 0.9,
                    stagger: 0.02,
                    ease: 'power4.out',
                  },
                  0.75,
                )
              }

              tl.from(
                reveals.filter(
                  (el) => !['crest', 'eyebrow'].includes(el.dataset.csReveal ?? ''),
                ),
                { y: 26, autoAlpha: 0, duration: 0.85, stagger: 0.1 },
                1.35,
              )

              // Every animated element now holds a GSAP `from` state inline
              // (SplitText chars + reveals + rules) and the real fonts are in —
              // drop the CSS pre-hide and let the timeline own visibility.
              // Content appears *as* it animates, never before.
              scope.classList.remove('cs-anim-pending')
            })
          })

          return () => {
            alive = false
          }
        },
      )

      return () => {
        mm.revert()
      }
    },
    { scope: scopeRef },
  )

  return scopeRef
}
