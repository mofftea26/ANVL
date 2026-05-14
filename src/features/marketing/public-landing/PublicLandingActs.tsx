import type { ReactNode } from 'react'
import { lazy, Suspense } from 'react'
import type { LandingPageCmsContent } from '@/features/admin/landing-cms/landingCms.types'
import type { Product } from '@/features/products/types/product.types'
import { defaultLandingActSequence } from '@/features/admin/drops/drops.actSequence'
import { publicLandingActsFromSequence } from '@/features/admin/drops/acts/landingActs.normalize'
import { HeroForgeSequence } from '@/features/marketing/components/HeroForgeSequence'
import { Container } from '@/shared/components/ui'
import { DropLoadingIndicator } from '@/shared/components/ui/DropLoadingIndicator'

const OathStampSequence = lazy(() =>
  import('@/features/marketing/components/OathStampSequence').then((m) => ({
    default: m.OathStampSequence,
  })),
)

const DropRevealSection = lazy(() =>
  import('@/features/marketing/components/DropRevealSection').then((m) => ({
    default: m.DropRevealSection,
  })),
)

const PiecesGrid = lazy(() =>
  import('@/features/marketing/components/PiecesGrid').then((m) => ({
    default: m.PiecesGrid,
  })),
)

const MaterialsMarquee = lazy(() =>
  import('@/features/marketing/components/MaterialsMarquee').then((m) => ({
    default: m.MaterialsMarquee,
  })),
)

const WaitlistSection = lazy(() =>
  import('@/features/marketing/components/WaitlistSection').then((m) => ({
    default: m.WaitlistSection,
  })),
)

function SectionFallback({ label }: { label: string }) {
  return (
    <section className="anvl-screen-section flex items-center justify-center border-b border-[var(--color-line)] bg-[var(--color-bg)]">
      <Container>
        <DropLoadingIndicator label={label} />
      </Container>
    </section>
  )
}

function UnknownActNotice({ nature }: { nature: string }) {
  return (
    <section
      className="border-b border-[var(--color-line)] bg-[var(--color-bg)] py-10"
      aria-label={`Unsupported act: ${nature}`}
    >
      <Container>
        <p className="anvl-micro text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
          Act type {nature} is not available on this build. The section is
          skipped.
        </p>
      </Container>
    </section>
  )
}

function wrapLazy(key: string, label: string, node: ReactNode) {
  return (
    <Suspense key={key} fallback={<SectionFallback label={label} />}>
      {node}
    </Suspense>
  )
}

export type PublicLandingActsProps = {
  landing: LandingPageCmsContent
  products: Product[]
  emblemSrc?: string
}

export function PublicLandingActs({
  landing,
  products,
  emblemSrc,
}: PublicLandingActsProps) {
  const acts =
    landing.landingActs.length > 0
      ? [...landing.landingActs].sort((a, b) => a.sortOrder - b.sortOrder)
      : publicLandingActsFromSequence(defaultLandingActSequence())

  return (
    <>
      {acts.map((act) => {
        if (act.enabled === false) return null
        switch (act.nature) {
          case 'hero':
            return (
              <HeroForgeSequence
                key={act.id}
                badgeText={landing.hero.badgeText}
                title={landing.hero.title}
                subtitle={landing.hero.subtitle}
                primaryCta={landing.hero.primaryCta}
                secondaryCta={landing.hero.secondaryCta}
                meta={landing.hero.meta}
                emblemSrc={emblemSrc}
              />
            )
          case 'manifesto':
          case 'storytelling':
            return wrapLazy(
              act.id,
              'Loading manifesto',
              <OathStampSequence
                actLabel={landing.manifesto.actLabel}
                counterLabel={landing.manifesto.counterLabel}
                heading={landing.manifesto.heading}
                intro={landing.manifesto.intro}
                tenets={landing.manifesto.tenets}
                emblemSrc={emblemSrc}
              />,
            )
          case 'dropReveal':
            return wrapLazy(
              act.id,
              'Loading drop',
              <DropRevealSection
                products={products}
                actLabel={landing.dropReveal.actLabel}
                counterLabel={landing.dropReveal.counterLabel}
                words={landing.dropReveal.words}
                tagline={landing.dropReveal.tagline}
                stats={landing.dropReveal.stats}
                primaryCta={landing.dropReveal.primaryCta}
                secondaryCta={landing.dropReveal.secondaryCta}
                dropIcon={landing.dropReveal.dropIcon}
              />,
            )
          case 'productShowcase':
            return wrapLazy(
              act.id,
              'Loading pieces',
              <PiecesGrid
                products={products.slice(0, 6)}
                actLabel={landing.pieces.actLabel}
                headingLineOne={landing.pieces.headingLineOne}
                headingLineTwo={landing.pieces.headingLineTwo}
                viewAllLabel={landing.pieces.viewAllLabel}
                viewAllHref={landing.pieces.viewAllHref}
                footerLeftText={landing.pieces.footerLeftText}
                footerLinkLabel={landing.pieces.footerLinkLabel}
                footerLinkHref={landing.pieces.footerLinkHref}
              />,
            )
          case 'materialShowcase':
            return wrapLazy(
              act.id,
              'Loading materials',
              <MaterialsMarquee
                actLabel={landing.materials.actLabel}
                counterSuffix={landing.materials.counterSuffix}
                heading={landing.materials.heading}
                intro={landing.materials.intro}
                materials={landing.materials.materials}
              />,
            )
          case 'newsletterWaitlist':
            return wrapLazy(
              act.id,
              'Loading waitlist',
              <WaitlistSection
                content={landing.waitlist}
                products={products}
                emblemSrc={emblemSrc}
              />,
            )
          default:
            return <UnknownActNotice key={act.id} nature={act.nature} />
        }
      })}
    </>
  )
}
