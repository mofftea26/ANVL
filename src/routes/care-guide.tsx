import { createFileRoute } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import { runtimeClients } from '@/app/config/runtime'
import { loadStorefrontProjection } from '@/features/cms/api/loadStorefrontProjection'
import { usePreviewDraft } from '@/features/cms/preview'
import { resolveSupportContent } from '@/features/cms/support/resolveSupportContent'
import {
  CareLines,
  DocFooterCta,
  DocHero,
  DOC_CTA_PRIMARY_CLASS,
  DOC_CTA_SECONDARY_CLASS,
  SupportSectionList,
} from '@/features/support/components'
import { AccordionDisclosure } from '@/shared/components/ui/AccordionDisclosure'
import { Container, Section } from '@/shared/components/ui'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import type { CareProductEntry } from '@/features/cms/support/supportContent.zod'
import { orderPerProduct, type ProductNameEntry } from '@/features/support/lib/resolveProductNames'

export const Route = createFileRoute('/care-guide')({
  loader: async () => {
    const [projection, products] = await Promise.all([
      loadStorefrontProjection(),
      runtimeClients.commerce.getProducts(),
    ])
    return {
      supportContent: projection.supportContent,
      productNames: products.map((p): ProductNameEntry => ({ slug: p.slug, name: p.name })),
    }
  },
  head: () =>
    buildSeoMeta({
      title: 'Care Guide | ANVL Athletics',
      description: 'How to wash, dry, and care for ANVL premium gymwear so every piece lasts.',
      path: '/care-guide',
    }),
  component: CareGuidePage,
})

function CareGuidePage() {
  const { supportContent, productNames } = Route.useLoaderData()
  const previewDraft = usePreviewDraft()
  const content = resolveSupportContent(previewDraft?.supportContent ?? supportContent)

  const perProduct = orderPerProduct<CareProductEntry>(content.careGuide.perProduct, productNames)

  return (
    <>
      <DocHero eyebrow="Care & longevity" title="Care guide" intro={content.careGuide.intro} />
      <SupportSectionList sections={content.careGuide.sections} />

      {perProduct.length > 0 ? (
        <Section className="border-t border-[var(--color-line)] bg-[var(--color-surface)]">
          <Container className="max-w-3xl space-y-6">
            <div>
              <h2 className="anvl-heading text-2xl text-[var(--color-heading)] md:text-3xl">
                Care by piece
              </h2>
              <hr className="anvl-highlight-rule mt-4 max-w-[6rem]" />
            </div>
            <div className="space-y-3">
              {perProduct.map(({ slug, name, entry }) => (
                <AccordionDisclosure key={slug} title={name}>
                  <CareLines entry={entry} />
                </AccordionDisclosure>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

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
