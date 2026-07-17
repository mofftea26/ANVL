import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useGSAP } from '@gsap/react'
import { ArrowLeft, BadgeCheck } from 'lucide-react'
import type { Product } from '@/features/products/types/product.types'
import type { StoryChapter } from '@/features/story/schemas/story.schema'
import { cn } from '@/shared/lib/cn'
import { gsap } from '@/shared/lib/gsap'
import { isWebglAvailable } from '@/shared/webgl/isWebglAvailable'
import { usePassportSectionNav } from '../../hooks/usePassportSectionNav'
import type { ResolvedPassportContent } from '../../lib/resolvePassportContent'
import type { PassportRelated } from '../../lib/relatedProducts'
import type { PassportSizeGuide } from '../../lib/sizeRecommendation'
import type { PassportView } from '../../schemas/passport.schema'
import { createPassportMotionState } from '../../webgl/passportMotionState'
import { PassportForgeGate } from '../../webgl/PassportForgeGate'
import {
  PASSPORT_ASSEMBLE_DURATION,
  PASSPORT_ENTRY_DELAY,
  PASSPORT_SHATTER_IN,
  PASSPORT_SHATTER_OUT,
  PASSPORT_SWAP_AT,
} from '../../webgl/passportForgeTiming'
import { AuthenticityPlate } from '../AuthenticityPlate'
import { PassportHotspotDetail, PassportHotspots } from '../PassportHotspots'
import { ProductForgeImage } from '../ProductForgeImage'
import {
  PASSPORT_GROUPS,
  PASSPORT_SECTIONS,
  type PassportSectionContext,
} from './passportSections'

/**
 * The desktop passport console (≥1280px, motion allowed): a no-scroll split —
 * the clean product render on the left (champagne light sweep), grouped bento
 * cards on the right whose SHAPES are traced out of ember particles (measured
 * from the DOM each layout). Tabs switch between section groups; opening a
 * card or switching tabs dissolves the ember layout into a veil while the
 * panel swaps (React state + setTimeout + CSS — GSAP stays decoration).
 */
export function PassportConsole({
  token = null,
  view,
  product,
  content,
  storyChapter,
  sizeGuide,
  related,
  claimedDate,
  actions,
}: {
  token?: string | null
  view: PassportView
  product: Product | null
  content: ResolvedPassportContent
  storyChapter: StoryChapter | null
  sizeGuide: PassportSizeGuide | null
  related: PassportRelated | null
  claimedDate: string | null
  actions?: ReactNode
}) {
  const scopeRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const motion = useMemo(() => createPassportMotionState(), [])
  const [webglOn] = useState(() => isWebglAvailable())
  const firstEntrance = useRef(true)
  // Design-detail markers live on the render, independent of the section nav.
  const [hotspot, setHotspot] = useState<number | null>(null)

  // Shared with the mobile passport — the swap is state + a timer; the ember
  // choreography below only decorates it.
  const { group, active, panelVisible, transitionTo } = usePassportSectionNav({
    swapDelayMs: PASSPORT_SWAP_AT * 1000,
    onOut: () => {
      motion.shatter += 1
      gsap.killTweensOf(motion, 'reveal')
      gsap.to(motion, { reveal: 0, duration: PASSPORT_SHATTER_OUT * 0.7, ease: 'sine.in' })
    },
    onIn: () => {
      gsap.killTweensOf(motion, 'reveal')
      gsap.to(motion, {
        reveal: 1,
        duration: 1.2,
        ease: 'power2.out',
        delay: PASSPORT_SHATTER_IN * 0.5,
      })
    },
  })

  const ctx: PassportSectionContext = {
    view,
    product,
    content,
    claimedDate,
    storyChapter,
    sizeGuide,
    related,
    token,
  }
  const availableSections = PASSPORT_SECTIONS.filter((s) => s.available(ctx))
  const groups = PASSPORT_GROUPS.filter((g) =>
    availableSections.some((s) => s.group === g.key),
  )
  const groupSections = availableSections.filter((s) => s.group === group)
  const activeDef = availableSections.find((s) => s.key === active) ?? null

  const stageImage =
    content.piece.heroRenderUrl ??
    (view.claimedColor
      ? product?.shop?.imagesByColorName?.[view.claimedColor]?.[0]?.src
      : undefined) ??
    content.piece.gallery[0]?.src ??
    null

  // Measure the visible card/panel shapes for the ember tracing. Accuracy
  // rule: nothing in this panel may animate with a transform (cards fade only
  // — see the entrance tween), so a rect read on the frame after commit is
  // already the FINAL resting layout the embers must trace.
  useEffect(() => {
    if (!panelVisible) return
    let raf1 = 0
    let raf2 = 0
    const measure = () => {
      const els = panelRef.current?.querySelectorAll<HTMLElement>('[data-pc-shape]')
      if (!els?.length) return
      const next = [...els].map((el) => {
        const r = el.getBoundingClientRect()
        return { x: r.left, y: r.top, w: r.width, h: r.height }
      })
      // Only re-forge when the layout genuinely moved — a redundant bump
      // would restart the morph and read as a stutter.
      const unchanged =
        next.length === motion.cardRects.length &&
        next.every((r, i) => {
          const prev = motion.cardRects[i]!
          return (
            Math.abs(r.x - prev.x) < 0.5 &&
            Math.abs(r.y - prev.y) < 0.5 &&
            Math.abs(r.w - prev.w) < 0.5 &&
            Math.abs(r.h - prev.h) < 0.5
          )
        })
      if (unchanged) return
      motion.cardRects = next
      motion.cardRectsVersion += 1
    }
    // Two frames: React commit → styles applied → stable rects.
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(measure)
    })
    // Late settle (fonts/images can reflow the grid).
    const settle = window.setTimeout(measure, 700)
    const onResize = () => measure()
    window.addEventListener('resize', onResize, { passive: true })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      window.clearTimeout(settle)
      window.removeEventListener('resize', onResize)
    }
  }, [motion, panelVisible, group, active, hotspot])

  // Mount entrance — image sweeps in immediately; cards breathe in as the
  // embers assemble (shared clock); reveal settles the embers to a trace.
  useGSAP(
    () => {
      const tl = gsap.timeline()
      tl.fromTo(
        '[data-pc-image]',
        { autoAlpha: 0, y: 24, filter: 'blur(8px)' },
        { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.0, ease: 'power2.out' },
        0.2,
      )
      tl.fromTo(
        '[data-pc-plate]',
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' },
        0.55,
      )
      tl.call(
        () => {
          gsap.killTweensOf(motion, 'reveal')
          gsap.to(motion, { reveal: 1, duration: 1.2, ease: 'power2.out' })
        },
        undefined,
        webglOn ? PASSPORT_ENTRY_DELAY + PASSPORT_ASSEMBLE_DURATION : 0.4,
      )
      return () => {
        tl.kill()
      }
    },
    { scope: scopeRef },
  )

  // Panel items resolve INSIDE the embers that are forming their shape — so
  // they fade only (never translate: a moving rect would desync the ember
  // tracing), timed to land as the forge settles.
  useGSAP(
    () => {
      if (!panelVisible) return
      const delay = firstEntrance.current
        ? webglOn
          ? Math.max(0.3, PASSPORT_ENTRY_DELAY + PASSPORT_ASSEMBLE_DURATION - 0.7)
          : 0.3
        : webglOn
          ? PASSPORT_SHATTER_IN * 0.55
          : 0.05
      firstEntrance.current = false
      gsap.fromTo(
        '[data-pc-item]',
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: 0.8,
          ease: 'power2.out',
          stagger: 0.05,
          delay,
          overwrite: 'auto',
        },
      )
    },
    { scope: scopeRef, dependencies: [group, active, panelVisible] },
  )

  return (
    <div
      ref={scopeRef}
      className="relative isolate h-svh overflow-hidden bg-[var(--color-bg)] pt-[var(--anvl-header-h)]"
      data-passport-console
    >
      <PassportForgeGate motion={motion} />

      {/* Both columns are flex + min-h-0 so the render and the panel SHRINK to
          whatever height is left — on a short laptop nothing can spill past
          the bottom edge (the console never scrolls). */}
      <div className="relative z-10 mx-auto grid h-full max-w-[110rem] grid-cols-[minmax(0,5fr)_minmax(0,6fr)] items-center gap-14 px-12 pb-14 pt-6 2xl:gap-20 2xl:px-20">
        {/* The piece stage ------------------------------------------------ */}
        <div className="flex h-full min-h-0 flex-col items-center justify-center gap-6">
          <div className="flex min-h-0 flex-1 items-center justify-center">
            {stageImage ? (
              // Fixed portrait box (explicit height resolves the aspect) so
              // every product renders at the SAME, smaller size regardless of
              // its own aspect ratio.
              <div
                data-pc-image
                className="relative flex aspect-[4/5] h-[42vh] max-h-[26rem] items-center justify-center"
              >
                <ProductForgeImage
                  src={stageImage}
                  alt={view.productName}
                  wrapperClassName="flex h-full w-full items-center justify-center"
                  imgClassName="pp-sheen max-h-full max-w-full object-contain drop-shadow-[0_40px_70px_rgba(0,0,0,0.55)]"
                >
                  <PassportHotspots
                    hotspots={content.hotspots}
                    activeIndex={hotspot}
                    onSelect={setHotspot}
                  />
                </ProductForgeImage>
              </div>
            ) : (
              <div
                data-pc-image
                className="flex aspect-[4/5] h-[42vh] max-h-[26rem] items-center justify-center rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-10"
              >
                <span className="anvl-heading text-3xl text-[var(--color-text-muted)]">
                  {view.productName}
                </span>
              </div>
            )}
          </div>

          <div data-pc-plate className="flex shrink-0 flex-col items-center gap-3 text-center">
            <AuthenticityPlate
              dropLabel={product?.dropName}
              editionTotal={view.editionTotal}
              size="md"
            />
            {view.claimedDisplayName ? (
              <p className="text-sm text-[var(--color-text)]">
                Registered to{' '}
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
              Authentic ANVL product
            </p>
            {actions}
          </div>
        </div>

        {/* Section panel — top-aligned so the bento sits right under the tabs
            (never vertically centered in the column). */}
        <div className="flex h-full min-h-0 flex-col justify-start pt-2">
          {/* Group tabs */}
          <div
            role="tablist"
            aria-label="Passport sections"
            className="mb-6 flex shrink-0 items-center gap-6"
          >
            {groups.map((g) => {
              const isActive = g.key === group
              return (
                <button
                  key={g.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setHotspot(null)
                    transitionTo({ group: g.key, section: null })
                  }}
                  className={cn(
                    'focus-ring anvl-micro relative pb-2 uppercase tracking-[0.22em] transition-colors',
                    isActive
                      ? 'text-[var(--color-heading)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
                  )}
                >
                  {g.label}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-x-0 bottom-0 h-px transition-all duration-300',
                      isActive
                        ? 'bg-[var(--color-highlight-bright)] opacity-100'
                        : 'bg-transparent opacity-0',
                    )}
                  />
                </button>
              )
            })}
          </div>

          {/* No transform on this wrapper — the ember tracing measures the
              cards inside it, and a transform would move the rects. */}
          <div
            ref={panelRef}
            className={cn(
              // flex-1 + min-h-0: the panel owns the leftover height, so its
              // children can cap at max-h-full and scroll instead of spilling.
              'flex min-h-0 flex-1 flex-col justify-center transition-opacity duration-500 ease-out',
              panelVisible ? 'opacity-100' : 'opacity-0',
            )}
          >
            {/* A design-detail marker takes the panel while it's open — the
                embers re-trace around it (the measure effect follows the
                layout, so this costs no extra choreography). */}
            {hotspot !== null && content.hotspots[hotspot] ? (
              <div data-pc-shape data-pc-item>
                <PassportHotspotDetail
                  hotspot={content.hotspots[hotspot]}
                  index={hotspot}
                  total={content.hotspots.length}
                  onDismiss={() => setHotspot(null)}
                />
              </div>
            ) : /* The detail fits the console by design; it scrolls only when a
                  section's content genuinely exceeds the panel (long saga). */
            activeDef ? (
              <div
                data-pc-shape
                data-pc-item
                className="max-h-full overflow-y-auto overscroll-contain rounded-2xl border border-[color-mix(in_oklab,var(--color-highlight)_18%,var(--color-line))] bg-[color-mix(in_oklab,var(--color-surface)_88%,transparent)] p-7 [scrollbar-width:thin]"
              >
                <button
                  type="button"
                  data-pc-item
                  onClick={() => transitionTo({ section: null })}
                  className="focus-ring anvl-micro mb-6 inline-flex items-center gap-2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                >
                  <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
                  Back to {groups.find((g) => g.key === group)?.label ?? 'the passport'}
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
                  {groupSections.map((s, i) => (
                    <button
                      key={s.key}
                      type="button"
                      data-pc-item
                      data-pc-shape
                      onClick={() => transitionTo({ section: s.key })}
                      className="focus-ring group relative isolate overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-surface)_80%,transparent)] p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[color-mix(in_oklab,var(--color-highlight)_50%,var(--color-line))] hover:shadow-[0_24px_60px_-30px_color-mix(in_oklab,var(--color-highlight)_50%,transparent)]"
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
                          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-[0.16] transition-opacity duration-300 group-hover:opacity-25"
                        />
                      ) : null}
                      <span
                        aria-hidden="true"
                        className="anvl-heading text-lg text-[var(--color-highlight-bright)]"
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <h3 className="anvl-heading mt-2 text-lg text-[var(--color-heading)]">
                        {s.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
                        {s.teaser(ctx)}
                      </p>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
