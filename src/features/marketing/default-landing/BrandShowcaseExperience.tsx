import { useRef } from 'react'
import type { LandingPageCmsContent } from '@/features/cms/landing/landingPageCms.types'
import type { Product } from '@/features/products/types/product.types'
import { pickFeaturedProducts } from '@/features/marketing/act-presets/productShowcase/oathProductUtils'
import { AnvlStacked, AnvlWordmark } from '@/shared/assets/brand'
import { BRAND } from '@/shared/constants/brand'
import { GrainOverlay } from '@/shared/components/layout/GrainOverlay'
import { Container } from '@/shared/components/ui/Container'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import { cn } from '@/shared/lib/cn'
import { AnimatedSection } from './AnimatedSection'
import { AmbientEmblemField } from './ParallaxLayer'
import { BRAND_AMBIENT_EMBLEMS, BRAND_EMBLEM_ASSETS } from './brandShowcaseAssets'
import { CinematicHero } from './CinematicHero'
import { ProductShowcaseCard } from './ProductShowcaseCard'
import { useBrandShowcaseTimeline } from './useBrandShowcaseTimeline'

export type BrandShowcaseExperienceProps = {
  landing: LandingPageCmsContent
  products: Product[]
}

function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean)
}

function stripActPrefix(label: string): string {
  return label.replace(/^Act\s+[IVX]+ —\s*/i, '')
}

function HeroBeatContent({ landing }: { landing: LandingPageCmsContent }) {
  return (
    <div className="mx-auto w-full max-w-2xl text-center lg:max-w-[42rem]">
      <div
        data-brand-hero-copy
        data-brand-hero-stacked
        className="mx-auto mb-6 flex justify-center md:mb-8"
      >
        <AnvlStacked className="h-auto w-[min(58vw,11.5rem)] text-[var(--color-heading)] sm:w-[min(52vw,13rem)] md:w-[min(42vw,15rem)]" />
      </div>
      <p
        data-brand-hero-copy
        className="text-[length:var(--act-eyebrow-size,0.72rem)] uppercase tracking-[0.32em] text-[var(--color-muted)]"
      >
        {landing.hero.badgeText || landing.hero.actLabel || BRAND.name}
      </p>
      <h1
        data-brand-hero-copy
        className="mt-4 font-display text-[clamp(2.75rem,min(10vw,8cqi),6.25rem)] uppercase leading-[0.86] tracking-tight text-balance"
      >
        {landing.hero.title}
      </h1>
      <p
        data-brand-hero-copy
        className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[var(--color-muted)] md:mt-6 md:text-lg"
      >
        {landing.hero.subtitle}
      </p>
      <div
        data-brand-hero-copy
        className="mt-8 flex flex-wrap items-center justify-center gap-3 md:mt-10"
      >
        <SafeLink
          href={landing.hero.primaryCta.href}
          className="inline-flex items-center bg-[var(--color-fg)] px-6 py-3 text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-bg)] transition-opacity hover:opacity-90"
        >
          {landing.hero.primaryCta.label}
        </SafeLink>
        <SafeLink
          href={landing.hero.secondaryCta.href}
          className="inline-flex items-center border border-[var(--color-line)] px-6 py-3 text-xs uppercase tracking-[0.22em] transition-colors hover:border-[var(--color-fg)]"
        >
          {landing.hero.secondaryCta.label}
        </SafeLink>
      </div>
    </div>
  )
}

function ManifestoBeatContent({
  landing,
  manifestoWords,
  tenets,
}: {
  landing: LandingPageCmsContent
  manifestoWords: string[]
  tenets: LandingPageCmsContent['manifesto']['tenets']
}) {
  return (
    <div data-brand-manifesto className="mx-auto max-w-[var(--anvl-content-max)] text-center">
      <p className="text-[length:var(--act-eyebrow-size,0.72rem)] uppercase tracking-[0.28em] text-[var(--color-muted)]">
        {stripActPrefix(landing.manifesto.actLabel)}
      </p>
      <h2
        aria-label={landing.manifesto.heading}
        className="mt-5 font-display text-[clamp(2rem,min(6vw,5cqi),4rem)] uppercase leading-[0.92]"
      >
        {manifestoWords.map((word, i) => (
          <span key={`${word}-${i}`} className="inline-block overflow-hidden px-[0.12em]">
            <span data-brand-word className="inline-block will-change-transform">
              {word}
            </span>
          </span>
        ))}
      </h2>
      <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-[var(--color-muted)] md:text-base">
        {landing.manifesto.intro}
      </p>
      <ul className="mx-auto mt-10 max-w-xl space-y-6 md:mt-12 md:space-y-8">
        {tenets.map((tenet, i) => (
          <li
            key={tenet.id}
            data-brand-tenet
            className="flex flex-col items-center gap-2 text-center"
          >
            <span className="font-display text-xl tabular-nums text-[var(--color-accent)]">
              {String(i + 1).padStart(2, '0')}
            </span>
            <p className="font-display text-[clamp(1.15rem,2.8vw,1.65rem)] uppercase leading-snug">
              {tenet.text}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ProductsBeatContent({
  landing,
  featured,
  compact = false,
}: {
  landing: LandingPageCmsContent
  featured: Product[]
  /** Pinned beat: fit three cards in viewport without internal scroll. */
  compact?: boolean
}) {
  if (featured.length === 0) return null

  return (
    <div
      data-brand-products
      className={cn(
        'mx-auto flex w-full flex-col items-center text-center',
        compact
          ? 'h-full min-h-0 max-w-5xl justify-center lg:max-w-6xl'
          : 'max-w-4xl justify-center',
      )}
    >
      <header
        className={cn(
          'w-full max-w-xl shrink-0',
          compact ? 'mb-2 sm:mb-3' : 'mb-5 md:mb-6',
        )}
      >
        <p className="text-[length:var(--act-eyebrow-size,0.72rem)] uppercase tracking-[0.28em] text-[var(--color-muted)]">
          {stripActPrefix(landing.pieces.actLabel)}
        </p>
        <h2
          className={cn(
            'mt-1.5 font-display uppercase leading-[0.9] sm:mt-2',
            compact
              ? 'text-[clamp(1.2rem,min(4.2vw,3.8cqi),2.35rem)]'
              : 'mt-3 text-[clamp(1.75rem,min(5.5vw,4.5cqi),3rem)]',
          )}
        >
          {landing.pieces.headingLineOne}{' '}
          <span className="text-[var(--color-muted)]">{landing.pieces.headingLineTwo}</span>
        </h2>
      </header>
      <div
        data-brand-product-grid
        className={cn(
          'grid w-full min-h-0 [perspective:1200px]',
          compact
            ? 'flex-1 auto-rows-fr grid-cols-1 items-stretch gap-2 overflow-hidden sm:grid-cols-3 sm:gap-2.5 md:gap-3'
            : 'mx-auto grid-cols-1 gap-2 min-[390px]:gap-2.5 sm:max-w-3xl sm:grid-cols-3',
        )}
      >
        {featured.map((product, i) => (
          <ProductShowcaseCard key={product.id} product={product} index={i} strip={compact} />
        ))}
      </div>
    </div>
  )
}

function ClosingBeatContent({ landing }: { landing: LandingPageCmsContent }) {
  const closingHeadlineWords = splitWords('Enter the forge')

  return (
    <div
      data-brand-closing-root
      className="mx-auto flex w-full max-w-3xl flex-col items-center text-center"
    >
      <div
        data-brand-closing-wordmark
        className="mx-auto mb-6 w-full max-w-[min(96vw,42rem)] px-2 text-[var(--color-heading)] will-change-[transform,opacity,filter] md:mb-8"
      >
        <AnvlWordmark className="mx-auto block h-auto w-full" aria-label={BRAND.name} />
      </div>
      <img
        data-brand-closing-emblem
        data-brand-close-emblem
        src={BRAND_EMBLEM_ASSETS.oath}
        alt=""
        className="mx-auto mb-8 h-auto w-[min(68vw,clamp(200px,22cqi,320px))] drop-shadow-[0_0_100px_rgba(231,228,223,0.14)] will-change-[transform,opacity,filter] md:mb-10"
      />
      <div data-brand-closing-copy className="w-full text-center">
        <p
          data-brand-closing-eyebrow
          className="text-[length:var(--act-eyebrow-size,0.72rem)] uppercase tracking-[0.32em] text-[var(--color-muted)] will-change-[transform,opacity,filter]"
        >
          {BRAND.dropName}
        </p>
        <h2
          data-brand-closing-headline
          aria-label="Enter the forge"
          className="mt-4 font-display text-[clamp(2.25rem,min(7vw,5.5cqi),3.75rem)] uppercase leading-[0.88]"
        >
          {closingHeadlineWords.map((word, i) => (
            <span key={`${word}-${i}`} className="inline-block overflow-hidden px-[0.1em]">
              <span
                data-brand-closing-word
                className="inline-block will-change-[transform,opacity,filter]"
              >
                {word}
              </span>
            </span>
          ))}
        </h2>
        <p
          data-brand-closing-intro
          className="mt-5 text-sm leading-relaxed text-[var(--color-muted)] will-change-[transform,opacity,filter] md:text-base"
        >
          {landing.dropReveal.tagline}
        </p>
        <div
          data-brand-closing-actions
          className="mt-8 flex flex-wrap items-center justify-center gap-3 md:mt-10"
        >
          <SafeLink
            data-brand-closing-cta-shop
            href={landing.dropReveal.primaryCta.href}
            className="inline-flex items-center bg-[var(--color-fg)] px-6 py-3 text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-bg)] transition-opacity will-change-[transform,opacity,filter] hover:opacity-90"
          >
            {landing.dropReveal.primaryCta.label}
          </SafeLink>
          <SafeLink
            data-brand-closing-cta-enter
            href={landing.dropReveal.secondaryCta.href}
            className="inline-flex items-center border border-[var(--color-line)] px-6 py-3 text-xs uppercase tracking-[0.22em] transition-colors will-change-[transform,opacity,filter] hover:border-[var(--color-fg)]"
          >
            {landing.dropReveal.secondaryCta.label}
          </SafeLink>
        </div>
      </div>
    </div>
  )
}

/**
 * One continuous scroll canvas — warrior video background, pinned viewport beats,
 * film-timeline copy enter/exit. Reduced motion: static stacked layout.
 */
export function BrandShowcaseExperience({
  landing,
  products,
}: BrandShowcaseExperienceProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const featured = pickFeaturedProducts(products, undefined, 3)
  const tenets = landing.manifesto.tenets.filter((t) => t.isVisible)
  const manifestoWords = splitWords(landing.manifesto.heading)

  useBrandShowcaseTimeline(rootRef, {
    tenetCount: tenets.length,
    productCount: featured.length,
  })

  return (
    <div
      ref={rootRef}
      data-brand-showcase
      className="relative overflow-x-clip bg-[var(--color-bg)] text-[var(--color-fg)]"
    >
      <CinematicHero />

      <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden>
        <AmbientEmblemField layers={BRAND_AMBIENT_EMBLEMS} />
      </div>

      <div
        data-brand-fog
        className="pointer-events-none fixed inset-0 z-[2] bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,transparent_0%,rgba(0,0,0,0.65)_100%)] opacity-55"
        aria-hidden
      />
      <div
        data-brand-vignette
        className="pointer-events-none fixed inset-0 z-[2] bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.72)_100%)] opacity-42"
        aria-hidden
      />
      <div className="pointer-events-none fixed inset-0 z-[2]" aria-hidden>
        <GrainOverlay />
      </div>

      <section
        data-brand-stage
        aria-hidden={reducedMotion}
        className={cn(
          'relative z-10 hidden min-h-[100dvh] w-full md:block',
          reducedMotion && '!hidden',
        )}
      >
        <AnimatedSection
          beat="hero"
          interactive
          className="items-center pb-14 pt-20 opacity-100 sm:pb-16 sm:pt-24 md:pb-20 md:pt-28"
        >
          <Container className="w-full px-0">
            <HeroBeatContent landing={landing} />
          </Container>
        </AnimatedSection>

        <AnimatedSection beat="manifesto">
          <Container className="w-full px-0">
            <ManifestoBeatContent
              landing={landing}
              manifestoWords={manifestoWords}
              tenets={tenets}
            />
          </Container>
        </AnimatedSection>

        {featured.length > 0 ? (
          <AnimatedSection
            beat="products"
            className="items-stretch overflow-hidden py-5 sm:py-6 md:py-8"
          >
            <Container className="flex h-full min-h-0 w-full max-w-6xl items-center justify-center px-3 sm:px-4 md:px-6">
              <ProductsBeatContent landing={landing} featured={featured} compact />
            </Container>
          </AnimatedSection>
        ) : null}

        <AnimatedSection beat="closing" className="items-center pb-16 pt-16 md:pb-20 md:pt-20">
          <Container className="w-full px-0">
            <ClosingBeatContent landing={landing} />
          </Container>
        </AnimatedSection>
      </section>

      <div
        data-brand-reduced-stack
        aria-hidden={reducedMotion ? false : undefined}
        className={cn(
          'relative z-10 mx-auto w-full max-w-[var(--anvl-content-max)] px-4 py-12 md:hidden md:py-16',
          reducedMotion ? 'block' : 'block md:hidden',
        )}
      >
        <div
          data-brand-scroll-section
          className="flex min-h-[100dvh] flex-col justify-center py-10"
        >
          <HeroBeatContent landing={landing} />
        </div>
        <div data-brand-scroll-section className="py-14 md:py-20">
          <ManifestoBeatContent
            landing={landing}
            manifestoWords={manifestoWords}
            tenets={tenets}
          />
        </div>
        {featured.length > 0 ? (
          <div data-brand-scroll-section className="py-14 md:py-20">
            <ProductsBeatContent landing={landing} featured={featured} />
          </div>
        ) : null}
        <div
          data-brand-scroll-section
          className="flex min-h-[70dvh] flex-col justify-center py-14 md:py-20"
        >
          <ClosingBeatContent landing={landing} />
        </div>
      </div>
    </div>
  )
}
