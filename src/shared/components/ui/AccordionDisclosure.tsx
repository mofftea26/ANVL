import type { ReactNode } from 'react'

/**
 * Lightweight accessible accordion using native `<details>`.
 *
 * a11y notes (audit RESP-14):
 * - The chevron is purely decorative and is marked `aria-hidden="true"`
 *   so screen readers don't announce the "▼" glyph as a separate token.
 * - `<summary>` gets the `focus-ring` utility so keyboard users see a
 *   visible focus state matching the rest of the storefront chrome.
 */
export function AccordionDisclosure({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <details className="group rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
      <summary className="focus-ring cursor-pointer list-none rounded font-semibold text-[var(--color-heading)] marker:hidden [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between gap-2">
          {title}
          <span
            aria-hidden="true"
            className="text-xs text-[var(--color-text-muted)] group-open:rotate-180"
          >
            ▼
          </span>
        </span>
      </summary>
      <div className="mt-3 text-sm text-[var(--color-text-muted)]">{children}</div>
    </details>
  )
}
