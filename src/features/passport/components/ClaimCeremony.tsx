import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { createDustDrive } from '@/shared/webgl/DustField'
import { isWebglAvailable } from '@/shared/webgl/isWebglAvailable'
import { useCanvasMountGate } from '@/shared/webgl/canvasTeardownGuard'
import { AnvlCrest } from '@/shared/assets/brand'
import { useLockPageScroll } from '@/shared/hooks/useLockPageScroll'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import { gsap } from '@/shared/lib/gsap'

const CeremonyEmberLayer = lazy(() => import('./CeremonyEmberLayer'))

const SPARK_COUNT = 26

/**
 * The claim ceremony — a full-screen GSAP "forging" beat played once, right
 * after a successful claim. Mobile-first: pure DOM/CSS timeline everywhere
 * (no scroll, no pinning); WebGL embers layer in behind it only on capable
 * devices. Reduced motion skips straight to the passport.
 */
export function ClaimCeremony({
  productName,
  editionTotal,
  ownerName,
  claimedDate,
  onComplete,
}: {
  productName: string
  editionTotal: number
  ownerName: string
  claimedDate: string
  onComplete: () => void
}) {
  const reduced = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const drive = useMemo(() => createDustDrive({ decayGlint: true, lift: 0.4 }), [])
  const [webglOn, setWebglOn] = useState(false)
  const mountable = useCanvasMountGate(webglOn)

  useLockPageScroll(true)

  // WebGL gate: capability + motion preference, resolved client-side only.
  useEffect(() => {
    if (reduced) return
    setWebglOn(isWebglAvailable())
  }, [reduced])

  // Reduced motion: no ceremony, straight to the passport.
  useEffect(() => {
    if (reduced) onComplete()
  }, [reduced, onComplete])

  useGSAP(
    () => {
      if (reduced) return
      const root = rootRef.current
      if (!root) return

      const q = gsap.utils.selector(root)
      const sparks = q<HTMLElement>('[data-spark]')

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        onComplete: () => {
          // Hold the finished frame a beat, then hand off to the passport.
          gsap.to(root, {
            autoAlpha: 0,
            duration: 0.8,
            delay: 0.9,
            ease: 'power2.inOut',
            onComplete,
          })
        },
      })

      // 1. The mark appears out of the dark. (fromTo, never from — StrictMode
      // double-mounts would capture the killed run's hidden state otherwise.)
      tl.fromTo(
        q('[data-cer-eyebrow]'),
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.7 },
      ).fromTo(
        q('[data-cer-title]'),
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.8 },
        '-=0.35',
      )

        // 2. The strike: flash + shake + spark burst + ember glint.
        .add('strike', '+=0.35')
        .fromTo(
          q('[data-cer-flash]'),
          { autoAlpha: 0 },
          { autoAlpha: 0.9, duration: 0.06, ease: 'power4.in' },
          'strike',
        )
        .to(q('[data-cer-flash]'), { autoAlpha: 0, duration: 0.5, ease: 'power2.out' })
        .fromTo(
          root,
          { x: 0, y: 0 },
          { x: 0, y: 0, duration: 0.4, ease: 'elastic.out(1.4,0.22)' },
          'strike',
        )
        .fromTo(
          q('[data-cer-stage]'),
          { x: 0 },
          {
            keyframes: [
              { x: -7, y: 4, duration: 0.05 },
              { x: 6, y: -3, duration: 0.05 },
              { x: -4, y: 2, duration: 0.05 },
              { x: 2, y: -1, duration: 0.05 },
              { x: 0, y: 0, duration: 0.08 },
            ],
          },
          'strike',
        )
        .add(() => {
          drive.glint = 1
          drive.lift = 1
        }, 'strike')

      // Spark burst — radial scatter with gravity-ish fall.
      sparks.forEach((spark, i) => {
        const angle = (i / SPARK_COUNT) * Math.PI * 2 + Math.random() * 0.5
        const dist = 90 + Math.random() * 180
        tl.fromTo(
          spark,
          { autoAlpha: 1, x: 0, y: 0, scale: 0.6 + Math.random() * 0.8 },
          {
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist * 0.75 + 60 + Math.random() * 70,
            autoAlpha: 0,
            scale: 0.1,
            duration: 0.9 + Math.random() * 0.6,
            ease: 'power2.out',
          },
          'strike',
        )
      })

      // 3. The plate stamps in on the strike.
      tl.fromTo(
        q('[data-cer-plate]'),
        { autoAlpha: 0, scale: 1.7 },
        { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power4.out' },
        'strike',
      )

        // 4. Name + date engrave.
        .fromTo(
          q('[data-cer-owner]'),
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.7 },
          '+=0.15',
        )
        .fromTo(q('[data-cer-date]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, '-=0.3')
        .fromTo(
          q('[data-cer-sealed]'),
          { autoAlpha: 0, y: 10 },
          { autoAlpha: 1, y: 0, duration: 0.6 },
          '-=0.2',
        )

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
      aria-label="Claiming your passport"
    >
      {webglOn && mountable ? (
        <Suspense fallback={null}>
          <CeremonyEmberLayer drive={drive} />
        </Suspense>
      ) : null}

      {/* Strike flash */}
      <div
        data-cer-flash
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--color-highlight-bright)_60%,white)_0%,transparent_65%)]"
      />

      <div
        data-cer-stage
        className="relative flex h-full flex-col items-center justify-center px-6 text-center"
      >
        <p data-cer-eyebrow className="anvl-micro text-[var(--color-text-muted)]">
          The forge accepts
        </p>
        <h2
          data-cer-title
          className="anvl-heading mt-3 max-w-xl text-3xl text-[var(--color-heading)] sm:text-5xl"
        >
          {productName}
        </h2>

        {/* Spark emitter sits behind the plate */}
        <div className="relative mt-10">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {Array.from({ length: SPARK_COUNT }, (_, i) => (
              <span
                key={i}
                data-spark
                className="absolute h-1.5 w-1.5 rounded-full bg-[var(--color-highlight-bright)] opacity-0 shadow-[0_0_8px_2px_color-mix(in_oklab,var(--color-highlight)_70%,transparent)]"
              />
            ))}
          </div>
          <div data-cer-plate className="relative opacity-0">
            {/* The seal stamps in — crest + authenticity, never a serial. */}
            <span className="inline-flex items-center gap-4 rounded-lg border border-[color-mix(in_oklab,var(--color-highlight)_40%,var(--color-line))] bg-[linear-gradient(160deg,var(--color-surface-elevated)_0%,var(--color-surface)_60%)] px-8 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_20px_60px_-20px_rgba(0,0,0,0.9)]">
              <AnvlCrest
                aria-label="ANVL crest"
                className="h-12 w-auto text-[var(--color-highlight-bright)] sm:h-14"
              />
              <span className="flex flex-col text-left">
                <span className="anvl-heading text-2xl tracking-[0.2em] text-[var(--color-heading)] sm:text-3xl">
                  Authentic ANVL
                </span>
                <span className="anvl-micro text-[var(--color-text-muted)]">
                  Limited to {editionTotal} pieces
                </span>
              </span>
            </span>
          </div>
        </div>

        <p data-cer-owner className="mt-10 text-base text-[var(--color-text)] sm:text-lg">
          Forged by{' '}
          <span className="font-semibold text-[var(--color-heading)]">{ownerName}</span>
        </p>
        {claimedDate ? (
          <p data-cer-date className="mt-1 text-sm text-[var(--color-text-muted)]">
            {claimedDate}
          </p>
        ) : null}
        <p data-cer-sealed className="anvl-micro mt-8 text-[var(--color-highlight-bright)]">
          One owner. Forever.
        </p>
      </div>
    </div>
  )
}
