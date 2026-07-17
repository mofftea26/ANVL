import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { useGSAP } from '@gsap/react'
import { BadgeCheck } from 'lucide-react'
import type { Product } from '@/features/products/types/product.types'
import type { StoryChapter } from '@/features/story/schemas/story.schema'
import { buttonVariants } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import { gsap } from '@/shared/lib/gsap'
import { usePassportSectionNav } from '../hooks/usePassportSectionNav'
import type { ResolvedPassportContent } from '../lib/resolvePassportContent'
import type { PassportRelated } from '../lib/relatedProducts'
import type { PassportSizeGuide } from '../lib/sizeRecommendation'
import type { PassportView } from '../schemas/passport.schema'
import {
  PASSPORT_GROUPS,
  PASSPORT_SECTIONS,
  type PassportSectionContext,
} from './console/passportSections'
import { AuthenticityPlate } from './AuthenticityPlate'
import { PassportAtmosphere } from './PassportAtmosphere'
import { PassportHotspotDetail, PassportHotspots } from './PassportHotspots'
import { PassportSheet } from './PassportSheet'
import { ProductForgeImage } from './ProductForgeImage'

const SWAP_MS = 260

/**
 * The passport on phones/tablets (and reduced motion / public views): the same
 * experience as the desktop console, stacked and compact — title first, then a
 * small product render, a one/two-line identity strip, then group tabs over a
 * small bento grid. Tapping a bento opens its detail exactly like desktop.
 * No WebGL here — DOM/GSAP only, and it fades (never translates) so nothing
 * fights the layout.
 */
export function PassportMobile({
  variant,
  view,
  product,
  content,
  storyChapter,
  sizeGuide,
  related,
  claimedDate,
  actions,
}: {
  variant: 'owner' | 'public'
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
  const [hotspot, setHotspot] = useState<number | null>(null)
  // Group tabs keep the soft swap; sections open instantly as a bottom sheet.
  const { group, panelVisible, transitionTo } = usePassportSectionNav({
    swapDelayMs: SWAP_MS,
  })
  const [openSection, setOpenSection] = useState<string | null>(null)

  const ctx: PassportSectionContext = {
    view,
    product,
    content,
    claimedDate,
    storyChapter,
    sizeGuide,
    related,
  }
  const availableSections = PASSPORT_SECTIONS.filter((s) => s.available(ctx))
  const groups = PASSPORT_GROUPS.filter((g) => availableSections.some((s) => s.group === g.key))
  const groupSections = availableSections.filter((s) => s.group === group)
  const activeDef = availableSections.find((s) => s.key === openSection) ?? null
  const isOwner = variant === 'owner'

  const heroImage =
    (view.claimedColor
      ? product?.shop?.imagesByColorName?.[view.claimedColor]?.[0]
      : undefined) ??
    content.piece.gallery[0] ??
    product?.images[0] ??
    null

  // Entrance + per-swap reveal. Fade only — a translate would make the page
  // jump on small screens.
  useGSAP(
    () => {
      gsap.fromTo(
        '[data-pm-in]',
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.6, ease: 'power2.out', stagger: 0.05, overwrite: 'auto' },
      )
    },
    { scope: scopeRef },
  )
  useGSAP(
    () => {
      if (!panelVisible) return
      // Query first — some states render no panel items, and tweening an empty
      // selector logs a GSAP "target not found" warning.
      const items = scopeRef.current?.querySelectorAll('[data-pm-panel-item]')
      if (!items || items.length === 0) return
      gsap.fromTo(
        items,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.5, ease: 'power2.out', stagger: 0.04, overwrite: 'auto' },
      )
    },
    { scope: scopeRef, dependencies: [group, panelVisible] },
  )

  return (
    <div
      ref={scopeRef}
      className="relative min-h-svh overflow-hidden bg-[var(--color-bg)] pb-20 pt-[calc(var(--anvl-header-h)+1.5rem)]"
    >
      <PassportAtmosphere imageSrc={heroImage?.src} />

      <div className="relative mx-auto max-w-3xl px-5">
        {/* 1 — Header + title */}
        <header data-pm-in className="text-center">
          <p className="anvl-micro text-[var(--color-highlight-bright)]">
            Product passport{product?.dropName ? ` · ${product.dropName}` : ''}
          </p>
          <h1 className="anvl-heading mt-2 text-3xl text-[var(--color-heading)] sm:text-4xl">
            {view.productName}
          </h1>
          {content.identity.tagline ? (
            <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
              {content.identity.tagline}
            </p>
          ) : null}
        </header>

        {/* 2 — The piece (small), with its design-detail markers */}
        {heroImage ? (
          <div data-pm-in className="mx-auto mt-6 w-full max-w-[11rem] sm:max-w-[13rem]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-[var(--color-line)]">
              <ProductForgeImage
                src={heroImage.src}
                alt={heroImage.alt || view.productName}
                enableForge={false}
                wrapperClassName="h-full w-full"
                imgClassName="h-full w-full object-cover"
              >
                <PassportHotspots
                  hotspots={content.hotspots}
                  activeIndex={hotspot}
                  onSelect={setHotspot}
                />
              </ProductForgeImage>
            </div>
          </div>
        ) : null}

        {/* The selected detail — a sheet directly under the piece. */}
        {hotspot !== null && content.hotspots[hotspot] ? (
          <PassportHotspotDetail
            hotspot={content.hotspots[hotspot]}
            index={hotspot}
            total={content.hotspots.length}
            onDismiss={() => setHotspot(null)}
            className="mx-auto mt-4 max-w-sm"
          />
        ) : null}

        {/* 3 — Identity strip: authenticity + chips + actions, compact */}
        <div data-pm-in className="mt-5 flex flex-col items-center gap-2.5">
          <AuthenticityPlate
            dropLabel={product?.dropName}
            editionTotal={view.editionTotal}
            size="sm"
          />
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-center">
            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-success)]">
              <BadgeCheck aria-hidden="true" className="h-3.5 w-3.5" />
              Authentic
            </span>
            {view.claimedDisplayName ? (
              <span className="text-[11px] text-[var(--color-text-muted)]">
                <span className="text-[var(--color-text)]">{view.claimedDisplayName}</span>
                {claimedDate ? ` · ${claimedDate}` : ''}
              </span>
            ) : null}
            {isOwner && view.claimedColor ? (
              <span className="text-[11px] text-[var(--color-text-muted)]">
                {view.claimedColor}
                {view.claimedSize ? ` / ${view.claimedSize}` : ''}
              </span>
            ) : null}
          </div>
          {isOwner && actions ? (
            <div className="flex flex-wrap items-center justify-center gap-2 [&_button]:text-[10px]">
              {actions}
            </div>
          ) : null}
        </div>

        {/* 4 — Public view stops here (no dossier for other people's pieces). */}
        {variant === 'public' ? (
          <div data-pm-in className="mt-10 text-center">
            <p className="mx-auto max-w-sm text-xs leading-relaxed text-[var(--color-text-muted)]">
              This piece is already registered to its owner. Passports are one-owner —
              scanning this code cannot transfer or duplicate it.
            </p>
            {product?.slug ? (
              <div className="mt-6 flex justify-center">
                <Link
                  to="/shop/$slug"
                  params={{ slug: product.slug }}
                  className={cn(
                    buttonVariants({ variant: 'secondary', size: 'sm' }),
                    'no-underline',
                  )}
                >
                  View this product
                </Link>
              </div>
            ) : null}
          </div>
        ) : (
          <>
            {/* 5 — Group tabs */}
            <div
              role="tablist"
              aria-label="Passport sections"
              data-pm-in
              className="mt-8 flex items-center justify-center gap-4 border-b border-[var(--color-line)]"
            >
              {groups.map((g) => {
                const isActive = g.key === group
                return (
                  <button
                    key={g.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => transitionTo({ group: g.key, section: null })}
                    className={cn(
                      'focus-ring anvl-micro relative pb-2 text-[10px] uppercase tracking-[0.18em] transition-colors',
                      isActive
                        ? 'text-[var(--color-heading)]'
                        : 'text-[var(--color-text-muted)]',
                    )}
                  >
                    {g.label}
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute inset-x-0 -bottom-px h-px transition-opacity duration-300',
                        isActive
                          ? 'bg-[var(--color-highlight-bright)] opacity-100'
                          : 'opacity-0',
                      )}
                    />
                  </button>
                )
              })}
            </div>

            {/* 6 — Small bentos; tapping opens the section as a bottom sheet */}
            <div
              className={cn(
                'mt-5 transition-opacity duration-300 ease-out',
                panelVisible ? 'opacity-100' : 'opacity-0',
              )}
            >
              <div className="grid grid-cols-2 gap-3">
                {groupSections.map((s, i) => (
                  <button
                    key={s.key}
                    type="button"
                    data-pm-panel-item
                    onClick={() => setOpenSection(s.key)}
                    className="focus-ring group relative isolate overflow-hidden rounded-xl border border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-surface)_82%,transparent)] p-3.5 text-left transition-colors active:border-[color-mix(in_oklab,var(--color-highlight)_50%,var(--color-line))]"
                  >
                    {s.cardImage?.(ctx) ? (
                      <img
                        src={s.cardImage(ctx)}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        decoding="async"
                        width={400}
                        height={300}
                        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-[0.14]"
                      />
                    ) : null}
                    <span
                      aria-hidden="true"
                      className="anvl-heading text-xs text-[var(--color-highlight-bright)]"
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="anvl-heading mt-1 text-sm leading-tight text-[var(--color-heading)]">
                      {s.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-[var(--color-text-muted)]">
                      {s.teaser(ctx)}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* The open section, as a phone-native bottom sheet */}
            {activeDef ? (
              <PassportSheet
                open
                onClose={() => setOpenSection(null)}
                eyebrow={activeDef.eyebrow}
                title={activeDef.title}
              >
                <activeDef.Detail ctx={ctx} />
              </PassportSheet>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
