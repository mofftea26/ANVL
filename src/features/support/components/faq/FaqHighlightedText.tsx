import { Fragment } from 'react'
import { highlightSegments } from './faqSearch'

/**
 * Renders `text` with every search hit wrapped in a molten `<mark>`. With an
 * empty query this is exactly the plain string (one unmatched segment), so it
 * costs nothing on the default view.
 */
export function FaqHighlightedText({ text, query }: { text: string; query: string }) {
  const segments = highlightSegments(text, query)
  return (
    <>
      {segments.map((segment, index) =>
        segment.match ? (
          <mark key={index} className="anvl-faq-mark">
            {segment.text}
          </mark>
        ) : (
          <Fragment key={index}>{segment.text}</Fragment>
        ),
      )}
    </>
  )
}
