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

export const Route = createFileRoute('/shipping')({
  loader: async () => {
    const projection = await loadStorefrontProjection()
    return { supportContent: projection.supportContent }
  },
  head: () =>
    buildSeoMeta({
      title: 'Shipping | ANVL Athletics',
      description:
        'Where ANVL Athletics ships, how long delivery takes, and how tracking works — confirmed at checkout.',
      path: '/shipping',
    }),
  component: ShippingPage,
})

function ShippingPage() {
  const { supportContent } = Route.useLoaderData()
  const previewDraft = usePreviewDraft()
  const content = resolveSupportContent(previewDraft?.supportContent ?? supportContent)

  return (
    <>
      <PageMasthead eyebrow="Help & support" title="Shipping" intro={content.shipping.intro} />
      <SupportSectionList sections={content.shipping.sections} />
      <DocFooterCta message="Ready to order? Browse Drop 01 — delivery is confirmed before you pay.">
        <SafeLink href="/shop" className={DOC_CTA_PRIMARY_CLASS}>
          Shop
        </SafeLink>
        <SafeLink href="/returns" className={DOC_CTA_SECONDARY_CLASS}>
          Returns
        </SafeLink>
      </DocFooterCta>
    </>
  )
}
