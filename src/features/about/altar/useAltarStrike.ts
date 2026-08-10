import { useCallback, useEffect, useRef, type RefObject } from 'react'
import { gsap } from '@/shared/lib/gsap'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import type { AltarState } from './altarState'
import { ALTAR_FORGE, ALTAR_STRIKE } from './altarForgeTiming'

/**
 * The strike ceremony, extracted from the old standalone altar component so
 * the DOM shell (the film's altar section) and the in-canvas stage can share
 * it through the mutable {@link AltarState} alone.
 *
 * `strike(index)`: the chosen orb glides onto the anvil, the ring dims, the
 * hammer winds up and drops, the impact fires the flash/shake/DOM impact
 * frames, the stone disintegrates into its hovering ember shroud — and at
 * the hand-off beat `onOrbStruck` fires (the film scrolls back up to that
 * orb's chapter) while the shroud dissolves under the move. The stage then
 * releases itself. Every beat schedules against `altarForgeTiming`.
 *
 * DOM overlays (`[data-strike-flash]`, `[data-strike-lines]`,
 * `[data-altar-picker]`) are queried inside `root` — the altar section shell.
 */
export function useAltarStrike({
  state,
  root,
  onOrbStruck,
}: {
  state: AltarState
  root: RefObject<HTMLElement | null>
  onOrbStruck?: (index: number) => void
}) {
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    return () => {
      timelineRef.current?.kill()
    }
  }, [])

  /** Resets the stage: the shroud retires, the orb re-materializes in orbit,
   *  the ring wakes back up, the picker chips return. */
  const release = useCallback(() => {
    const index = state.activeIndex
    if (index === -1) return
    timelineRef.current?.kill()
    const tl = gsap.timeline({
      onComplete: () => {
        state.activeIndex = -1
      },
    })
    timelineRef.current = tl
    // The orb is still disintegrated — snap it home invisibly, then let it
    // re-materialize in its orbit slot as the ring wakes back up. scatterT: 0
    // retires the ember pool instantly (its life gate), while explodeT eases
    // back so the stone re-forms.
    tl.set(state.focusT, { [index]: 0 }, 0)
    tl.set(state, { scatterT: 0, hammerT: 0, emberFade: 0 }, 0)
    tl.to(state, { ringDim: 0, orbitSpeed: 1, duration: 0.9, ease: 'power2.inOut' }, 0)
    tl.to(state, { explodeT: 0, duration: 0.6, ease: 'power2.out' }, 0.25)
    // The picker chips return as the hammer fades off the stage (cross-fade —
    // by the time they're fully back the hammer is gone).
    if (root.current) {
      const q = gsap.utils.selector(root.current)
      tl.to(q('[data-altar-picker]'), { autoAlpha: 1, duration: 0.6, ease: 'power2.out' }, 0.55)
    }
  }, [state, root])

  const strike = useCallback(
    (index: number) => {
      if (state.activeIndex !== -1) return
      state.activeIndex = index
      state.explodeT = 0
      state.scatterT = 0
      state.emberFade = 0

      timelineRef.current?.kill()
      const tl = gsap.timeline()
      timelineRef.current = tl

      // Reduced motion (the film only mounts without the preference, but it
      // can flip mid-session): near-static — quick gentle arc, no violence.
      const impactAt = reducedMotion
        ? ALTAR_STRIKE.reducedMotionImpactAt
        : ALTAR_STRIKE.impactAt
      /** The beat the page answers the strike (scroll-to-chapter begins). */
      const handoffAt = impactAt + ALTAR_FORGE.handoffAfterImpact

      // The DOM picker chips sit ABOVE the canvas (they're DOM — nothing
      // in-canvas can ever draw over them), and the raised hammer head swings
      // right through their screen band. Fade them out for the strike; the
      // release timeline brings them back.
      if (root.current) {
        const q = gsap.utils.selector(root.current)
        tl.to(q('[data-altar-picker]'), { autoAlpha: 0, duration: 0.35, ease: 'power2.out' }, 0)
      }

      // The chosen orb glides to the anvil while the ring dims and stills.
      tl.to(
        state.focusT,
        { [index]: 1, duration: reducedMotion ? 0.7 : 1.15, ease: 'power2.inOut' },
        0,
      )
      tl.to(state, { ringDim: 1, duration: 0.8, ease: 'power2.out' }, 0)
      tl.to(state, { orbitSpeed: 0.1, duration: 1.0, ease: 'power2.out' }, 0)
      if (reducedMotion) {
        // One calm arc onto the seat — no overshoot, no hit-stop, no ring-out.
        tl.to(state, { hammerT: 1, duration: 0.4, ease: 'power2.inOut' }, impactAt - 0.4)
      } else {
        // Windup (anticipation) — the hammer draws well past its cocked angle,
        // DECELERATING into the top of the backswing (power3.out), then HOLDS
        // there for the windup pause — the held breath before the blow…
        tl.to(
          state,
          { hammerT: -0.3, duration: ALTAR_STRIKE.windupDuration, ease: 'power3.out' },
          ALTAR_STRIKE.windupAt,
        )
        // …then the drop: expo.in, so the head hangs, then whips — nearly the
        // entire arc lands in the final frames before impact.
        tl.to(
          state,
          { hammerT: 1, duration: ALTAR_STRIKE.dropDuration, ease: 'expo.in' },
          ALTAR_STRIKE.dropAt,
        )
      }
      // Impact: flash, shake (the depth rig reads it), impact frames.
      tl.call(
        () => {
          state.flash = 1
          gsap.to(state, { flash: 0, duration: 0.5, ease: 'power2.out' })
          if (!reducedMotion) {
            state.shake = 1
            gsap.to(state, { shake: 0, duration: 0.9, ease: 'power3.out' })
          }
        },
        [],
        impactAt,
      )
      // Impact frames (anime staging): a white-hot screen flash and a ring of
      // radial speed-lines snap in on the hit and burn off fast.
      if (root.current && !reducedMotion) {
        const q = gsap.utils.selector(root.current)
        tl.fromTo(
          q('[data-strike-flash]'),
          { opacity: 0 },
          { opacity: 0.9, duration: 0.06, ease: 'power4.out' },
          impactAt,
        )
        tl.to(q('[data-strike-flash]'), { opacity: 0, duration: 0.3, ease: 'power2.out' }, impactAt + 0.06)
        tl.fromTo(
          q('[data-strike-lines]'),
          { opacity: 0, scale: 0.55 },
          { opacity: 0.8, scale: 1, duration: 0.09, ease: 'power4.out' },
          impactAt,
        )
        tl.to(
          q('[data-strike-lines]'),
          { opacity: 0, scale: 1.45, duration: 0.32, ease: 'power2.out' },
          impactAt + 0.09,
        )
      }
      // DISINTEGRATION (no explosion): the stone dissolves fast — it BECOMES
      // the forge embers 1:1 — while scatterT releases those embers, per-seed
      // staggered, into a hovering shroud off the stone's surface.
      tl.to(
        state,
        { explodeT: 1, duration: ALTAR_FORGE.explodeDuration, ease: 'power3.out' },
        impactAt,
      )
      tl.to(
        state,
        { scatterT: 1, duration: ALTAR_FORGE.scatterDuration, ease: 'power2.out' },
        impactAt,
      )
      if (reducedMotion) {
        tl.to(state, { hammerT: 0, duration: 0.5, ease: 'power2.out' }, impactAt + 0.2)
      } else {
        // HIT-STOP: hammerT is untouched for `ALTAR_STRIKE.hitStop` — the hammer
        // stays frozen, buried in the impact (the anime frame-hold) — and then
        // the ring-out chain plays out of the clock's own table.
        let swingAt = impactAt + ALTAR_STRIKE.hitStop
        for (const swing of ALTAR_STRIKE.ringOut) {
          tl.to(state, { hammerT: swing.to, duration: swing.duration, ease: swing.ease }, swingAt)
          swingAt += swing.duration
        }
      }
      // THE HAND-OFF — the page answers the strike: `onOrbStruck` fires (the
      // film scrolls back up to the struck orb's chapter) while the in-canvas
      // shroud dissolves UNDER the move — near-linear (`power1.in`) so the
      // embers decay as the journey starts, never a hard cut before it. Once
      // the shroud is gone the stage releases itself: the strike's answer is
      // a scroll, not a dialog, so nothing external ever closes it.
      tl.call(
        () => {
          onOrbStruck?.(index)
        },
        [],
        handoffAt,
      )
      if (!reducedMotion) {
        tl.to(
          state,
          { emberFade: 1, duration: ALTAR_FORGE.emberFadeDuration, ease: 'power1.in' },
          handoffAt,
        )
      }
      tl.call(release, [], handoffAt + ALTAR_FORGE.emberFadeDuration + 0.15)
    },
    [state, root, reducedMotion, onOrbStruck, release],
  )

  return { strike, release }
}
