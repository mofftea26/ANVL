import { createFileRoute } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import { loadStorefrontProjection } from '@/features/cms/api/loadStorefrontProjection'
import { usePreviewDraft } from '@/features/cms/preview'
import { resolveSupportContent } from '@/features/cms/support/resolveSupportContent'
import {
  DocFooterCta,
  DocHero,
  DOC_CTA_PRIMARY_CLASS,
  DOC_CTA_SECONDARY_CLASS,
  FaqAccordion,
} from '@/features/support/components'
import { SafeLink } from '@/shared/components/ui/SafeLink'

export const Route = createFileRoute('/faq')({
  loader: async () => {
    const projection = await loadStorefrontProjection()
    return { supportContent: projection.supportContent }
  },
  head: () =>
    buildSeoMeta({
      title: 'FAQ | ANVL Athletics',
      description:
        'Frequently asked questions about sizing, shipping, care, and orders at ANVL Athletics.',
      path: '/faq',
    }),
  component: FaqPage,
})

function FaqPage() {
  const { supportContent } = Route.useLoaderData()
  const previewDraft = usePreviewDraft()
  const content = resolveSupportContent(previewDraft?.supportContent ?? supportContent)

  return (
    <>
      <DocHero eyebrow="Help & support" title="FAQ" intro={content.faq.intro} />
      <FaqAccordion items={content.faq.items} />
      <DocFooterCta message="Still need a hand? We answer fast.">
        <SafeLink href="/contact" className={DOC_CTA_PRIMARY_CLASS}>
          Contact us
        </SafeLink>
        <SafeLink href="/size-guide" className={DOC_CTA_SECONDARY_CLASS}>
          Size guide
        </SafeLink>
      </DocFooterCta>
    </>
  )
}
