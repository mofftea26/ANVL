import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { gsap, useGSAP } from '@/shared/lib/gsap'
import { createDustDrive } from '@/shared/webgl/DustField'
import type { AboutResolvedContent } from '../content/aboutContent.defaults'
import { orbImage } from '../content/resolveAboutContent'
import type { AboutPageAssets } from '../index'
import { readAboutBrandColors } from '../webgl/aboutBrandColors'
import { createAltarState } from './altarState'
import { AltarScene } from './AltarScene'
import { AboutOrbModal } from './AboutOrbModal'

/** Shipped defaults so the altar works before any CMS upload. */
const DEFAULT_ANVIL_GLB = '/about/anvil.glb'
const DEFAULT_HAMMER_GLB = '/about/hammer.glb'
const DEFAULT_FORGE_BACKDROP = '/about/forge-backdrop.webp'

/** Strike beats (timeline seconds): glide → windup → drop → impact. */
const WINDUP_AT = 0.9
const DROP_AT = 1.35
const IMPACT_AT = 1.65

/**
 * The Forge Altar — the desktop About experience. One non-scrollable 100svh
 * stage: the grabbable 3D anvil at centre under an aurora, the CMS-defined
 * orbs (each its own color) in slow orbit, the picker chips along the top.
 * Choosing an orb glides it onto the anvil, the hammer winds up and strikes —
 * the orb **explodes** into shards and a shockwave, and the modal forges open
 * out of the burst. Closing re-materializes the orb in orbit. GSAP owns every
 * transition; the R3F scene reads the mutable {@link AltarState} per frame.
 */
export default function AboutAltar({
  content,
  assets,
}: {
  content: AboutResolvedContent
  assets: AboutPageAssets
}) {
  const root = useRef<HTMLDivElement | null>(null)
  const orbs = content.orbs
  const state = useMemo(() => createAltarState(orbs.length), [orbs.length])
  const driveRef = useRef(createDustDrive({ decayGlint: true }))
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const colors = useMemo(() => readAboutBrandColors(), [])
  const [openIndex, setOpenIndex] = useState<number | null>(null)

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

  const strike = useCallback(
    (index: number) => {
      if (state.activeIndex !== -1) return
      state.activeIndex = index
      state.explodeT = 0
      state.burstT = 0

      timelineRef.current?.kill()
      const tl = gsap.timeline()
      timelineRef.current = tl

      // The chosen orb glides to the anvil while the ring dims and stills.
      tl.to(state.focusT, { [index]: 1, duration: 1.15, ease: 'power2.inOut' }, 0)
      tl.to(state, { ringDim: 1, duration: 0.8, ease: 'power2.out' }, 0)
      tl.to(state, { orbitSpeed: 0.1, duration: 1.0, ease: 'power2.out' }, 0)
      // Windup (anticipation) — the hammer draws past its cocked angle…
      tl.to(state, { hammerT: -0.16, duration: 0.4, ease: 'power2.out' }, WINDUP_AT)
      // …then drops hard.
      tl.to(state, { hammerT: 1, duration: IMPACT_AT - DROP_AT, ease: 'power3.in' }, DROP_AT)
      // Impact: flash, shake, ember glint — and the orb explodes.
      tl.call(
        () => {
          state.flash = 1
          state.shake = 1
          driveRef.current.glint = 1
          gsap.to(state, { flash: 0, duration: 0.5, ease: 'power2.out' })
          gsap.to(state, { shake: 0, duration: 0.9, ease: 'power3.out' })
        },
        [],
        IMPACT_AT,
      )
      tl.to(state, { explodeT: 1, duration: 0.4, ease: 'power3.out' }, IMPACT_AT)
      tl.to(state, { burstT: 1, duration: 0.9, ease: 'power2.out' }, IMPACT_AT)
      // Recoil bounce, then the hammer lifts away.
      tl.to(state, { hammerT: 0.72, duration: 0.26, ease: 'power2.out' }, IMPACT_AT + 0.04)
      tl.to(state, { hammerT: 0, duration: 0.55, ease: 'power2.inOut' }, IMPACT_AT + 0.36)
      // The modal forges open out of the burst.
      tl.call(() => setOpenIndex(index), [], IMPACT_AT + 0.28)
    },
    [state],
  )

  const release = useCallback(() => {
    setOpenIndex(null)
    const index = state.activeIndex
    if (index === -1) return
    timelineRef.current?.kill()
    const tl = gsap.timeline({
      onComplete: () => {
        state.activeIndex = -1
      },
    })
    timelineRef.current = tl
    // The orb is still burst apart — snap it home invisibly, then let it
    // re-materialize in its orbit slot as the ring wakes back up.
    tl.set(state.focusT, { [index]: 0 }, 0)
    tl.set(state, { burstT: 0, hammerT: 0 }, 0)
    tl.to(state, { ringDim: 0, orbitSpeed: 1, duration: 0.9, ease: 'power2.inOut' }, 0)
    tl.to(state, { explodeT: 0, duration: 0.6, ease: 'power2.out' }, 0.25)
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

      {/* Orb picker — top of the stage; also the keyboard/AT path. Sits below
          the small AboutHeader pill (rendered by the parent). */}
      <div className="absolute inset-x-0 top-[calc(var(--anvl-header-h)+4.5rem)] z-10 flex flex-col items-center gap-3 px-6">
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
      />
    </div>
  )
}
