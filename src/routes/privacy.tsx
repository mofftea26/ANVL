import { createFileRoute } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import { ContentPage } from '@/shared/components/layout/ContentPage'

export const Route = createFileRoute('/privacy')({
  head: () =>
    buildSeoMeta({
      title: 'Privacy Policy | ANVL Athletics',
      description: 'Privacy policy for ANVL Athletics storefront.',
      path: '/privacy',
    }),
  component: PrivacyPage,
})

function PrivacyPage() {
  return (
    <ContentPage
      title="Privacy Policy"
      intro="ANVL Athletics collects only the personal data required to fulfill orders and support customers."
    >
      <p>We process contact and shipping information strictly for order fulfillment and support.</p>
      <p>Analytics events are currently mocked in development and can be replaced by compliant providers later.</p>
    </ContentPage>
  )
}
