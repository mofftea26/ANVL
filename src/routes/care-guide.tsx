import { createFileRoute } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import { ContentPage } from '@/shared/components/layout/ContentPage'

export const Route = createFileRoute('/care-guide')({
  head: () =>
    buildSeoMeta({
      title: 'Care Guide | ANVL Athletics',
      description: 'Care instructions for ANVL premium gymwear pieces.',
      path: '/care-guide',
    }),
  component: CareGuidePage,
})

function CareGuidePage() {
  return (
    <ContentPage title="Care Guide" intro="Keep every ANVL piece structured, clean, and long-lasting.">
      <p>Wash cold, inside out, with similar colors.</p>
      <p>Avoid harsh tumble drying to preserve shape and print durability.</p>
      <p>For compression products, lay flat to dry and avoid high heat.</p>
    </ContentPage>
  )
}
