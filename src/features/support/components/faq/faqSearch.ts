import type { ResolvedFaqItem } from '@/features/cms/support/resolveSupportContent'

/**
 * Client-side matching for the FAQ forge's instant search.
 *
 * Deliberately a plain normalized substring scan rather than Fuse.js: the FAQ
 * is a handful of items already in memory, the global search engine's fuzzy
 * ranking would mis-highlight (it matches non-contiguous characters), and this
 * keeps the support chunk free of the search vendor. Pure + SSR-safe.
 */

/** One run of text, flagged for whether it is part of a search hit. */
export type FaqTextSegment = { text: string; match: boolean }

export function normalizeFaqQuery(query: string): string {
  return query.trim().toLowerCase()
}

export function faqItemMatches(item: ResolvedFaqItem, query: string): boolean {
  const q = normalizeFaqQuery(query)
  if (!q) return true
  return (
    item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
  )
}

export function filterFaqItems(
  items: ResolvedFaqItem[],
  query: string,
): ResolvedFaqItem[] {
  if (!normalizeFaqQuery(query)) return items
  return items.filter((item) => faqItemMatches(item, query))
}

/**
 * Splits `text` into alternating plain/matched runs so the row can wrap hits in
 * a molten `<mark>`. Case-insensitive; the returned segments always re-join to
 * exactly the original string.
 */
export function highlightSegments(text: string, query: string): FaqTextSegment[] {
  const q = normalizeFaqQuery(query)
  if (!q) return [{ text, match: false }]

  const haystack = text.toLowerCase()
  const segments: FaqTextSegment[] = []
  let cursor = 0

  while (cursor < text.length) {
    const at = haystack.indexOf(q, cursor)
    if (at === -1) {
      segments.push({ text: text.slice(cursor), match: false })
      break
    }
    if (at > cursor) segments.push({ text: text.slice(cursor, at), match: false })
    segments.push({ text: text.slice(at, at + q.length), match: true })
    cursor = at + q.length
  }

  return segments.filter((segment) => segment.text.length > 0)
}
