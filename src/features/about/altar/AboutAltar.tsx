import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { gsap, useGSAP } from '@/shared/lib/gsap'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import { createDustDrive } from '@/shared/webgl/DustField'
import { useCanvasTeardownMark } from '@/shared/webgl/canvasTeardownGuard'
import type { AboutResolvedContent } from '../content/aboutContent.defaults'
import type { AboutPageAssets } from '../index'
import { readAboutBrandColors } from '../webgl/aboutBrandColors'
import { createAltarState } from './altarState'
import { ALTAR_FORGE, ALTAR_STRIKE } from './altarForgeTiming'
import { AltarScene } from './AltarScene'

/** Shipped defaults so the altar works before any CMS upload. */
const DEFAULT_ANVIL_GLB = '/about/anvil.glb'
const DEFAULT_HAMMER_GLB = '/about/hammer.glb'
const DEFAULT_FORGE_BACKDROP = '/about/forge-backdrop.webp'

/**
 * The Forge Altar — the About page's interactive stage. The grabbable 3D
 * anvil at centre under an aurora, the CMS-defined orbs (each its own color)
 * in slow orbit, the picker chips along the top. Choosing an orb glides it
 * onto the anvil, the hammer winds up and strikes — the orb **disintegrates
 * into embers** in-canvas, and at the hand-off beat the page answers the
 * strike through {@link onOrbStruck} (the scroll experience scrolls back up
 * to that orb's chapter). The stage then releases: the shroud dissolves, the
 * orb re-materializes in orbit, the ring wakes. GSAP owns every transition
 * against the one exported clock (`altarForgeTiming.ts`); the R3F scene reads
 * the mutable {@link AltarState} per frame. During a strike the DOM picker
 * chips fade out — DOM composites ABOVE the canvas, so the only way the
 * hammer reads in front of them is for them not to be there while it swings.
 */
export default function AboutAltar({
  content,
  assets,
  onOrbStruck,
}: {
  content: AboutResolvedContent
  assets: AboutPageAssets
  /** Fired at the strike's hand-off beat with the struck orb's index. */
  onOrbStruck?: (index: number) => void
}) {
  const root = useRef<HTMLDivElement | null>(null)
  const orbs = content.orbs
  const state = useMemo(() => createAltarState(orbs.length), [orbs.length])
  const driveRef = useRef(createDustDrive({ decayGlint: true }))
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const colors = useMemo(() => readAboutBrandColors(), [])
  const reducedMotion = useReducedMotion()
  useCanvasTeardownMark()

  // Pointer → camera parallax + dust parting (one passive listener).
  useEffect(() => {
    const drive = driveRef.current
    let lastX = 0
    let lastY = 0
    let lastT = 0
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1
      const ny = (e.clientY / window.innerHeight) * 2 - 1
      const now = e.timeStamp
      if (lastT > 0) {
        const dt = Math.max(8, now - lastT) / 1000
        const vx = (nx - lastX) / dt
        const vy = (ny - lastY) / dt
        state.pointerVX = vx
        state.pointerVY = vy
        drive.pointerVX = vx
        drive.pointerVY = vy
      }
      state.pointerX = nx
      state.pointerY = ny
      drive.pointerX = nx
      drive.pointerY = ny
      lastX = nx
      lastY = ny
      lastT = now
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [state])

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
  }, [state])

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

      // Reduced motion (the altar only mounts without the preference, but it
      // can flip mid-session): near-static — quick gentle arc, no violence.
      const impactAt = reducedMotion
        ? ALTAR_STRIKE.reducedMotionImpactAt
        : ALTAR_STRIKE.impactAt
      /** Canvas embers → DOM swarm. Also the modal's mount (and t=0 of its clock). */
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
      // Impact: flash, ember glint — and (full-motion only) the camera shake.
      tl.call(
        () => {
          state.flash = 1
          driveRef.current.glint = 1
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
      // staggered, into a hovering shroud off the stone's surface. They hang
      // there (ALTAR_FORGE.shroudHold) so the release reads, and then hand the
      // matter over to the DOM swarm at `handoffAt`.
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
      // scroll experience pulls the page back up to the struck orb's chapter)
      // while the in-canvas shroud dissolves UNDER the move — near-linear
      // (`power1.in`) so the embers decay as the journey starts, never a hard
      // cut before it. Once the shroud is gone the stage releases itself: the
      // strike's answer is a scroll, not a dialog, so nothing external ever
      // closes it.
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
    [state, reducedMotion, onOrbStruck, release],
  )

  // Stage entrance: the canvas breathes in from black, the chrome rises.
  useGSAP(
    () => {
      const host = root.current
      if (!host) return
      const q = gsap.utils.selector(host)
      gsap.fromTo(q('[data-altar-canvas]'), { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'power2.out' })
      gsap.fromTo(
        q('[data-altar-reveal]'),
        { opacity: 0, y: -14 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08, delay: 0.35 },
      )
    },
    { scope: root },
  )

  const anvilUrl = assets.anvilModel?.trim() || DEFAULT_ANVIL_GLB
  const hammerUrl = assets.hammerModel?.trim() || DEFAULT_HAMMER_GLB
  const forgeBackdropUrl = assets.forgeBackdrop?.trim() || DEFAULT_FORGE_BACKDROP

  return (
    <div ref={root} className="relative h-[100svh] w-full overflow-hidden">
      <h1 className="sr-only">{content.hero.headline}</h1>

      {/* The forge — a photographic backdrop with an empty centre where the
          anvil sits. Painted behind the transparent WebGL canvas so the
          aurora (additive, no opaque fill) shimmers over it, not instead of
          it. A dark wash keeps the edges from competing with the chrome. */}
      <div aria-hidden="true" className="absolute inset-0">
        <img
          src={forgeBackdropUrl}
          alt=""
          className="h-full w-full object-cover"
          style={{ objectPosition: '50% 65%' }}
          loading="eager"
          decoding="async"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 58%, transparent 30%, color-mix(in srgb, var(--color-bg) 55%, transparent) 100%), linear-gradient(to bottom, color-mix(in srgb, var(--color-bg) 55%, transparent) 0%, transparent 30%, transparent 70%, var(--color-bg) 100%)',
          }}
        />
      </div>

      {/* Impact frames — DOM overlays the strike timeline snaps on and burns
          off (a white-hot flash + anime radial speed-lines centred on the
          anvil seat). Above the canvas, below the modal. */}
      <div
        aria-hidden="true"
        data-strike-flash
        className="pointer-events-none absolute inset-0 z-20 opacity-0"
        style={{
          background:
            'radial-gradient(circle at 50% 62%, color-mix(in srgb, var(--color-highlight-bright) 80%, white) 0%, color-mix(in srgb, var(--color-highlight) 38%, transparent) 20%, transparent 55%)',
        }}
      />
      <div
        aria-hidden="true"
        data-strike-lines
        className="pointer-events-none absolute inset-0 z-20 opacity-0"
        style={{
          background:
            'repeating-conic-gradient(from 0deg at 50% 62%, transparent 0deg 7deg, color-mix(in srgb, var(--color-highlight-bright) 55%, transparent) 7deg 8.4deg)',
          maskImage:
            'radial-gradient(circle at 50% 62%, transparent 13%, black 34%, transparent 60%)',
          WebkitMaskImage:
            'radial-gradient(circle at 50% 62%, transparent 13%, black 34%, transparent 60%)',
        }}
      />

      <div data-altar-canvas className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0.6, 6.4], fov: 38 }}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
        >
          <AltarScene
            state={state}
            drive={driveRef.current}
            colors={colors}
            orbs={orbs}
            anvilUrl={anvilUrl}
            hammerUrl={hammerUrl}
            onSelect={strike}
          />
        </Canvas>
      </div>

      {/* Orb picker — top of the stage; also the keyboard/AT path.
          data-altar-picker: the strike timeline fades this row out (autoAlpha,
          so it also stops catching clicks) — it is DOM composited ABOVE the
          canvas, and the raised hammer head swings through exactly this screen
          band, so removing it during the strike is the only way the hammer can
          read in front of the chips. */}
      <div
        data-altar-picker
        className="absolute inset-x-0 top-[calc(var(--anvl-header-h)+4.5rem)] z-10 flex flex-col items-center gap-3 px-6"
      >
        <p data-altar-reveal className="anvl-display text-[10px] tracking-[0.32em] text-[var(--color-heading)]/70">
          Choose an orb — the hammer does the rest
        </p>
        <div data-altar-reveal className="flex flex-wrap items-center justify-center gap-2">
          {orbs.map((orb, i) => (
            <button
              key={orb.id}
              type="button"
              onClick={() => strike(i)}
              className="focus-ring anvl-display inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-bg)_65%,transparent)] px-4 py-2.5 text-[10px] tracking-[0.24em] text-[var(--color-text-muted)] backdrop-blur-sm transition-colors hover:border-[var(--color-highlight)] hover:text-[var(--color-heading)]"
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: orb.color, boxShadow: `0 0 6px ${orb.color}` }}
              />
              {orb.label}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
