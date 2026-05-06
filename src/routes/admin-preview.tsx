import { createFileRoute, redirect } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import { ContentPage } from '@/shared/components/layout/ContentPage'

export const Route = createFileRoute('/admin-preview')({
  beforeLoad: () => {
    const enabled = import.meta.env.VITE_ADMIN_PREVIEW_ENABLED === 'true'
    if (!enabled) {
      throw redirect({ to: '/' })
    }
  },
  head: () =>
    buildSeoMeta({
      title: 'Admin Preview | ANVL Athletics',
      description: 'Protected preview route for future CMS content workflows.',
      path: '/admin-preview',
    }),
  component: AdminPreviewPage,
})

function AdminPreviewPage() {
  return (
    <ContentPage
      title="Admin Preview"
      intro="Protected placeholder for future CMS preview sessions."
    />
  )
}
