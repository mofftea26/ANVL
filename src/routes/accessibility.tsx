import { createFileRoute } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import { loadStorefrontProjection } from '@/features/cms/api/loadStorefrontProjection'
import { resolveLegalPage } from '@/features/cms/legal/resolveLegalContent'
import { LegalDocumentRoute } from '@/features/legal/components'

export const Route = createFileRoute('/accessibility')({
  loader: async () => {
    const projection = await loadStorefrontProjection()
    return { legalContent: projection.legalContent }
  },
  head: ({ loaderData }) => {
    const page = loaderData ? resolveLegalPage(loaderData.legalContent, 'accessibility') : null
    return buildSeoMeta({
      title: `${page?.title ?? 'Accessibility Statement'} | ANVL Athletics`,
      description:
        page?.intro ??
        'ANVL Athletics is committed to WCAG 2.1 AA — keyboard access, screen-reader support, contrast, and reduced-motion.',
      path: '/accessibility',
    })
  },
  component: AccessibilityPage,
})

function AccessibilityPage() {
  const { legalContent } = Route.useLoaderData()
  return <LegalDocumentRoute pageKey="accessibility" publishedContent={legalContent} />
}
