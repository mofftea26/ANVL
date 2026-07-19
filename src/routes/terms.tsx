import { createFileRoute } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import { loadStorefrontProjection } from '@/features/cms/api/loadStorefrontProjection'
import { resolveLegalPage } from '@/features/cms/legal/resolveLegalContent'
import { LegalDocumentRoute } from '@/features/legal/components'

export const Route = createFileRoute('/terms')({
  loader: async () => {
    const projection = await loadStorefrontProjection()
    return { legalContent: projection.legalContent }
  },
  head: ({ loaderData }) => {
    const page = loaderData ? resolveLegalPage(loaderData.legalContent, 'terms') : null
    return buildSeoMeta({
      title: `${page?.title ?? 'Terms of Service'} | ANVL Athletics`,
      description:
        page?.intro ?? 'Terms and conditions for ANVL Athletics purchases.',
      path: '/terms',
    })
  },
  component: TermsPage,
})

function TermsPage() {
  const { legalContent } = Route.useLoaderData()
  return <LegalDocumentRoute pageKey="terms" publishedContent={legalContent} />
}
