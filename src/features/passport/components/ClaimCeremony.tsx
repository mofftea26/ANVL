import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { AnvlCrest } from '@/shared/assets/brand'
import { createDustDrive } from '@/shared/webgl/DustField'
import { isWebglAvailable } from '@/shared/webgl/isWebglAvailable'
import { useCanvasMountGate } from '@/shared/webgl/canvasTeardownGuard'
import { useLockPageScroll } from '@/shared/hooks/useLockPageScroll'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import { gsap } from '@/shared/lib/gsap'
import type { CeremonyLine } from '../lib/ceremonyLines'
import {
  CEREMONY_ARMORY_AT,
  CEREMONY_CREST_AT,
  CEREMONY_CREST_DURATION,
  CEREMONY_END_AT,
  CEREMONY_LINES_AT,
  CEREMONY_LINE_STAGGER,
  CEREMONY_NAME_AT,
  CEREMONY_SCAN_AT,
  CEREMONY_SCAN_DURATION,
  CEREMONY_SEAL_AT,
  CEREMONY_SEAL_DURATION,
} from '../webgl/ceremonyTiming'

const CeremonyEmberLayer = lazy(() => import('./CeremonyEmberLayer'))

/**
 * "The Authentication" — the registration ceremony, played once after the
 * atomic claim has ALREADY succeeded (it never gates registration; skipping it
 * loses nothing).
 *
 * Beats, on the shared ceremony clock (`ceremonyTiming.ts`):
 *   beam sweeps the piece out of the dark → real record lines tick in →
 *   embers gather into the ANVL crest → the seal locks as the embers fuse into
 *   it → the owner's name settles → added to the Armory.
 *
 * Mobile-first: the whole thing is DOM/CSS/GSAP; the crest forge + ember field
 * layer in only on capable devices. Reduced motion skips straight through.
 */
export function ClaimCeremony({
  productName,
  imageUrl,
  lines,
  ownerName,
  onComplete,
}: {
  productName: string
  imageUrl: string | null
  lines: CeremonyLine[]
  ownerName: string
  onComplete: () => void
}) {
  const reduced = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const drive = useMemo(() => createDustDrive({ decayGlint: true, lift: 0.35 }), [])
  const [webglOn, setWebglOn] = useState(false)
  const mountable = useCanvasMountGate(webglOn)

  useLockPageScroll(true)

  useEffect(() => {
    if (reduced) return
    setWebglOn(isWebglAvailable())
  }, [reduced])

  // Reduced motion: the registration already happened — go straight to it.
  useEffect(() => {
    if (reduced) onComplete()
  }, [reduced, onComplete])

  useGSAP(
    () => {
      if (reduced) return
      const root = rootRef.current
      if (!root) return
      const q = gsap.utils.selector(root)

      // fromTo everywhere (never from): a killed `from` would leave elements
      // stuck hidden if this ever double-mounts.
      const tl = gsap.timeline({
        onComplete,
        defaults: { ease: 'power3.out' },
      })

      // 1 — The beam sweeps down; the piece resolves out of the dark behind it.
      tl.fromTo(
        q('[data-cer-beam]'),
        { autoAlpha: 0, yPercent: -110 },
        { autoAlpha: 1, yPercent: 110, duration: CEREMONY_SCAN_DURATION, ease: 'power1.inOut' },
        CEREMONY_SCAN_AT,
      )
      tl.fromTo(
        q('[data-cer-lit]'),
        { clipPath: 'inset(0% 0% 100% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: CEREMONY_SCAN_DURATION * 0.92,
          ease: 'power1.inOut',
        },
        CEREMONY_SCAN_AT + 0.04,
      )
      tl.fromTo(
        q('[data-cer-eyebrow]'),
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.6 },
        CEREMONY_SCAN_AT + 0.3,
      )

      // 2 — The record confirms itself, line by line (all real values).
      tl.fromTo(
        q('[data-cer-line]'),
        { autoAlpha: 0, x: -10 },
        { autoAlpha: 1, x: 0, duration: 0.45, stagger: CEREMONY_LINE_STAGGER },
        CEREMONY_LINES_AT,
      )

      // 3 — Embers gather (WebGL owns the crest; the DOM keeps a soft glow).
      tl.fromTo(
        q('[data-cer-glow]'),
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: CEREMONY_CREST_DURATION, ease: 'sine.inOut' },
        CEREMONY_CREST_AT,
      )
      tl.add(() => {
        drive.glint = 0.9
        drive.lift = 1
      }, CEREMONY_CREST_AT + CEREMONY_CREST_DURATION - 0.3)

      // 4 — The seal locks: it resolves OUT of the settled embers.
      tl.fromTo(
        q('[data-cer-seal]'),
        { autoAlpha: 0, scale: 1.35, rotate: -8, filter: 'blur(6px)' },
        {
          autoAlpha: 1,
          scale: 1,
          rotate: 0,
          filter: 'blur(0px)',
          duration: CEREMONY_SEAL_DURATION,
          ease: 'power3.out',
        },
        CEREMONY_SEAL_AT,
      )
      tl.fromTo(
        q('[data-cer-flash]'),
        { autoAlpha: 0 },
        { autoAlpha: 0.75, duration: 0.08, ease: 'power4.in' },
        CEREMONY_SEAL_AT + CEREMONY_SEAL_DURATION - 0.18,
      )
      tl.to(q('[data-cer-flash]'), { autoAlpha: 0, duration: 0.5, ease: 'power2.out' })

      // 5 — The name settles onto the plate.
      tl.fromTo(
        q('[data-cer-owner]'),
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.6 },
        CEREMONY_NAME_AT,
      )

      // 6 — Into the Armory.
      tl.fromTo(
        q('[data-cer-armory]'),
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: 0.5 },
        CEREMONY_ARMORY_AT,
      )
      tl.to(root, { autoAlpha: 0, duration: 0.7, ease: 'power2.inOut' }, CEREMONY_END_AT)

      return () => tl.kill()
    },
    { scope: rootRef, dependencies: [reduced] },
  )

  if (reduced) return null

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[80] overflow-hidden bg-[var(--color-bg)]"
      role="status"
      aria-label="Registering your passport"
    >
      {webglOn && mountable ? (
        <Suspense fallback={null}>
          <CeremonyEmberLayer drive={drive} />
        </Suspense>
      ) : null}

      {/* Seal flash */}
      <div
        data-cer-flash
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 opacity-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--color-highlight-bright)_55%,white)_0%,transparent_60%)]"
      />

      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
        <p
          data-cer-eyebrow
          className="anvl-micro opacity-0 text-[var(--color-highlight-bright)]"
        >
          Authenticating
        </p>

        {/* The piece, revealed by the beam ------------------------------- */}
        <div className="relative">
          {imageUrl ? (
            <div className="relative">
              {/* Dim base: the piece in the dark. */}
              <img
                src={imageUrl}
                alt=""
                aria-hidden="true"
                width={900}
                height={1125}
                decoding="async"
                className="max-h-[34svh] w-auto object-contain opacity-[0.14] blur-[3px]"
              />
              {/* Lit copy, wiped in behind the beam. */}
              <img
                data-cer-lit
                src={imageUrl}
                alt={productName}
                width={900}
                height={1125}
                decoding="async"
                className="absolute inset-0 max-h-[34svh] w-auto object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
                style={{ clipPath: 'inset(0% 0% 100% 0%)' }}
              />
              {/* The beam itself. */}
              <div
                data-cer-beam
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-[-12%] top-0 h-[14%] opacity-0 bg-[linear-gradient(180deg,transparent_0%,color-mix(in_oklab,var(--color-highlight-bright)_75%,transparent)_50%,transparent_100%)] blur-[2px]"
              />
            </div>
          ) : (
            <p data-cer-lit className="anvl-heading text-3xl text-[var(--color-heading)]">
              {productName}
            </p>
          )}
          {/* Ember gathering glow (the crest forms here on capable devices). */}
          <div
            data-cer-glow
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--color-highlight)_28%,transparent)_0%,transparent_65%)]"
          />
        </div>

        {/* The record confirms itself ------------------------------------ */}
        {lines.length > 0 ? (
          <dl className="grid max-w-md grid-cols-2 gap-x-6 gap-y-1 text-left">
            {lines.map((line) => (
              <div key={line.label} data-cer-line className="flex gap-2 opacity-0">
                <dt className="anvl-micro text-[9px] text-[var(--color-text-muted)]">
                  {line.label}
                </dt>
                <dd className="truncate text-[11px] text-[var(--color-text)]">{line.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {/* The seal ------------------------------------------------------ */}
        <div data-cer-seal className="opacity-0">
          <span className="inline-flex items-center gap-4 rounded-lg border border-[color-mix(in_oklab,var(--color-highlight)_45%,var(--color-line))] bg-[linear-gradient(160deg,var(--color-surface-elevated)_0%,var(--color-surface)_60%)] px-7 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_20px_60px_-20px_rgba(0,0,0,0.9)]">
            <AnvlCrest
              aria-label="ANVL crest"
              className="h-10 w-auto text-[var(--color-highlight-bright)]"
            />
            <span className="flex flex-col text-left">
              <span className="anvl-heading text-xl tracking-[0.2em] text-[var(--color-heading)]">
                Authentic ANVL
              </span>
              <span className="anvl-micro text-[9px] text-[var(--color-text-muted)]">
                Official digital passport
              </span>
            </span>
          </span>
        </div>

        <p data-cer-owner className="opacity-0 text-sm text-[var(--color-text)]">
          Registered to{' '}
          <span className="font-semibold text-[var(--color-heading)]">{ownerName}</span>
        </p>

        <p
          data-cer-armory
          className="anvl-micro opacity-0 text-[var(--color-highlight-bright)]"
        >
          Added to your Armory
        </p>
      </div>
    </div>
  )
}
