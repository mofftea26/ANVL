import { createFileRoute } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import { ContentPage } from '@/shared/components/layout/ContentPage'

export const Route = createFileRoute('/terms')({
  head: () =>
    buildSeoMeta({
      title: 'Terms of Service | ANVL Athletics',
      description: 'Terms and conditions for ANVL Athletics purchases.',
      path: '/terms',
    }),
  component: TermsPage,
})

function TermsPage() {
  return (
    <ContentPage
      title="Terms of Service"
      intro="By ordering from ANVL Athletics, you agree to our order, payment, and shipping terms."
    >
      <p>All orders are subject to stock availability and final verification.</p>
      <p>Payment method placeholders are mocked in this build and intended for provider integration.</p>
    </ContentPage>
  )
}
