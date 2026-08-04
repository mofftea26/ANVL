import { createFileRoute } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import { loadStorefrontProjection } from '@/features/cms/api/loadStorefrontProjection'
import { usePreviewDraft } from '@/features/cms/preview'
import { resolveSupportContent } from '@/features/cms/support/resolveSupportContent'
import {
  DocFooterCta,
  DOC_CTA_PRIMARY_CLASS,
  DOC_CTA_SECONDARY_CLASS,
  SupportSectionList,
} from '@/features/support/components'
import { PageMasthead } from '@/shared/components/premium/PageMasthead'
import { SafeLink } from '@/shared/components/ui/SafeLink'

export const Route = createFileRoute('/returns')({
  loader: async () => {
    const projection = await loadStorefrontProjection()
    return { supportContent: projection.supportContent }
  },
  head: () =>
    buildSeoMeta({
      title: 'Returns | ANVL Athletics',
      description: 'Returns and exchanges policy for ANVL Athletics — unworn items within 14 days.',
      path: '/returns',
    }),
  component: ReturnsPage,
})

function ReturnsPage() {
  const { supportContent } = Route.useLoaderData()
  const previewDraft = usePreviewDraft()
  const content = resolveSupportContent(previewDraft?.supportContent ?? supportContent)

  return (
    <>
      <PageMasthead eyebrow="Help & support" title="Returns" intro={content.returns.intro} />
      <SupportSectionList sections={content.returns.sections} />
      <DocFooterCta message="Need to start a return or check delivery? We can help.">
        <SafeLink href="/contact" className={DOC_CTA_PRIMARY_CLASS}>
          Contact us
        </SafeLink>
        <SafeLink href="/shipping" className={DOC_CTA_SECONDARY_CLASS}>
          Shipping
        </SafeLink>
      </DocFooterCta>
    </>
  )
}
