import { createFileRoute } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import { ContentPage } from '@/shared/components/layout/ContentPage'

export const Route = createFileRoute('/returns')({
  head: () =>
    buildSeoMeta({
      title: 'Returns Policy | ANVL Athletics',
      description: 'Returns and exchanges policy for ANVL Athletics.',
      path: '/returns',
    }),
  component: ReturnsPage,
})

function ReturnsPage() {
  return (
    <ContentPage title="Returns" intro="Returns are accepted on unworn items within 14 days of delivery.">
      <p>Items must be in original condition with tags and packaging.</p>
      <p>Compression garments are eligible only if unworn and hygiene-sealed condition is preserved.</p>
    </ContentPage>
  )
}
