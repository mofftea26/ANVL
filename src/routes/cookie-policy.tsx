import { createFileRoute } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import { loadStorefrontProjection } from '@/features/cms/api/loadStorefrontProjection'
import { resolveLegalPage } from '@/features/cms/legal/resolveLegalContent'
import { LegalDocumentRoute } from '@/features/legal/components'

export const Route = createFileRoute('/cookie-policy')({
  loader: async () => {
    const projection = await loadStorefrontProjection()
    return { legalContent: projection.legalContent }
  },
  head: ({ loaderData }) => {
    const page = loaderData ? resolveLegalPage(loaderData.legalContent, 'cookies') : null
    return buildSeoMeta({
      title: `${page?.title ?? 'Cookie Policy'} | ANVL Athletics`,
      description:
        page?.intro ?? 'How ANVL Athletics uses cookies and similar technologies.',
      path: '/cookie-policy',
    })
  },
  component: CookiePolicyPage,
})

function CookiePolicyPage() {
  const { legalContent } = Route.useLoaderData()
  return <LegalDocumentRoute pageKey="cookies" publishedContent={legalContent} />
}
