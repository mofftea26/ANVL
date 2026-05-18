import type { ReactNode } from 'react'
import { lazy, Suspense, useMemo } from 'react'
import type { LandingAct } from '@/features/cms/landing/landingActs.types'
import {
  previewDropRevealFields,
  previewHeroFields,
  previewManifestoFields,
  previewMaterialsFields,
  previewPiecesFields,
  previewWaitlistFields,
} from '@/features/cms/landing/landingActPreviewOverlay'
import type { LandingPageCmsContent } from '@/features/cms/landing/landingPageCms.types'
import type { Product } from '@/features/products/types/product.types'
import { defaultLandingActSequence } from '@/features/drops/drops.actSequence'
import { publicLandingActsFromSequence } from '@/features/cms/landing/landingActs.normalize'
import { Container } from '@/shared/components/ui'
import { DropLoadingIndicator } from '@/shared/components/ui/DropLoadingIndicator'

const HeroForgeSequence = lazy(() =>
  import('@/features/marketing/components/HeroForgeSequence').then((m) => ({
    default: m.HeroForgeSequence,
  })),
)

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

function UnknownActNotice({
  nature,
  cmsPreview,
}: {
  nature: string
  cmsPreview?: boolean
}) {
  return (
    <section
      className="border-b border-[var(--color-line)] bg-[var(--color-bg)] py-10"
      aria-label={`Unsupported act: ${nature}`}
    >
      <Container>
        {cmsPreview ? (
          <div
            role="alert"
            className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-amber-50"
          >
            <p className="anvl-micro text-[10px] font-semibold uppercase tracking-[0.2em]">
              CMS preview — unsupported act
            </p>
            <p className="mt-2 text-sm text-amber-100/90">
              Type &quot;{nature}&quot; is not wired to a public section yet. The live site skips
              this row; fix the nature or disable the act before publishing.
            </p>
          </div>
        ) : (
          <p className="anvl-micro text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            Act type {nature} is not available on this build. The section is skipped.
          </p>
        )}
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
  /** When true, unknown act types show an explicit admin warning instead of the public notice. */
  cmsPreview?: boolean
  /**
   * Drop editor: merge each act row’s builder fields over the composed landing
   * slices so copy / CTAs refresh immediately (order still comes from `landing.landingActs`).
   */
  draftActs?: LandingAct[]
}

export function PublicLandingActs({
  landing,
  products,
  emblemSrc,
  cmsPreview,
  draftActs,
}: PublicLandingActsProps) {
  const rowById = useMemo(() => {
    if (!draftActs?.length) return null
    return new Map(draftActs.map((a) => [a.id, a]))
  }, [draftActs])

  function rowFor(actId: string): LandingAct | undefined {
    return rowById?.get(actId)
  }
  if (cmsPreview && landing.landingActs.length === 0) {
    return (
      <section
        className="border-b border-[var(--color-line)] bg-[var(--color-bg)] py-16"
        aria-label="Drop preview has no acts"
      >
        <Container>
          <p className="anvl-micro text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            CMS preview
          </p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--color-text)]">
            No landing acts yet. Open the <strong>Acts</strong> tab to add rows or sync copy — the
            live preview only reflects the acts builder, not the legacy slot sequence.
          </p>
        </Container>
      </section>
    )
  }

  const acts =
    landing.landingActs.length > 0
      ? [...landing.landingActs].sort((a, b) => a.sortOrder - b.sortOrder)
      : publicLandingActsFromSequence(defaultLandingActSequence())

  return (
    <>
      {acts.map((act) => {
        if (act.enabled === false) return null
        const row = rowFor(act.id)
        switch (act.nature) {
          case 'hero': {
            const hero = previewHeroFields(landing.hero, row)
            return wrapLazy(
              act.id,
              'Loading hero',
              <HeroForgeSequence
                badgeText={hero.badgeText}
                title={hero.title}
                subtitle={hero.subtitle}
                primaryCta={hero.primaryCta}
                secondaryCta={hero.secondaryCta}
                meta={landing.hero.meta}
                emblemSrc={emblemSrc}
              />,
            )
          }
          case 'manifesto':
          case 'storytelling': {
            const m = previewManifestoFields(
              landing.manifesto,
              row,
              act.nature === 'storytelling' ? 'storytelling' : 'manifesto',
            )
            return wrapLazy(
              act.id,
              'Loading manifesto',
              <OathStampSequence
                actLabel={m.actLabel}
                counterLabel={m.counterLabel}
                heading={m.heading}
                intro={m.intro}
                tenets={m.tenets}
                emblemSrc={emblemSrc}
              />,
            )
          }
          case 'dropReveal': {
            const d = previewDropRevealFields(landing.dropReveal, row)
            return wrapLazy(
              act.id,
              'Loading drop',
              <DropRevealSection
                products={products}
                actLabel={d.actLabel}
                counterLabel={d.counterLabel}
                words={d.words}
                tagline={d.tagline}
                stats={landing.dropReveal.stats}
                primaryCta={d.primaryCta}
                secondaryCta={d.secondaryCta}
                dropIcon={d.dropIcon}
              />,
            )
          }
          case 'productShowcase': {
            const p = previewPiecesFields(landing.pieces, row)
            return wrapLazy(
              act.id,
              'Loading pieces',
              <PiecesGrid
                products={products.slice(0, 6)}
                actLabel={p.actLabel}
                headingLineOne={p.headingLineOne}
                headingLineTwo={p.headingLineTwo}
                viewAllLabel={p.viewAllLabel}
                viewAllHref={p.viewAllHref}
                footerLeftText={p.footerLeftText}
                footerLinkLabel={p.footerLinkLabel}
                footerLinkHref={p.footerLinkHref}
              />,
            )
          }
          case 'materialShowcase': {
            const mat = previewMaterialsFields(landing.materials, row)
            return wrapLazy(
              act.id,
              'Loading materials',
              <MaterialsMarquee
                actLabel={mat.actLabel}
                counterSuffix={mat.counterSuffix}
                heading={mat.heading}
                intro={mat.intro}
                materials={mat.materials}
              />,
            )
          }
          case 'newsletterWaitlist':
            return wrapLazy(
              act.id,
              'Loading waitlist',
              <WaitlistSection
                content={previewWaitlistFields(landing.waitlist, row)}
                products={products}
                emblemSrc={emblemSrc}
              />,
            )
          default:
            return (
              <UnknownActNotice key={act.id} nature={act.nature} cmsPreview={cmsPreview} />
            )
        }
      })}
    </>
  )
}
