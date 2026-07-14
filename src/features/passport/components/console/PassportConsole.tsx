import { useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { useGSAP } from '@gsap/react'
import { ArrowLeft, BadgeCheck, BookOpen } from 'lucide-react'
import type { Product } from '@/features/products/types/product.types'
import { cn } from '@/shared/lib/cn'
import { gsap } from '@/shared/lib/gsap'
import type { ResolvedPassportContent } from '../../lib/resolvePassportContent'
import type { PassportView } from '../../schemas/passport.schema'
import { createPassportMotionState } from '../../webgl/passportMotionState'
import { PassportForgeGate } from '../../webgl/PassportForgeGate'
import {
  PASSPORT_FIRST_REVEAL_AT,
  PASSPORT_REVEAL_DURATION,
  PASSPORT_SHATTER_OUT,
  PASSPORT_SWAP_AT,
} from '../../webgl/passportForgeTiming'
import { ForgeSerialPlate } from '../ForgeSerialPlate'
import {
  PASSPORT_SECTIONS,
  type PassportSectionContext,
  type PassportSectionKey,
} from './passportSections'

/**
 * The desktop passport console (≥1280px, motion allowed): a no-scroll split —
 * the claimed piece forged out of ember particles on the left, bento section
 * cards on the right. Opening a section shatters the whole composition into
 * particles and re-forges it around the section's content (particle-forge
 * standard; DOM choreography stands alone when WebGL is unavailable).
 */
export function PassportConsole({
  view,
  product,
  content,
  hasStoryBook,
  claimedDate,
  actions,
}: {
  view: PassportView
  product: Product | null
  content: ResolvedPassportContent
  hasStoryBook: boolean
  claimedDate: string | null
  actions?: ReactNode
}) {
  const scopeRef = useRef<HTMLDivElement>(null)
  const motion = useMemo(() => createPassportMotionState(), [])
  const [webglOn, setWebglOn] = useState(false)
  const [active, setActive] = useState<PassportSectionKey | null>(null)
  const transitioning = useRef(false)

  const ctx: PassportSectionContext = { view, product, content, claimedDate }
  const sections = PASSPORT_SECTIONS.filter((s) => s.available(ctx))
  const activeDef = sections.find((s) => s.key === active) ?? null

  const stageImage =
    content.piece.heroRenderUrl ??
    (view.claimedColor
      ? product?.shop?.imagesByColorName?.[view.claimedColor]?.[0]?.src
      : undefined) ??
    content.piece.gallery[0]?.src ??
    null

  // Mount entrance — image resolves out of the embers on the shared clock
  // (immediately when there are no embers), cards forge in staggered.
  useGSAP(
    () => {
      const revealAt = webglOn ? PASSPORT_FIRST_REVEAL_AT : 0.2
      const tl = gsap.timeline()
      tl.fromTo(
        '[data-pc-image]',
        { autoAlpha: 0, scale: 1.03, filter: 'blur(10px)' },
        {
          autoAlpha: 1,
          scale: 1,
          filter: 'blur(0px)',
          duration: PASSPORT_REVEAL_DURATION,
          ease: 'power2.out',
        },
        revealAt,
      )
      tl.call(
        () => {
          gsap.to(motion, { reveal: 1, duration: PASSPORT_REVEAL_DURATION, ease: 'power2.out' })
        },
        undefined,
        revealAt,
      )
      // fromTo (never from): StrictMode double-mounts would otherwise capture
      // the killed first run's autoAlpha 0 as the end state — stuck hidden.
      tl.fromTo(
        '[data-pc-plate]',
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' },
        revealAt + 0.3,
      )
      tl.fromTo(
        '[data-pc-card]',
        { autoAlpha: 0, y: 30 },
        { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 },
        Math.max(0.2, revealAt - 0.4),
      )
      return () => tl.kill()
    },
    { scope: scopeRef, dependencies: [webglOn] },
  )

  // Panel entrance whenever the active section changes (runs after the swap).
  useGSAP(
    () => {
      gsap.fromTo(
        '[data-pc-enter]',
        { autoAlpha: 0, y: 26, filter: 'blur(8px)' },
        {
          autoAlpha: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.75,
          ease: 'power3.out',
          stagger: 0.07,
        },
      )
      gsap.to(motion, { reveal: 1, duration: 0.9, ease: 'power2.out', delay: 0.15 })
      gsap.to('[data-pc-image]', {
        autoAlpha: 1,
        filter: 'blur(0px)',
        scale: 1,
        duration: 0.9,
        ease: 'power2.out',
      })
    },
    { scope: scopeRef, dependencies: [active] },
  )

  /** Shatter the composition and swap to `key` (or back to the bento). */
  const goTo = (key: PassportSectionKey | null) => {
    if (transitioning.current || key === active) return
    transitioning.current = true
    motion.shatter += 1
    gsap.to(motion, { reveal: 0, duration: PASSPORT_SHATTER_OUT * 0.8, ease: 'power2.in' })
    const tl = gsap.timeline({
      onComplete: () => {
        transitioning.current = false
      },
    })
    tl.to(
      scopeRef.current?.querySelectorAll('[data-pc-enter], [data-pc-card]') ?? [],
      {
        autoAlpha: 0,
        y: () => gsap.utils.random(-26, 26),
        filter: 'blur(10px)',
        duration: PASSPORT_SHATTER_OUT * 0.85,
        ease: 'power2.in',
        stagger: 0.035,
      },
      0,
    )
    tl.to(
      '[data-pc-image]',
      {
        autoAlpha: 0.15,
        scale: 0.985,
        filter: 'blur(8px)',
        duration: PASSPORT_SHATTER_OUT,
        ease: 'power2.in',
      },
      0,
    )
    tl.call(() => setActive(key), undefined, PASSPORT_SWAP_AT)
  }

  return (
    <div
      ref={scopeRef}
      className="relative isolate h-[calc(100svh-var(--anvl-header-h))] overflow-hidden bg-[var(--color-bg)]"
      data-passport-console
    >
      <PassportForgeGate motion={motion} imageUrl={stageImage} onActiveChange={setWebglOn} />

      <div className="relative z-10 mx-auto grid h-full max-w-[110rem] grid-cols-[minmax(0,5fr)_minmax(0,6fr)] items-center gap-14 px-12 2xl:gap-20 2xl:px-20">
        {/* The piece stage ------------------------------------------------ */}
        <div
          className="flex h-full flex-col items-center justify-center py-10"
          onPointerEnter={() => {
            motion.hover = 1
          }}
          onPointerLeave={() => {
            motion.hover = 0
          }}
        >
          {stageImage ? (
            <img
              data-pc-image
              src={stageImage}
              alt={view.productName}
              width={1200}
              height={1500}
              decoding="async"
              className="max-h-[58vh] w-auto object-contain opacity-0 drop-shadow-[0_50px_80px_rgba(0,0,0,0.55)]"
            />
          ) : (
            <div
              data-pc-image
              className="flex aspect-[4/5] max-h-[58vh] items-center justify-center rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-10 opacity-0"
            >
              <span className="anvl-heading text-3xl text-[var(--color-text-muted)]">
                {view.productName}
              </span>
            </div>
          )}

          <div data-pc-plate className="mt-8 flex flex-col items-center gap-3 text-center">
            <ForgeSerialPlate
              serialNumber={view.serialNumber}
              editionTotal={view.editionTotal}
              size="md"
            />
            {view.claimedDisplayName ? (
              <p className="text-sm text-[var(--color-text)]">
                Forged by{' '}
                <span className="font-semibold text-[var(--color-heading)]">
                  {view.claimedDisplayName}
                </span>
                {claimedDate ? (
                  <span className="text-[var(--color-text-muted)]"> · {claimedDate}</span>
                ) : null}
              </p>
            ) : null}
            <p className="inline-flex items-center gap-1.5 text-xs text-[var(--color-success)]">
              <BadgeCheck aria-hidden="true" className="h-4 w-4" />
              Verified authentic — one of {view.editionTotal}
            </p>
            {actions}
          </div>
        </div>

        {/* Section panel --------------------------------------------------- */}
        <div className="flex h-full min-h-0 flex-col justify-center py-10">
          {activeDef ? (
            <div className="min-h-0 overflow-y-auto pr-2 [scrollbar-width:thin]">
              <button
                type="button"
                data-pc-enter
                onClick={() => goTo(null)}
                className="focus-ring anvl-micro mb-6 inline-flex items-center gap-2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
              >
                <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
                Back to the passport
              </button>
              <p data-pc-enter className="anvl-micro text-[var(--color-highlight-bright)]">
                {activeDef.eyebrow}
              </p>
              <h2
                data-pc-enter
                className="anvl-heading mb-8 mt-2 text-4xl text-[var(--color-heading)]"
              >
                {activeDef.title}
              </h2>
              <div data-pc-enter>
                <activeDef.Detail ctx={ctx} />
              </div>
            </div>
          ) : (
            <>
              <div data-pc-card>
                <p className="anvl-micro text-[var(--color-highlight-bright)]">
                  Product passport{product?.dropName ? ` · ${product.dropName}` : ''}
                </p>
                <h1 className="anvl-heading mt-2 text-4xl text-[var(--color-heading)] 2xl:text-5xl">
                  {view.productName}
                </h1>
                {content.identity.tagline ? (
                  <p className="mt-2 max-w-md text-sm text-[var(--color-text-muted)]">
                    {content.identity.tagline}
                  </p>
                ) : null}
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 2xl:gap-5">
                {sections.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    data-pc-card
                    onClick={() => goTo(s.key)}
                    className="focus-ring group relative isolate overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[color-mix(in_oklab,var(--color-highlight)_50%,var(--color-line))] hover:shadow-[0_24px_60px_-30px_color-mix(in_oklab,var(--color-highlight)_50%,transparent)]"
                  >
                    {s.cardImage?.(ctx) ? (
                      <img
                        src={s.cardImage(ctx)}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        decoding="async"
                        width={600}
                        height={400}
                        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-[0.18] transition-opacity duration-300 group-hover:opacity-30"
                      />
                    ) : null}
                    <s.icon
                      aria-hidden="true"
                      className="h-5 w-5 text-[var(--color-highlight-bright)]"
                    />
                    <h3 className="anvl-heading mt-3 text-lg text-[var(--color-heading)]">
                      {s.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
                      {s.teaser(ctx)}
                    </p>
                  </button>
                ))}

                {hasStoryBook && product ? (
                  <Link
                    to="/story"
                    search={{ product: product.slug }}
                    data-pc-card
                    className={cn(
                      'focus-ring group relative overflow-hidden rounded-2xl border border-[color-mix(in_oklab,var(--color-highlight)_35%,var(--color-line))] bg-[linear-gradient(150deg,color-mix(in_oklab,var(--color-highlight)_12%,var(--color-surface))_0%,var(--color-surface)_70%)] p-5 no-underline transition-all duration-300 hover:-translate-y-1',
                      'col-span-2',
                    )}
                  >
                    <BookOpen
                      aria-hidden="true"
                      className="h-5 w-5 text-[var(--color-highlight-bright)]"
                    />
                    <h3 className="anvl-heading mt-3 text-lg text-[var(--color-heading)]">
                      This piece has a story
                    </h3>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      Open its chapter in the ANVL saga →
                    </p>
                  </Link>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
