import { createFileRoute } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import { ContentPage } from '@/shared/components/layout/ContentPage'

export const Route = createFileRoute('/contact')({
  head: () =>
    buildSeoMeta({
      title: 'Contact | ANVL Athletics',
      description: 'Contact ANVL Athletics for support, wholesale, and collaboration.',
      path: '/contact',
    }),
  component: ContactPage,
})

function ContactPage() {
  return (
    <ContentPage
      title="Contact"
      intro="For support, order questions, and wholesale inquiries, reach out to ANVL Athletics."
    >
      <p>Email: support@anvlathletics.com</p>
      <p>Instagram: @anvlathletics</p>
      <p>Location: Lebanon</p>
    </ContentPage>
  )
}
