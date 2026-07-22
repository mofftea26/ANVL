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
import { resolveSupportContent } from '@/features/cms/support/resolveSupportContent'
import { Container, Section } from '@/shared/components/ui'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import {
  DocFooterCta,
  DocHero,
  DOC_CTA_PRIMARY_CLASS,
  DOC_CTA_SECONDARY_CLASS,
  ProseBody,
  SizeDiagram,
  SizeTable,
  SIZE_MEASUREMENT_POINTS,
} from '@/features/support/components'
import type { SizeProductEntry } from '@/features/cms/support/supportContent.zod'
import { orderPerProduct, type ProductNameEntry } from '@/features/support/lib/resolveProductNames'

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
  const content = resolveSupportContent(previewDraft?.supportContent ?? supportContent)

  const perProduct = orderPerProduct<SizeProductEntry>(content.sizeGuide.perProduct, productNames)

  return (
    <>
      <DocHero eyebrow="Fit & sizing" title="Size guide" intro={content.sizeGuide.intro} />

      {content.sizeGuide.note.trim() ? (
        <Section>
          <Container className="max-w-3xl">
            <h2 className="anvl-heading text-2xl text-[var(--color-heading)] md:text-3xl">
              How to measure
            </h2>
            <hr className="anvl-highlight-rule mt-4 max-w-[6rem]" />
            <ProseBody body={content.sizeGuide.note} className="mt-5" />
          </Container>
        </Section>
      ) : null}

      <Section>
        <Container className="max-w-4xl">
          <h2 className="anvl-heading text-2xl text-[var(--color-heading)] md:text-3xl">
            Where we measure
          </h2>
          <hr className="anvl-highlight-rule mt-4 max-w-[6rem]" />
          <div className="mt-6 grid items-start gap-8 md:grid-cols-2">
            <SizeDiagram className="mx-auto" />
            {/* Textual companion — the diagram is never the only source. */}
            <dl className="space-y-3">
              {SIZE_MEASUREMENT_POINTS.map((point) => (
                <div key={point.key} className="flex items-baseline gap-3">
                  <dt className="anvl-display shrink-0 text-xs tracking-[0.18em] text-[var(--color-highlight-bright)]">
                    {point.letter}
                  </dt>
                  <dd className="text-sm text-[var(--color-text-muted)]">
                    <span className="font-medium text-[var(--color-text)]">{point.label}</span>
                    {' — '}
                    {point.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="mt-6 max-w-3xl text-xs text-[var(--color-text-muted)]">
            All measurements are in centimetres. Widths are half measurements, taken with the
            garment laid flat — double them for the full circumference.
          </p>
        </Container>
      </Section>

      {perProduct.length > 0 ? (
        <Section className="border-t border-[var(--color-line)] bg-[var(--color-surface)]">
          <Container className="max-w-4xl space-y-14">
            {perProduct.map(({ slug, name, entry }) => (
              <section key={slug} id={`size-${slug}`} className="scroll-mt-[var(--anvl-header-h)] space-y-5">
                <div>
                  <h2 className="anvl-heading text-2xl text-[var(--color-heading)] md:text-3xl">
                    {name}
                  </h2>
                  <hr className="anvl-highlight-rule mt-4 max-w-[6rem]" />
                </div>
                <SizeTable entry={entry} />
              </section>
            ))}
          </Container>
        </Section>
      ) : (
        <Section className="border-t border-[var(--color-line)] bg-[var(--color-surface)]">
          <Container className="max-w-3xl">
            <div className="rounded-xl border border-dashed border-[var(--color-line)] p-8 text-center">
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
          </Container>
        </Section>
      )}

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
