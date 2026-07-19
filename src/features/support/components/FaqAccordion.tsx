import { Container, Section } from '@/shared/components/ui'
import { AccordionDisclosure } from '@/shared/components/ui/AccordionDisclosure'
import { JsonLd } from '@/shared/components/seo/JsonLd'
import { ProseBody, splitParagraphs } from './ProseBody'
import type { ResolvedFaqItem } from '@/features/cms/support/resolveSupportContent'

/** Builds schema.org FAQPage structured data from the resolved FAQ items. */
export function faqPageJsonLd(items: ResolvedFaqItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        // Collapse blank-line paragraph breaks to spaces for the plain-text
        // schema value (the visible answer keeps its paragraphs).
        text: splitParagraphs(item.answer).join(' '),
      },
    })),
  }
}

/**
 * FAQ page body — an accessible `<details>` accordion (one row per question)
 * plus a schema.org FAQPage JSON-LD block for rich results. Static HTML.
 */
export function FaqAccordion({ items }: { items: ResolvedFaqItem[] }) {
  if (items.length === 0) return null
  return (
    <Section>
      <Container className="max-w-3xl">
        <JsonLd data={faqPageJsonLd(items)} />
        <div className="space-y-3">
          {items.map((item) => (
            <AccordionDisclosure key={item.id} title={item.question}>
              <ProseBody body={item.answer} />
            </AccordionDisclosure>
          ))}
        </div>
      </Container>
    </Section>
  )
}
