import { createFileRoute } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import { loadStorefrontProjection } from '@/features/cms/api/loadStorefrontProjection'
import { usePreviewDraft } from '@/features/cms/preview'
import { resolveSupportContent } from '@/features/cms/support/resolveSupportContent'
import {
  ContactPanel,
  DocFooterCta,
  DOC_CTA_PRIMARY_CLASS,
  DOC_CTA_SECONDARY_CLASS,
} from '@/features/support/components'
import { PageMasthead } from '@/shared/components/premium/PageMasthead'
import { SafeLink } from '@/shared/components/ui/SafeLink'

export const Route = createFileRoute('/contact')({
  loader: async () => {
    const projection = await loadStorefrontProjection()
    return { supportContent: projection.supportContent }
  },
  head: () =>
    buildSeoMeta({
      title: 'Contact | ANVL Athletics',
      description: 'Contact ANVL Athletics for support, order questions, and wholesale inquiries.',
      path: '/contact',
    }),
  component: ContactPage,
})

function ContactPage() {
  const { supportContent } = Route.useLoaderData()
  const previewDraft = usePreviewDraft()
  const content = resolveSupportContent(previewDraft?.supportContent ?? supportContent)

  return (
    <>
      <PageMasthead eyebrow="Help & support" title="Contact" intro={content.contact.intro} />
      <ContactPanel contact={content.contact} />
      <DocFooterCta message="Prefer to browse first? Everything about fit and care is a click away.">
        <SafeLink href="/faq" className={DOC_CTA_PRIMARY_CLASS}>
          Read the FAQ
        </SafeLink>
        <SafeLink href="/care-guide" className={DOC_CTA_SECONDARY_CLASS}>
          Care guide
        </SafeLink>
      </DocFooterCta>
    </>
  )
}
