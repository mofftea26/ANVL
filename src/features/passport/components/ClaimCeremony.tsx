import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useGSAP } from '@gsap/react'
import { BadgeCheck } from '@/shared/icons'
import { AnvlCrest } from '@/shared/assets/brand'
import { createDustDrive } from '@/shared/webgl/DustField'
import { isWebglAvailable } from '@/shared/webgl/isWebglAvailable'
import { useCanvasMountGate } from '@/shared/webgl/canvasTeardownGuard'
import { useLockPageScroll } from '@/shared/hooks/useLockPageScroll'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import { gsap } from '@/shared/lib/gsap'
import { createCeremonyMotionState } from '../webgl/ceremonyMotionState'
import {
  CEREMONY_PLATE_AT,
  CEREMONY_REVEAL_AT,
  CEREMONY_REVEAL_DURATION,
  CEREMONY_STRIKES,
} from '../webgl/ceremonyTiming'

const CeremonyEmberLayer = lazy(() => import('./CeremonyEmberLayer'))

/** Guidance per strike (index = strikes already landed). */
const STRIKE_PROMPTS = [
  'Tap the crest to begin the forging',
  'Again — feel it heat',
  'One more strike',
] as const

/**
 * The registration ceremony — INTERACTIVE. The ANVL crest stands in embers,
 * breathing; the owner strikes it (three taps, guided), each strike pulsing
 * the cloud, and the final strike forges: the embers disperse, regroup into
 * the registered piece, and only then does the crisp render resolve with the
 * seal, "Registered to <name>", and a Continue-to-Armory button. Nothing
 * auto-advances.
 *
 * Plays once, after the atomic claim has ALREADY succeeded. Without WebGL the
 * same story runs as DOM pulses + crossfade; reduced motion skips the theater
 * and shows the end state.
 */
export function ClaimCeremony({
  productName,
  imageUrl,
  ownerName,
  onComplete,
}: {
  productName: string
  imageUrl: string | null
  ownerName: string
  /** The quiet secondary exit — stay on this page and open the passport. */
  onComplete: () => void
}) {
  const reduced = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const crestRef = useRef<HTMLDivElement>(null)
  const drive = useMemo(() => createDustDrive({ decayGlint: true, lift: 0.3 }), [])
  const motion = useMemo(() => createCeremonyMotionState(), [])
  const [webglOn, setWebglOn] = useState(false)
  const mountable = useCanvasMountGate(webglOn)
  const [strikes, setStrikes] = useState(0)
  const begun = strikes >= CEREMONY_STRIKES

  useLockPageScroll(true)

  useEffect(() => {
    if (reduced) return
    setWebglOn(isWebglAvailable())
  }, [reduced])

  const strike = () => {
    if (begun) return
    const next = strikes + 1
    setStrikes(next)
    motion.strike += 1
    try {
      navigator.vibrate?.(next >= CEREMONY_STRIKES ? 30 : 12)
    } catch {
      /* no haptics */
    }
    if (next >= CEREMONY_STRIKES) motion.begin = true
    else if (!webglOn && crestRef.current) {
      // DOM fallback pulse (the embers do this on capable devices).
      gsap.fromTo(
        crestRef.current,
        { scale: 1.08 },
        { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.55)' },
      )
    }
  }

  // The forge timeline — built when the final strike lands (`begun`), on the
  // same clock as the particles. fromTo everywhere (never from).
  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const q = gsap.utils.selector(root)

      // Reduced motion: everything is simply there — no interaction, no clock.
      if (reduced) {
        gsap.set([q('[data-cer-piece]'), q('[data-cer-plate]')], { autoAlpha: 1 })
        gsap.set([q('[data-cer-crest]'), q('[data-cer-guide]')], { autoAlpha: 0 })
        return
      }

      if (!begun) return

      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })

      // Guidance leaves immediately; the DOM crest (no-WebGL stand-in)
      // dissolves as the "disperse" beat.
      tl.to(q('[data-cer-guide]'), { autoAlpha: 0, duration: 0.3 }, 0)
      if (!webglOn) {
        tl.to(
          q('[data-cer-crest]'),
          { autoAlpha: 0, scale: 1.15, filter: 'blur(6px)', duration: 0.8, ease: 'power2.in' },
          0,
        )
      }

      // The piece resolves only after the silhouette lands (shared clock).
      tl.fromTo(
        q('[data-cer-piece]'),
        { autoAlpha: 0, scale: 0.985 },
        { autoAlpha: 1, scale: 1, duration: CEREMONY_REVEAL_DURATION, ease: 'power2.inOut' },
        webglOn ? CEREMONY_REVEAL_AT : 1.1,
      )
      tl.fromTo(
        q('[data-cer-plate]'),
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.6 },
        webglOn ? CEREMONY_PLATE_AT : 1.6,
      )

      return () => tl.kill()
    },
    { scope: rootRef, dependencies: [reduced, webglOn, begun] },
  )

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[80] overflow-hidden bg-[var(--color-bg)]"
      role="status"
      aria-label="Passport registered"
    >
      {webglOn && mountable ? (
        <Suspense fallback={null}>
          <CeremonyEmberLayer drive={drive} productImageUrl={imageUrl} motion={motion} />
        </Suspense>
      ) : null}

      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
        {/* DOM crest — visible only without WebGL (embers ARE the crest). */}
        {!webglOn && !reduced ? (
          <div
            data-cer-crest
            ref={crestRef}
            aria-hidden="true"
            className={
              begun
                ? 'pointer-events-none absolute inset-0 flex items-center justify-center'
                : 'pointer-events-none absolute inset-0 flex animate-pulse items-center justify-center'
            }
          >
            <AnvlCrest className="h-28 w-auto text-[var(--color-highlight-bright)]" />
          </div>
        ) : null}

        {/* Strike target + guidance ------------------------------------- */}
        {!begun && !reduced ? (
          <div data-cer-guide className="absolute inset-0 z-20">
            <button
              type="button"
              onClick={strike}
              aria-label={STRIKE_PROMPTS[Math.min(strikes, STRIKE_PROMPTS.length - 1)]}
              className="focus-ring absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full"
            >
              {/* Tap ripple — re-keyed per strike so it re-runs. */}
              {strikes > 0 ? (
                <span
                  key={strikes}
                  aria-hidden="true"
                  className="absolute inset-0 animate-ping rounded-full border border-[color-mix(in_oklab,var(--color-highlight-bright)_55%,transparent)] [animation-iteration-count:1]"
                />
              ) : null}
            </button>
            <div className="absolute inset-x-0 bottom-[16svh] flex flex-col items-center gap-3">
              <p className="anvl-micro text-[var(--color-highlight-bright)]">
                {STRIKE_PROMPTS[Math.min(strikes, STRIKE_PROMPTS.length - 1)]}
              </p>
              <span className="flex items-center gap-1.5" aria-hidden="true">
                {Array.from({ length: CEREMONY_STRIKES }).map((_, i) => (
                  <span
                    key={i}
                    className={
                      i < strikes
                        ? 'h-1.5 w-6 rounded-full bg-[var(--color-highlight-bright)]'
                        : 'h-1.5 w-6 rounded-full bg-[var(--color-surface-elevated)]'
                    }
                  />
                ))}
              </span>
            </div>
          </div>
        ) : null}

        {/* The piece ------------------------------------------------------ */}
        <div data-cer-piece className="opacity-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={productName}
              width={900}
              height={1125}
              decoding="async"
              className="max-h-[46svh] w-auto object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
            />
          ) : (
            <p className="anvl-heading text-3xl text-[var(--color-heading)]">{productName}</p>
          )}
        </div>

        {/* Plate + exits --------------------------------------------------- */}
        <div data-cer-plate className="flex flex-col items-center gap-4 opacity-0">
          <span className="inline-flex items-center gap-3 rounded-lg bg-[linear-gradient(160deg,var(--color-surface-elevated)_0%,var(--color-surface)_60%)] px-6 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_20px_60px_-20px_rgba(0,0,0,0.9)]">
            <AnvlCrest
              aria-label="ANVL crest"
              className="h-8 w-auto text-[var(--color-highlight-bright)]"
            />
            <span className="flex flex-col text-left">
              <span className="anvl-heading text-lg tracking-[0.18em] text-[var(--color-heading)]">
                Authentic ANVL
              </span>
              <span className="anvl-micro text-[9px] text-[var(--color-text-muted)]">
                Official digital passport
              </span>
            </span>
          </span>

          <p className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text)]">
            <BadgeCheck aria-hidden="true" className="h-4 w-4 text-[var(--color-success)]" />
            Registered to{' '}
            <span className="font-semibold text-[var(--color-heading)]">{ownerName}</span>
          </p>

          <Link
            to="/account"
            search={{ tab: 'armory' }}
            className="focus-ring rounded-full bg-gradient-to-b from-[var(--color-highlight-bright)] to-[var(--color-highlight)] px-8 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-on-highlight)] no-underline motion-safe:transition-transform hover:-translate-y-0.5"
          >
            Continue to your Armory
          </Link>
          <button
            type="button"
            onClick={onComplete}
            className="focus-ring anvl-micro rounded px-2 py-1 text-[var(--color-text-muted)] motion-safe:transition-colors hover:text-[var(--color-text)]"
          >
            View this passport
          </button>
        </div>
      </div>
    </div>
  )
}
