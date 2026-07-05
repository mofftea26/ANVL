import { createFileRoute, Link } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import { ContentPage } from '@/shared/components/layout/ContentPage'
import { AccordionDisclosure } from '@/shared/components/ui/AccordionDisclosure'

export const Route = createFileRoute('/faq')({
  head: () =>
    buildSeoMeta({
      title: 'FAQ | ANVL Athletics',
      description: 'Frequently asked questions about sizing, shipping, care, and orders at ANVL Athletics.',
      path: '/faq',
    }),
  component: FaqPage,
})

function FaqPage() {
  return (
    <ContentPage title="FAQ" intro="Answers to the questions we hear most about sizing, shipping, care, and orders.">
      <div className="space-y-3 not-prose">
        <AccordionDisclosure title="How do I find my size?">
          <p>
            Use our{' '}
            <Link to="/size-guide" className="underline underline-offset-4 hover:text-[var(--color-text)]">
              Size Guide
            </Link>{' '}
            for full measurements and the Lebanon/EU conversion table. Every product page also has a size chart
            and, if you are signed in with saved measurements, a personalized size suggestion next to the size
            selector.
          </p>
        </AccordionDisclosure>
        <AccordionDisclosure title="How do I care for my ANVL pieces?">
          <p>
            See our{' '}
            <Link to="/care-guide" className="underline underline-offset-4 hover:text-[var(--color-text)]">
              Care Guide
            </Link>{' '}
            for wash and dry instructions. Product-specific care notes are also listed on each product page.
          </p>
        </AccordionDisclosure>
        <AccordionDisclosure title="What are your shipping times?">
          <p>
            Orders are processed within 1&ndash;3 business days. Delivery times vary by destination and are
            confirmed at checkout before you pay.
          </p>
        </AccordionDisclosure>
        <AccordionDisclosure title="What is your returns policy?">
          <p>
            Unworn items in original condition can be returned within 14 days of delivery. Full details are on our{' '}
            <Link to="/returns" className="underline underline-offset-4 hover:text-[var(--color-text)]">
              Returns
            </Link>{' '}
            page.
          </p>
        </AccordionDisclosure>
        <AccordionDisclosure title="How can I track or change my order?">
          <p>
            Signed-in customers can view order status under Account &rarr; Orders. For changes or urgent
            questions, reach out via our{' '}
            <Link to="/contact" className="underline underline-offset-4 hover:text-[var(--color-text)]">
              Contact
            </Link>{' '}
            page.
          </p>
        </AccordionDisclosure>
      </div>
    </ContentPage>
  )
}
