import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { BadgeCheck } from 'lucide-react'
import type { Product } from '@/features/products/types/product.types'
import type { StoryChapter } from '@/features/story/schemas/story.schema'
import { SectionEyebrow } from '@/shared/components/premium/SectionEyebrow'
import { buttonVariants } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import { usePassportReveal } from '../hooks/usePassportReveal'
import type { ResolvedPassportContent } from '../lib/resolvePassportContent'
import type { PassportView } from '../schemas/passport.schema'
import { PassportConsole } from './console/PassportConsole'
import {
  PASSPORT_GROUPS,
  PASSPORT_SECTIONS,
  type PassportSectionContext,
} from './console/passportSections'
import { PASSPORT_CONSOLE_MQ } from '../webgl/PassportForgeGate'
import { AuthenticityPlate } from './AuthenticityPlate'
import { PassportAtmosphere } from './PassportAtmosphere'

export interface PassportPageProps {
  variant: 'owner' | 'public'
  view: PassportView
  product: Product | null
  content: ResolvedPassportContent
  storyChapter: StoryChapter | null
  claimedDate: string | null
  /** Owner-only extra controls (visibility switch, transfer) in the hero. */
  actions?: ReactNode
}

/** Console tier: big screens with motion allowed get the no-scroll experience. */
function useConsoleMode(): boolean {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(PASSPORT_CONSOLE_MQ)
    const update = () => setOn(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return on
}

/**
 * The passport itself. Owners on large motion-capable screens get the
 * no-scroll ember console; phones/tablets/reduced-motion get the scrolling
 * dossier (same PASSPORT_SECTIONS registry, grouped under the same category
 * headings). `public` is the read-only authenticity view for anyone else.
 */
export function PassportPage(props: PassportPageProps) {
  const consoleMode = useConsoleMode()

  if (props.variant === 'owner' && consoleMode) {
    return (
      <PassportConsole
        view={props.view}
        product={props.product}
        content={props.content}
        storyChapter={props.storyChapter}
        claimedDate={props.claimedDate}
        actions={props.actions}
      />
    )
  }

  return <PassportDossier {...props} />
}

/* ----------------------------------------------------------------------- */

/** The scrolling passport (mobile / tablet / reduced motion / public view). */
function PassportDossier({
  variant,
  view,
  product,
  content,
  storyChapter,
  claimedDate,
  actions,
}: PassportPageProps) {
  const scopeRef = useRef<HTMLDivElement>(null)
  usePassportReveal(scopeRef)

  const heroImage = resolveHeroImage(view, product, content)
  const isOwner = variant === 'owner'
  const ctx: PassportSectionContext = { view, product, content, claimedDate, storyChapter }
  const availableSections = PASSPORT_SECTIONS.filter((s) => s.available(ctx))

  return (
    <div ref={scopeRef} className="relative bg-[var(--color-bg)]">
      {/* Identity plate ------------------------------------------------- */}
      <section className="relative overflow-hidden px-6 pb-16 pt-14 sm:pt-20">
        <PassportAtmosphere imageSrc={heroImage?.src} />
        <div className="relative mx-auto max-w-3xl text-center">
          <div data-pp-hero>
            <SectionEyebrow ember className="justify-center">
              Product passport{product?.dropName ? ` · ${product.dropName}` : ''}
            </SectionEyebrow>
          </div>
          <h1
            data-pp-hero
            className="anvl-heading mt-4 text-4xl text-[var(--color-heading)] sm:text-5xl md:text-6xl"
          >
            {view.productName}
          </h1>
          {content.identity.tagline ? (
            <p data-pp-hero className="mt-3 text-sm text-[var(--color-text-muted)]">
              {content.identity.tagline}
            </p>
          ) : null}
          <div data-pp-hero className="mt-8 flex justify-center">
            <AuthenticityPlate
              dropLabel={product?.dropName}
              editionTotal={view.editionTotal}
              size="lg"
            />
          </div>
          <div data-pp-hero className="mt-6 space-y-1">
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
          </div>
          {isOwner && (view.claimedColor || view.claimedSize) ? (
            <div data-pp-hero className="mt-5 flex justify-center gap-2">
              {view.claimedColor ? <Chip label="Colorway" value={view.claimedColor} /> : null}
              {view.claimedSize ? <Chip label="Size" value={view.claimedSize} /> : null}
            </div>
          ) : null}
          {isOwner && actions ? (
            <div data-pp-hero className="mt-6 flex justify-center">
              {actions}
            </div>
          ) : null}
        </div>
      </section>

      {/* The piece — deliberately modest on phones: the passport is a
          dossier, not a product gallery, and the copy below is the point. */}
      {heroImage ? (
        <section data-pp-reveal className="px-6 pb-14">
          <div className="mx-auto w-full max-w-[14rem] overflow-hidden rounded-2xl border border-[var(--color-line)] sm:max-w-xs md:max-w-md">
            <img
              src={heroImage.src}
              alt={heroImage.alt || view.productName}
              width={1200}
              height={1500}
              loading="lazy"
              decoding="async"
              className="h-auto w-full object-cover"
            />
          </div>
        </section>
      ) : null}

      {variant === 'public' ? (
        <PublicFooter productSlug={product?.slug ?? null} />
      ) : (
        <div className="mx-auto max-w-3xl space-y-16 px-6 pb-24">
          {PASSPORT_GROUPS.map((g) => {
            const sections = availableSections.filter((s) => s.group === g.key)
            if (!sections.length) return null
            return (
              <div key={g.key} className="space-y-12">
                <p
                  data-pp-reveal
                  className="anvl-micro border-b border-[var(--color-line)] pb-3 uppercase tracking-[0.24em] text-[var(--color-highlight-bright)]"
                >
                  {g.label}
                </p>
                {sections.map((s, i) => (
                  <section key={s.key} data-pp-reveal>
                    <h2 className="anvl-heading inline-flex items-baseline gap-3 text-2xl text-[var(--color-heading)]">
                      <span
                        aria-hidden="true"
                        className="text-base text-[var(--color-highlight-bright)]"
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {s.title}
                    </h2>
                    <div className="mt-6">
                      <s.Detail ctx={ctx} />
                    </div>
                  </section>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PublicFooter({ productSlug }: { productSlug: string | null }) {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-24 text-center" data-pp-reveal>
      <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
        This piece is already registered to its owner. Passports are one-owner —
        scanning this code cannot transfer or duplicate it.
      </p>
      {productSlug ? (
        <div className="mt-8 flex justify-center">
          <Link
            to="/shop/$slug"
            params={{ slug: productSlug }}
            className={cn(buttonVariants({ variant: 'secondary', size: 'md' }), 'no-underline')}
          >
            View this product
          </Link>
        </div>
      ) : null}
    </div>
  )
}

/* ----------------------------------------------------------------------- */

function resolveHeroImage(
  view: PassportView,
  product: Product | null,
  content: ResolvedPassportContent,
): { src: string; alt: string } | null {
  if (view.claimedColor) {
    const byColor = product?.shop?.imagesByColorName?.[view.claimedColor]
    if (byColor?.length) return byColor[0]
  }
  return content.piece.gallery[0] ?? product?.images[0] ?? null
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-1.5 text-xs">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className="font-semibold text-[var(--color-text)]">{value}</span>
    </span>
  )
}
