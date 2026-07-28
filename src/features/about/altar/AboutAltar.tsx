import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { gsap, useGSAP } from '@/shared/lib/gsap'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import { createDustDrive } from '@/shared/webgl/DustField'
import { useCanvasTeardownMark } from '@/shared/webgl/canvasTeardownGuard'
import { ForgeEmberCanvas } from '@/shared/components/ui/ForgeEmberCanvas'
import type { ForgeRect } from '@/shared/lib/forge/emberForge'
import type { AboutResolvedContent } from '../content/aboutContent.defaults'
import { orbImage } from '../content/resolveAboutContent'
import type { AboutPageAssets } from '../index'
import { readAboutBrandColors } from '../webgl/aboutBrandColors'
import { createAltarState } from './altarState'
import { ALTAR_FORGE, ALTAR_STRIKE } from './altarForgeTiming'
import { projectSeatToViewport, type AltarEmberSwarm } from './altarEmberHandoff'
import { AltarScene } from './AltarScene'
import { AboutOrbModal } from './AboutOrbModal'

/** Shipped defaults so the altar works before any CMS upload. */
const DEFAULT_ANVIL_GLB = '/about/anvil.glb'
const DEFAULT_HAMMER_GLB = '/about/hammer.glb'
const DEFAULT_FORGE_BACKDROP = '/about/forge-backdrop.webp'

/**
 * The ember swarm composites ABOVE the modal (z-[75]) while it forms it —
 * exactly as the shared `<Modal>`'s swarm (z-95) sits over its own panel
 * (z-[90]). Both stay inside the About root's `isolate` stacking context.
 */
const FORGE_CANVAS_Z = 80

/**
 * The Forge Altar — the desktop About experience. One non-scrollable 100svh
 * stage: the grabbable 3D anvil at centre under an aurora, the CMS-defined
 * orbs (each its own color) in slow orbit, the picker chips along the top.
 * Choosing an orb glides it onto the anvil, the hammer winds up and strikes —
 * the orb **disintegrates into embers** in-canvas, and at the hand-off beat
 * those embers cross into the DOM as the app's shared ember swarm (the SAME
 * canvas-2D forge that materializes every modal and every toast), tinted with
 * the struck orb's colour, which converges to FORM the panel. Closing
 * re-materializes the orb in orbit. GSAP owns every transition against the one
 * exported clock (`altarForgeTiming.ts`); the R3F scene reads the mutable
 * {@link AltarState} per frame. During a strike the DOM picker chips fade out —
 * DOM composites ABOVE the canvas, so the only way the hammer reads in front
 * of them is for them not to be there while it swings.
 */
export default function AboutAltar({
  content,
  assets,
}: {
  content: AboutResolvedContent
  assets: AboutPageAssets
}) {
  const root = useRef<HTMLDivElement | null>(null)
  const canvasBox = useRef<HTMLDivElement | null>(null)
  const orbs = content.orbs
  const state = useMemo(() => createAltarState(orbs.length), [orbs.length])
  const driveRef = useRef(createDustDrive({ decayGlint: true }))
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const colors = useMemo(() => readAboutBrandColors(), [])
  const reducedMotion = useReducedMotion()
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [swarm, setSwarm] = useState<AltarEmberSwarm | null>(null)
  const swarmKey = useRef(0)
  /** The panel's rect at natural layout — see {@link handlePanelMeasure}. */
  const panelRect = useRef<ForgeRect | null>(null)
  useCanvasTeardownMark()

  const openOrb = openIndex !== null ? (orbs[openIndex] ?? null) : null

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

  /**
   * The mounted (still-invisible) modal panel reports its rect at NATURAL
   * layout, before its own reveal transform — that is the rectangle the ember
   * swarm must draw, so the plate lands exactly where the panel will stand.
   * The modal's `useGSAP` (a layout effect) reports it in the same commit the
   * swarm mounts in, ahead of `ForgeEmberCanvas`'s passive measure effect.
   */
  const handlePanelMeasure = useCallback((rect: DOMRect) => {
    panelRect.current = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    }
  }, [])

  const swarmRect = useCallback(() => panelRect.current, [])
  const retireSwarm = useCallback(() => setSwarm(null), [])

  /**
   * The hand-off beat: mount the (still invisible) modal and, in the same
   * commit, launch the DOM ember swarm from the orb's seat. Both land in one
   * React batch, so the panel's ref is attached — and its natural rect already
   * reported through {@link handlePanelMeasure} — before the swarm measures.
   */
  const openPanel = useCallback(
    (index: number) => {
      setOpenIndex(index)
      if (reducedMotion) return
      swarmKey.current += 1
      setSwarm({
        key: swarmKey.current,
        tint: orbs[index]?.color?.trim() || undefined,
        origin: projectSeatToViewport(canvasBox.current, state.seatNdc),
      })
    },
    [orbs, reducedMotion, state],
  )

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
        // stays frozen, buried in the impact (the anime frame-hold), then…
        // RING-OUT: a violent rebound that OVERSHOOTS the cocked rest and
        // rings down through four diminishing swings (-0.26 → +0.14 → -0.10 →
        // +0.05 → 0), pendulum-eased, before melting into the idle figure-8
        // (the hammer's sway weight fades back in as |hammerT| shrinks).
        const ringOutAt = impactAt + ALTAR_STRIKE.hitStop
        tl.to(state, { hammerT: -0.26, duration: 0.34, ease: 'power3.out' }, ringOutAt)
        tl.to(state, { hammerT: 0.14, duration: 0.28, ease: 'power2.inOut' }, ringOutAt + 0.34)
        tl.to(state, { hammerT: -0.1, duration: 0.24, ease: 'power2.inOut' }, ringOutAt + 0.62)
        tl.to(state, { hammerT: 0.05, duration: 0.22, ease: 'power2.inOut' }, ringOutAt + 0.86)
        tl.to(state, { hammerT: 0, duration: 0.34, ease: 'sine.out' }, ringOutAt + 1.08)
      }
      // THE HAND-OFF — one beat, three things, deliberately simultaneous so the
      // embers read as ONE swarm crossing from the canvas into the DOM:
      //  1. the modal mounts (invisible) and reports its natural rect;
      //  2. the shared ember swarm launches from the orb's seat, tinted with
      //     the orb's colour, and converges on that rect exactly the way it
      //     forms every other dialog and toast in the app;
      //  3. the in-canvas shroud cross-fades out UNDER it (shorter than the
      //     swarm's pass, so both are alive together — never a hard cut).
      tl.call(() => openPanel(index), [], handoffAt)
      if (!reducedMotion) {
        tl.to(
          state,
          { emberFade: 1, duration: ALTAR_FORGE.emberFadeDuration, ease: 'power2.in' },
          handoffAt,
        )
      }
    },
    [state, reducedMotion, openPanel],
  )

  const release = useCallback(() => {
    setOpenIndex(null)
    // Closing mid-forge (or after it) retires the DOM swarm — nothing left to
    // form once the panel is gone.
    setSwarm(null)
    panelRect.current = null
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

      <div ref={canvasBox} data-altar-canvas className="absolute inset-0">
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

      {/* Orb picker — top of the stage; also the keyboard/AT path. Sits below
          the small AboutHeader pill (rendered by the parent). data-altar-picker:
          the strike timeline fades this row out (autoAlpha, so it also stops
          catching clicks) — it is DOM composited ABOVE the canvas, and the
          raised hammer head swings through exactly this screen band, so
          removing it during the strike is the only way the hammer can read
          in front of the chips. */}
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

      <AboutOrbModal
        orb={openOrb}
        image={openOrb ? orbImage(openOrb, assets) : undefined}
        onClose={release}
        onMeasure={handlePanelMeasure}
      />

      {/* The app's shared ember forge — the same swarm that materializes every
          modal and every toast, here tinted with the struck orb's colour and
          launched from its seat on the anvil. Rendered AFTER the modal so the
          panel's ref is attached (and its natural rect reported) before this
          measures. Self-gates under reduced motion; we also skip mounting it
          (defense in depth, mirroring the shared Modal). */}
      {swarm && !reducedMotion ? (
        <ForgeEmberCanvas
          key={swarm.key}
          getRect={swarmRect}
          origin={swarm.origin}
          tint={swarm.tint}
          zIndex={FORGE_CANVAS_Z}
          onComplete={retireSwarm}
        />
      ) : null}
    </div>
  )
}
