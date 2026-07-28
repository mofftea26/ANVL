import { createFileRoute } from '@tanstack/react-router'
import { BRAND } from '@/shared/constants/brand'
import {
  buildSeoHeadForSiteStaticPath,
  buildSeoMetaFromCmsSource,
  seoContentToMetaSource,
} from '@/features/cms/seoMeta'
import { runtimeClients } from '@/app/config/runtime'
import { loadStorefrontProjection } from '@/features/cms/api/loadStorefrontProjection'
import { usePreviewDraft } from '@/features/cms/preview'
import {
  resolveMeasurePoints,
  resolveSupportContent,
} from '@/features/cms/support/resolveSupportContent'
import { AccordionDisclosure, Container, Section } from '@/shared/components/ui'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import {
  DocFooterCta,
  DocHero,
  DOC_CTA_PRIMARY_CLASS,
  DOC_CTA_SECONDARY_CLASS,
  GuideSectionHeader,
  MeasureExplorer,
  SizeTable,
} from '@/features/support/components'
import type { SizeProductEntry } from '@/features/cms/support/supportContent.zod'
import { resolveGarmentTypeKeys } from '@/features/support/lib/garmentTypes'
import {
  formatPieceCount,
  orderPerProduct,
  type ProductNameEntry,
} from '@/features/support/lib/resolveProductNames'

const MEASURE_HEADING_ID = 'size-guide-measure'

export const Route = createFileRoute('/size-guide')({
  loader: async () => {
    const [siteSeo, seoDoc, projection, products] = await Promise.all([
      runtimeClients.seo.getSiteSeo(),
      runtimeClients.seo.getSeoByPath('/size-guide'),
      loadStorefrontProjection(),
      runtimeClients.commerce.getProducts(),
    ])
    return {
      siteSeo,
      seoDoc,
      supportContent: projection.supportContent,
      productNames: products.map((p): ProductNameEntry => ({ slug: p.slug, name: p.name })),
    }
  },
  head: ({ loaderData }) => {
    const site = loaderData?.siteSeo
    const doc = loaderData?.seoDoc
    const fb = { defaultShareImage: `${BRAND.canonicalBaseUrl}/brand/og-default.png` }
    if (!site || !doc) {
      return buildSeoMetaFromCmsSource(
        seoContentToMetaSource(
          {
            title: 'Size Guide | ANVL Athletics',
            description:
              'ANVL sizing for Lebanon & EU retail: body measurements in cm, EU top sizes 44–52, and per-piece measurement charts.',
            canonicalPath: '/size-guide',
          },
          fb,
        ),
        fb,
      )
    }
    return buildSeoHeadForSiteStaticPath('/size-guide', doc, site)
  },
  component: SizeGuidePage,
})

function SizeGuidePage() {
  const { supportContent, productNames } = Route.useLoaderData()
  const previewDraft = usePreviewDraft()
  const config = previewDraft?.supportContent ?? supportContent
  const content = resolveSupportContent(config)

  const perProduct = orderPerProduct<SizeProductEntry>(content.sizeGuide.perProduct, productNames)

  // One resolved point set per garment type the catalogue actually uses. Never
  // empty — the tee is always offered — so `measures[0]` carries the section's
  // heading, intro and footnote (all three are section-level, not per type).
  const measures = resolveGarmentTypeKeys(content.sizeGuide.perProduct).map((key) =>
    resolveMeasurePoints(config, key),
  )
  const measure = measures[0]

  return (
    <>
      <DocHero
        eyebrow="Fit & sizing"
        title="Size guide"
        intro={content.sizeGuide.intro}
        updatedAt={content.sizeGuide.updatedAt}
      />

      {content.sizeGuide.note.trim() ? (
        <Section>
          <Container className="max-w-3xl">
            {/* Directly under DocHero's own border-b — no second rule here. */}
            <GuideSectionHeader title="How to measure" intro={content.sizeGuide.note} rule={false} />
          </Container>
        </Section>
      ) : null}

      {measure ? (
        <Section>
          <Container className="max-w-5xl">
            <GuideSectionHeader
              title={measure.heading}
              titleId={MEASURE_HEADING_ID}
              meta="centimetres · laid flat"
              intro={measure.intro}
            />
            <MeasureExplorer
              measures={measures}
              labelledBy={MEASURE_HEADING_ID}
              className="mt-8"
            />
          </Container>
        </Section>
      ) : null}

      <Section className="border-t border-[var(--color-line)] bg-[var(--color-surface)]">
        <Container className="max-w-4xl">
          {/* The Section above already carries the border-t. */}
          <GuideSectionHeader
            title="Measurements by piece"
            meta={perProduct.length > 0 ? formatPieceCount(perProduct.length) : undefined}
            rule={false}
          />
          {perProduct.length > 0 ? (
            <div className="mt-8 space-y-3">
              {perProduct.map(({ slug, name, entry }, index) => (
                <div key={slug} id={`size-${slug}`} className="scroll-mt-[var(--anvl-header-h)]">
                  <AccordionDisclosure title={name} defaultOpen={index === 0}>
                    <SizeTable entry={entry} />
                  </AccordionDisclosure>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-dashed border-[var(--color-line)] p-8 text-center">
              <p className="anvl-heading text-xl text-[var(--color-heading)]">
                Per-piece measurements coming soon
              </p>
              <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                Detailed measurement charts are being finalised for each piece. In the meantime, use
                the how-to-measure guidance above and reach out if you need a hand choosing a size.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <SafeLink href="/contact" className={DOC_CTA_SECONDARY_CLASS}>
                  Ask about fit
                </SafeLink>
              </div>
            </div>
          )}
        </Container>
      </Section>

      <DocFooterCta message="Ready to match size to fabric? Browse Drop 01.">
        <SafeLink href="/shop" className={DOC_CTA_PRIMARY_CLASS}>
          Shop
        </SafeLink>
        <SafeLink href="/care-guide" className={DOC_CTA_SECONDARY_CLASS}>
          Care guide
        </SafeLink>
      </DocFooterCta>
    </>
  )
}
