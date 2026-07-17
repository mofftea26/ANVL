import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useGSAP } from '@gsap/react'
import { BadgeCheck } from 'lucide-react'
import { AnvlCrest } from '@/shared/assets/brand'
import { createDustDrive } from '@/shared/webgl/DustField'
import { isWebglAvailable } from '@/shared/webgl/isWebglAvailable'
import { useCanvasMountGate } from '@/shared/webgl/canvasTeardownGuard'
import { useLockPageScroll } from '@/shared/hooks/useLockPageScroll'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import { gsap } from '@/shared/lib/gsap'
import {
  CEREMONY_CREST_HOLD,
  CEREMONY_PLATE_AT,
  CEREMONY_REVEAL_AT,
  CEREMONY_REVEAL_DURATION,
} from '../webgl/ceremonyTiming'

const CeremonyEmberLayer = lazy(() => import('./CeremonyEmberLayer'))

/**
 * The registration ceremony, played once after the atomic claim has ALREADY
 * succeeded (it never gates registration).
 *
 * Beats (shared clock in `ceremonyTiming.ts`): the ANVL crest stands in embers
 * for half a second → the embers disperse → they reassemble into the
 * registered piece → the crisp image resolves with the plate ("Registered to
 * <name>", the seal) and a "Continue to your Armory" button. Nothing
 * auto-advances — the owner leaves via the button (or the quiet passport link).
 *
 * On devices without WebGL (and under reduced motion) the same story is told
 * as a simple DOM crossfade: crest → piece → plate.
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
  const drive = useMemo(() => createDustDrive({ decayGlint: true, lift: 0.3 }), [])
  const [webglOn, setWebglOn] = useState(false)
  const mountable = useCanvasMountGate(webglOn)

  useLockPageScroll(true)

  useEffect(() => {
    if (reduced) return
    setWebglOn(isWebglAvailable())
  }, [reduced])

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const q = gsap.utils.selector(root)

      // Reduced motion: everything is simply there — no timeline at all.
      if (reduced) {
        gsap.set([q('[data-cer-piece]'), q('[data-cer-plate]')], { autoAlpha: 1 })
        gsap.set(q('[data-cer-crest]'), { autoAlpha: 0 })
        return
      }

      // fromTo everywhere (never from): a killed `from` would leave elements
      // stuck hidden if this ever double-mounts.
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })

      // The DOM crest is the no-WebGL stand-in; with particles running it
      // stays hidden (the embers ARE the crest).
      if (!webglOn) {
        tl.fromTo(
          q('[data-cer-crest]'),
          { autoAlpha: 0, scale: 0.92 },
          { autoAlpha: 1, scale: 1, duration: 0.25 },
          0,
        )
        tl.to(
          q('[data-cer-crest]'),
          { autoAlpha: 0, scale: 1.06, duration: 0.4, ease: 'power2.in' },
          CEREMONY_CREST_HOLD,
        )
      }

      // The piece resolves as the embers dissolve into it.
      tl.fromTo(
        q('[data-cer-piece]'),
        { autoAlpha: 0, scale: 0.985 },
        { autoAlpha: 1, scale: 1, duration: CEREMONY_REVEAL_DURATION, ease: 'power2.inOut' },
        webglOn ? CEREMONY_REVEAL_AT : CEREMONY_CREST_HOLD + 0.3,
      )

      // Plate + button settle in. No auto-advance after this — the timeline
      // simply ends and the owner chooses where to go.
      tl.fromTo(
        q('[data-cer-plate]'),
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: 0.5 },
        webglOn ? CEREMONY_PLATE_AT : CEREMONY_CREST_HOLD + 0.7,
      )

      return () => tl.kill()
    },
    { scope: rootRef, dependencies: [reduced, webglOn] },
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
          <CeremonyEmberLayer drive={drive} productImageUrl={imageUrl} />
        </Suspense>
      ) : null}

      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
        {/* DOM crest — the no-WebGL opening beat (hidden when embers run). */}
        <div
          data-cer-crest
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0"
        >
          <AnvlCrest className="h-28 w-auto text-[var(--color-highlight-bright)]" />
        </div>

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
          <span className="inline-flex items-center gap-3 rounded-lg border border-[color-mix(in_oklab,var(--color-highlight)_45%,var(--color-line))] bg-[linear-gradient(160deg,var(--color-surface-elevated)_0%,var(--color-surface)_60%)] px-6 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_20px_60px_-20px_rgba(0,0,0,0.9)]">
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
