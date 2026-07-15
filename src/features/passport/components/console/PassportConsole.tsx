import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { useGSAP } from '@gsap/react'
import { ArrowLeft, BadgeCheck, BookOpen } from 'lucide-react'
import type { Product } from '@/features/products/types/product.types'
import { cn } from '@/shared/lib/cn'
import { gsap } from '@/shared/lib/gsap'
import { isWebglAvailable } from '@/shared/webgl/isWebglAvailable'
import type { ResolvedPassportContent } from '../../lib/resolvePassportContent'
import type { PassportView } from '../../schemas/passport.schema'
import { createPassportMotionState } from '../../webgl/passportMotionState'
import { PassportForgeGate } from '../../webgl/PassportForgeGate'
import {
  PASSPORT_FIRST_REVEAL_AT,
  PASSPORT_REVEAL_DURATION,
  PASSPORT_SHATTER_IN,
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
 * cards on the right. Opening a section dissolves the composition into a soft
 * particle veil while the panel swaps and re-forges around the new content.
 *
 * Choreography rules (learned the hard way):
 *  - The content swap is React state + setTimeout + CSS transitions. GSAP is
 *    decoration on top — if the animation clock ever stalls, content still
 *    swaps and shows.
 *  - The particle form registers to the MEASURED image rect (position+scale)
 *    via motion.stage, so embers and render match 1:1 at any layout size.
 *  - motion.reveal has exactly one writer per moment (killTweensOf first).
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
  const stageImageRef = useRef<HTMLElement | null>(null)
  const motion = useMemo(() => createPassportMotionState(), [])
  // Resolved synchronously so the entrance clock is right on the first frame
  // (the console itself only renders on ≥1280px + motion-allowed clients).
  const [webglOn] = useState(() => isWebglAvailable())
  const [active, setActive] = useState<PassportSectionKey | null>(null)
  const [panelVisible, setPanelVisible] = useState(true)
  const transitioning = useRef(false)
  const firstEntrance = useRef(true)
  const swapTimer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (swapTimer.current !== null) window.clearTimeout(swapTimer.current)
    },
    [],
  )

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

  // Measure the rendered image so the ember form can register to it exactly.
  // Re-measured on load/resize + settle passes (entrance scale skews the first
  // rect; transforms don't refire ResizeObserver).
  useEffect(() => {
    const el = stageImageRef.current
    if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect()
      if (r.width > 4 && r.height > 4) {
        motion.stage = {
          cx: r.left + r.width / 2,
          cy: r.top + r.height / 2,
          dim: Math.max(r.width, r.height),
        }
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure, { passive: true })
    const settleTimers = [1000, 2600, 4000].map((ms) => window.setTimeout(measure, ms))
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
      settleTimers.forEach((t) => window.clearTimeout(t))
    }
  }, [motion, stageImage])

  // Mount entrance — the render resolves out of the settling embers on the
  // shared clock (immediately when there are no embers); plate follows.
  useGSAP(
    () => {
      const revealAt = webglOn ? PASSPORT_FIRST_REVEAL_AT : 0.15
      const tl = gsap.timeline()
      tl.fromTo(
        '[data-pc-image]',
        { autoAlpha: 0, scale: 1.02, filter: 'blur(8px)' },
        {
          autoAlpha: 1,
          scale: 1,
          filter: 'blur(0px)',
          duration: PASSPORT_REVEAL_DURATION,
          ease: 'power2.out',
        },
        revealAt,
      )
      tl.fromTo(
        '[data-pc-plate]',
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' },
        revealAt + 0.25,
      )
      tl.call(
        () => {
          gsap.killTweensOf(motion, 'reveal')
          gsap.to(motion, { reveal: 1, duration: PASSPORT_REVEAL_DURATION, ease: 'power2.out' })
        },
        undefined,
        revealAt,
      )
      return () => {
        tl.kill()
      }
    },
    { scope: scopeRef },
  )

  // Panel items breathe in whenever the panel (re)becomes visible. Decorative
  // — the CSS wrapper transition owns visibility, so content shows regardless.
  useGSAP(
    () => {
      if (!panelVisible) return
      const delay = firstEntrance.current
        ? webglOn
          ? Math.max(0.3, PASSPORT_FIRST_REVEAL_AT - 0.6)
          : 0.25
        : 0.05
      firstEntrance.current = false
      gsap.fromTo(
        '[data-pc-item]',
        { autoAlpha: 0, y: 20 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.75,
          ease: 'power3.out',
          stagger: 0.06,
          delay,
          overwrite: 'auto',
        },
      )
    },
    { scope: scopeRef, dependencies: [active, panelVisible] },
  )

  /** Dissolve into the veil, swap the panel, re-forge around the new content. */
  const goTo = (key: PassportSectionKey | null) => {
    if (transitioning.current || key === active) return
    transitioning.current = true

    motion.shatter += 1
    gsap.killTweensOf(motion, 'reveal')
    gsap.to(motion, { reveal: 0, duration: PASSPORT_SHATTER_OUT * 0.7, ease: 'sine.in' })
    gsap.to('[data-pc-image]', {
      autoAlpha: 0.15,
      scale: 0.99,
      filter: 'blur(5px)',
      duration: PASSPORT_SHATTER_OUT,
      ease: 'sine.in',
      overwrite: 'auto',
    })
    setPanelVisible(false)

    swapTimer.current = window.setTimeout(() => {
      setActive(key)
      setPanelVisible(true)
      gsap.killTweensOf(motion, 'reveal')
      gsap.to(motion, {
        reveal: 1,
        duration: 1.1,
        ease: 'power2.out',
        delay: PASSPORT_SHATTER_IN * 0.45,
      })
      gsap.to('[data-pc-image]', {
        autoAlpha: 1,
        scale: 1,
        filter: 'blur(0px)',
        duration: 1.0,
        ease: 'power2.out',
        delay: PASSPORT_SHATTER_IN * 0.3,
        overwrite: 'auto',
      })
      transitioning.current = false
    }, PASSPORT_SWAP_AT * 1000)
  }

  return (
    <div
      ref={scopeRef}
      className="relative isolate h-[calc(100svh-var(--anvl-header-h))] overflow-hidden bg-[var(--color-bg)]"
      data-passport-console
    >
      <PassportForgeGate motion={motion} imageUrl={stageImage} />

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
              ref={(el) => {
                stageImageRef.current = el
              }}
              data-pc-image
              src={stageImage}
              alt={view.productName}
              width={1200}
              height={1500}
              decoding="async"
              className="max-h-[58vh] w-auto object-contain drop-shadow-[0_50px_80px_rgba(0,0,0,0.55)]"
            />
          ) : (
            <div
              ref={(el) => {
                stageImageRef.current = el
              }}
              data-pc-image
              className="flex aspect-[4/5] max-h-[58vh] items-center justify-center rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-10"
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

        {/* Section panel — CSS transition owns the swap visibility --------- */}
        <div
          className={cn(
            'flex h-full min-h-0 flex-col justify-center py-10',
            'transition-all duration-500 ease-out',
            panelVisible
              ? 'translate-y-0 opacity-100 blur-0'
              : 'translate-y-3 opacity-0 blur-md',
          )}
        >
          {activeDef ? (
            <div className="min-h-0 overflow-y-auto pr-2 [scrollbar-width:thin]">
              <button
                type="button"
                data-pc-item
                onClick={() => goTo(null)}
                className="focus-ring anvl-micro mb-6 inline-flex items-center gap-2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
              >
                <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
                Back to the passport
              </button>
              <p data-pc-item className="anvl-micro text-[var(--color-highlight-bright)]">
                {activeDef.eyebrow}
              </p>
              <h2
                data-pc-item
                className="anvl-heading mb-8 mt-2 text-4xl text-[var(--color-heading)]"
              >
                {activeDef.title}
              </h2>
              <div data-pc-item>
                <activeDef.Detail ctx={ctx} />
              </div>
            </div>
          ) : (
            <>
              <div data-pc-item>
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
                    data-pc-item
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
                    data-pc-item
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
