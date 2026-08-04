import { splitParagraphs } from '../ProseBody'
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
