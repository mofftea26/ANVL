import { createFileRoute, Link } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import { ContentPage } from '@/shared/components/layout/ContentPage'

export const Route = createFileRoute('/cookie-policy')({
  head: () =>
    buildSeoMeta({
      title: 'Cookie Policy | ANVL Athletics',
      description: 'How ANVL Athletics uses cookies and similar technologies.',
      path: '/cookie-policy',
    }),
  component: CookiePolicyPage,
})

function CookiePolicyPage() {
  return (
    <ContentPage
      title="Cookie Policy"
      intro="ANVL Athletics uses a small number of cookies to keep the storefront and your account working correctly."
    >
      <p>
        <strong>Essential cookies</strong> keep you signed in, remember items in your cart, and secure the admin
        CMS login. The site does not function correctly without these.
      </p>
      <p>
        <strong>Preference cookies</strong> remember choices like your selected size or theme where applicable.
      </p>
      <p>
        We do not currently use third-party advertising or cross-site tracking cookies. See our{' '}
        <Link to="/privacy" className="underline underline-offset-4 hover:text-[var(--color-text)]">
          Privacy Policy
        </Link>{' '}
        for how we handle personal data more broadly.
      </p>
    </ContentPage>
  )
}
