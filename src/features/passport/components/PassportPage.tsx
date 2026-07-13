import { useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { BadgeCheck, BookOpen, Flame, Shirt, Sparkles } from 'lucide-react'
import type { Product } from '@/features/products/types/product.types'
import type { ResolvedPdpContent } from '@/features/products/pdp/resolvePdpContent'
import { SectionEyebrow } from '@/shared/components/premium/SectionEyebrow'
import { buttonVariants } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import { usePassportReveal } from '../hooks/usePassportReveal'
import type { PassportView } from '../schemas/passport.schema'
import { ForgeSerialPlate } from './ForgeSerialPlate'
import { PassportOriginMap } from './PassportOriginMap'

export interface PassportPageProps {
  variant: 'owner' | 'public'
  view: PassportView
  product: Product | null
  content: ResolvedPdpContent | null
  hasStoryBook: boolean
  claimedDate: string | null
}

/**
 * The passport itself. `owner` renders the full dossier; `public` renders the
 * authenticity view (product + serial + "Forged by") for anyone else who
 * scans an already-claimed code.
 */
export function PassportPage({
  variant,
  view,
  product,
  content,
  hasStoryBook,
  claimedDate,
}: PassportPageProps) {
  const scopeRef = useRef<HTMLDivElement>(null)
  usePassportReveal(scopeRef)

  const heroImage = resolveHeroImage(view, product)
  const isOwner = variant === 'owner'

  return (
    <div ref={scopeRef} className="bg-[var(--color-bg)]">
      {/* Identity plate ------------------------------------------------- */}
      <section className="relative overflow-hidden px-6 pb-16 pt-14 sm:pt-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--color-highlight)_14%,transparent)_0%,transparent_70%)]"
        />
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
        <OwnerDossier
          view={view}
          product={product}
          content={content}
          hasStoryBook={hasStoryBook}
        />
      )}
    </div>
  )
}

/* ----------------------------------------------------------------------- */

function OwnerDossier({
  view,
  product,
  content,
  hasStoryBook,
}: {
  view: PassportView
  product: Product | null
  content: ResolvedPdpContent | null
  hasStoryBook: boolean
}) {
  const care = content?.care.length ? content.care : (product?.careInstructions ?? [])
  const details = content?.designDetails.length
    ? content.designDetails
    : (product?.designDetails ?? [])
  const story = content?.storyBody || product?.storytelling || ''

  return (
    <div className="mx-auto max-w-3xl space-y-16 px-6 pb-24">
      {/* Material dossier */}
      {product || content ? (
        <section data-pp-reveal>
          <SectionHeading icon={<Shirt aria-hidden="true" className="h-4 w-4" />}>
            Material dossier
          </SectionHeading>
          <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {product?.fabric ? <Stat term="Fabric" detail={product.fabric} /> : null}
            {product?.gsm ? <Stat term="Weight" detail={product.gsm} /> : null}
            {product?.fit ? <Stat term="Fit" detail={product.fit} /> : null}
          </dl>
          {content?.materialNote ? (
            <p className="mt-5 text-sm leading-relaxed text-[var(--color-text-muted)]">
              {content.materialNote}
            </p>
          ) : null}
          {content?.materialMacro ? (
            <div className="mt-6 overflow-hidden rounded-xl border border-[var(--color-line)]">
              <img
                src={content.materialMacro}
                alt={`${view.productName} fabric macro`}
                width={1200}
                height={800}
                loading="lazy"
                decoding="async"
                className="h-auto w-full object-cover"
              />
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Care ritual */}
      {care.length > 0 ? (
        <section data-pp-reveal>
          <SectionHeading icon={<Flame aria-hidden="true" className="h-4 w-4" />}>
            Care ritual
          </SectionHeading>
          <ol className="mt-6 space-y-3">
            {care.map((step, i) => (
              <li key={step} className="flex gap-4 text-sm text-[var(--color-text-muted)]">
                <span className="anvl-heading text-[var(--color-highlight-bright)]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {/* Design details + story */}
      {details.length > 0 || story ? (
        <section data-pp-reveal>
          <SectionHeading icon={<Sparkles aria-hidden="true" className="h-4 w-4" />}>
            {content?.storyHeading || 'Forged details'}
          </SectionHeading>
          {story ? (
            <p className="mt-6 text-sm leading-relaxed text-[var(--color-text-muted)]">{story}</p>
          ) : null}
          {details.length > 0 ? (
            <ul className="mt-5 space-y-2 text-sm text-[var(--color-text-muted)]">
              {details.map((d) => (
                <li key={d} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-px w-4 shrink-0 bg-[var(--color-highlight)]"
                  />
                  {d}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {/* Story chapter */}
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
              className={cn(buttonVariants({ variant: 'secondary', size: 'md' }), 'no-underline')}
            >
              Read the chapter
            </Link>
          </div>
        </section>
      ) : null}

      {/* Origin */}
      <section data-pp-reveal>
        <SectionHeading icon={<BadgeCheck aria-hidden="true" className="h-4 w-4" />}>
          Origin
        </SectionHeading>
        <div className="mt-6">
          <PassportOriginMap />
        </div>
      </section>

      {/* Authenticity footer */}
      <section
        data-pp-reveal
        className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-8 py-6 text-center"
      >
        <p className="anvl-micro text-[var(--color-text-muted)]">
          Token-verified · Forge number {view.serialNumber} of {view.editionTotal}
        </p>
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          This passport is bound to its owner&apos;s account and cannot be claimed again.
        </p>
      </section>
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
): { src: string; alt: string } | null {
  if (!product) return null
  if (view.claimedColor) {
    const byColor = product.shop?.imagesByColorName?.[view.claimedColor]
    if (byColor?.length) return byColor[0]
  }
  return product.images[0] ?? null
}

function Stat({ term, detail }: { term: string; detail: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
      <dt className="anvl-micro text-[var(--color-text-muted)]">{term}</dt>
      <dd className="mt-1 text-sm font-semibold text-[var(--color-text)]">{detail}</dd>
    </div>
  )
}

function SectionHeading({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <h2 className="anvl-heading inline-flex items-center gap-3 text-2xl text-[var(--color-heading)]">
      <span className="text-[var(--color-highlight-bright)]">{icon}</span>
      {children}
    </h2>
  )
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-1.5 text-xs">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className="font-semibold text-[var(--color-text)]">{value}</span>
    </span>
  )
}
