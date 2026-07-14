import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { BadgeCheck, BookOpen } from 'lucide-react'
import type { Product } from '@/features/products/types/product.types'
import { SectionEyebrow } from '@/shared/components/premium/SectionEyebrow'
import { buttonVariants } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import { usePassportReveal } from '../hooks/usePassportReveal'
import type { ResolvedPassportContent } from '../lib/resolvePassportContent'
import type { PassportView } from '../schemas/passport.schema'
import { PassportConsole } from './console/PassportConsole'
import {
  PASSPORT_SECTIONS,
  type PassportSectionContext,
} from './console/passportSections'
import { PASSPORT_CONSOLE_MQ } from '../webgl/PassportForgeGate'
import { ForgeSerialPlate } from './ForgeSerialPlate'
import { PassportAtmosphere } from './PassportAtmosphere'

export interface PassportPageProps {
  variant: 'owner' | 'public'
  view: PassportView
  product: Product | null
  content: ResolvedPassportContent
  hasStoryBook: boolean
  claimedDate: string | null
  /** Owner-only extra controls (e.g. transfer ownership) rendered by the hero. */
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
 * no-scroll particle console; phones/tablets/reduced-motion get the scrolling
 * dossier (both driven by the same PASSPORT_SECTIONS registry). `public` is
 * the read-only authenticity view for anyone else scanning a claimed code.
 */
export function PassportPage(props: PassportPageProps) {
  const consoleMode = useConsoleMode()

  if (props.variant === 'owner' && consoleMode) {
    return (
      <PassportConsole
        view={props.view}
        product={props.product}
        content={props.content}
        hasStoryBook={props.hasStoryBook}
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
  hasStoryBook,
  claimedDate,
  actions,
}: PassportPageProps) {
  const scopeRef = useRef<HTMLDivElement>(null)
  usePassportReveal(scopeRef)

  const heroImage = resolveHeroImage(view, product, content)
  const isOwner = variant === 'owner'
  const ctx: PassportSectionContext = { view, product, content, claimedDate }

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
            <ForgeSerialPlate
              serialNumber={view.serialNumber}
              editionTotal={view.editionTotal}
              size="lg"
            />
          </div>
          <div data-pp-hero className="mt-6 space-y-1">
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

      {/* The piece ------------------------------------------------------- */}
      {heroImage ? (
        <section data-pp-reveal className="px-6 pb-16">
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-[var(--color-line)]">
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
          {PASSPORT_SECTIONS.filter((s) => s.available(ctx)).map((s) => (
            <section key={s.key} data-pp-reveal>
              <h2 className="anvl-heading inline-flex items-center gap-3 text-2xl text-[var(--color-heading)]">
                <s.icon aria-hidden="true" className="h-4 w-4 text-[var(--color-highlight-bright)]" />
                {s.title}
              </h2>
              <div className="mt-6">
                <s.Detail ctx={ctx} />
              </div>
            </section>
          ))}

          {hasStoryBook && product ? (
            <section
              data-pp-reveal
              className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-8 text-center"
            >
              <BookOpen
                aria-hidden="true"
                className="mx-auto h-6 w-6 text-[var(--color-highlight-bright)]"
              />
              <h2 className="anvl-heading mt-4 text-2xl text-[var(--color-heading)]">
                This piece has a story
              </h2>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                Open its chapter in the ANVL saga.
              </p>
              <div className="mt-6 flex justify-center">
                <Link
                  to="/story"
                  search={{ product: product.slug }}
                  className={cn(
                    buttonVariants({ variant: 'secondary', size: 'md' }),
                    'no-underline',
                  )}
                >
                  Read the chapter
                </Link>
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  )
}

function PublicFooter({ productSlug }: { productSlug: string | null }) {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-24 text-center" data-pp-reveal>
      <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
        This piece is already forged to its owner. Passports are one-owner, forever —
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
