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
  resolveCareLegend,
  resolveSupportContent,
} from '@/features/cms/support/resolveSupportContent'
import {
  CareLines,
  CareSymbolLegend,
  CARE_SYMBOLS_SECTION_ID,
  DocFooterCta,
  DOC_CTA_PRIMARY_CLASS,
  DOC_CTA_SECONDARY_CLASS,
  GuideSectionHeader,
  SupportSectionList,
} from '@/features/support/components'
import { PageMasthead } from '@/shared/components/premium/PageMasthead'
import { AccordionDisclosure, Container, Section } from '@/shared/components/ui'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import type { CareProductEntry } from '@/features/cms/support/supportContent.zod'
import {
  formatPieceCount,
  orderPerProduct,
  type ProductNameEntry,
} from '@/features/support/lib/resolveProductNames'

export const Route = createFileRoute('/care-guide')({
  loader: async () => {
    const [siteSeo, seoDoc, projection, products] = await Promise.all([
      runtimeClients.seo.getSiteSeo(),
      runtimeClients.seo.getSeoByPath('/care-guide'),
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
            title: 'Care Guide | ANVL Athletics',
            description:
              'How to wash, dry, and care for ANVL premium gymwear so every piece lasts — plus every garment care symbol and what it means.',
            canonicalPath: '/care-guide',
          },
          fb,
        ),
        fb,
      )
    }
    return buildSeoHeadForSiteStaticPath('/care-guide', doc, site)
  },
  component: CareGuidePage,
})

function CareGuidePage() {
  const { supportContent, productNames } = Route.useLoaderData()
  const previewDraft = usePreviewDraft()
  const config = previewDraft?.supportContent ?? supportContent
  const content = resolveSupportContent(config)
  const legend = resolveCareLegend(config)

  const perProduct = orderPerProduct<CareProductEntry>(content.careGuide.perProduct, productNames)

  return (
    <>
      <PageMasthead
        eyebrow="Care & longevity"
        title="Care guide"
        intro={content.careGuide.intro}
        updatedAt={content.careGuide.updatedAt}
      />
      <SupportSectionList sections={content.careGuide.sections} />

      <Section>
        <Container className="max-w-5xl">
          <div id={CARE_SYMBOLS_SECTION_ID} className="scroll-mt-[var(--anvl-header-h)]">
            <GuideSectionHeader title={legend.heading} intro={legend.intro} />
            <CareSymbolLegend legend={legend} className="mt-8" />
          </div>
        </Container>
      </Section>

      <Section className="border-t border-[var(--color-line)] bg-[var(--color-surface)]">
        <Container className="max-w-3xl">
          {/* The Section above already carries the border-t. */}
          <GuideSectionHeader
            title="Care by piece"
            meta={perProduct.length > 0 ? formatPieceCount(perProduct.length) : undefined}
            rule={false}
          />
          {perProduct.length > 0 ? (
            <div className="mt-8 space-y-3">
              {perProduct.map(({ slug, name, entry }, index) => (
                <div key={slug} id={`care-${slug}`} className="scroll-mt-[var(--anvl-header-h)]">
                  <AccordionDisclosure title={name} defaultOpen={index === 0}>
                    <CareLines entry={entry} />
                  </AccordionDisclosure>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-dashed border-[var(--color-line)] p-8 text-center">
              <p className="anvl-heading text-xl text-[var(--color-heading)]">
                Per-piece care notes coming soon
              </p>
              <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                Fabric-specific care notes are being written for each piece. Until then, the
                washing and drying rules above apply across the drop — ask us if a fabric needs
                something different.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <SafeLink href="/contact" className={DOC_CTA_SECONDARY_CLASS}>
                  Ask about care
                </SafeLink>
              </div>
            </div>
          )}
        </Container>
      </Section>

      <DocFooterCta message="Match care to fabric before you buy — check the size guide next.">
        <SafeLink href="/size-guide" className={DOC_CTA_PRIMARY_CLASS}>
          Size guide
        </SafeLink>
        <SafeLink href="/shop" className={DOC_CTA_SECONDARY_CLASS}>
          Shop
        </SafeLink>
      </DocFooterCta>
    </>
  )
}
