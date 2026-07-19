import { createFileRoute } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import { loadStorefrontProjection } from '@/features/cms/api/loadStorefrontProjection'
import { resolveLegalPage } from '@/features/cms/legal/resolveLegalContent'
import { LegalDocumentRoute } from '@/features/legal/components'

export const Route = createFileRoute('/privacy')({
  loader: async () => {
    const projection = await loadStorefrontProjection()
    return { legalContent: projection.legalContent }
  },
  head: ({ loaderData }) => {
    const page = loaderData
      ? resolveLegalPage(loaderData.legalContent, 'privacy')
      : null
    return buildSeoMeta({
      title: `${page?.title ?? 'Privacy Policy'} | ANVL Athletics`,
      description:
        page?.intro ?? 'Privacy policy for the ANVL Athletics storefront.',
      path: '/privacy',
    })
  },
  component: PrivacyPage,
})

function PrivacyPage() {
  const { legalContent } = Route.useLoaderData()
  return <LegalDocumentRoute pageKey="privacy" publishedContent={legalContent} />
}
